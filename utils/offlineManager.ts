import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getLyrics as fetchLyrics } from './musicApi';

export interface OfflineSongItem {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  original_key: string;
  transposed_key?: string;
  notes?: string;
  position: number;
  plain_lyrics?: string;
  provider?: string;
  status: 'ready' | 'missing_lyrics' | 'downloading' | 'failed';
}

export interface OfflineGigPackage {
  gigId: string;
  setlistId: string;
  gigName: string;
  venue?: string;
  gigDate?: string;
  bandName?: string;
  songs: OfflineSongItem[];
  savedAt: number;
  sizeBytes: number;
}

const OFFLINE_GIG_PREFIX = '@tukarta_offline_gig_';
const OFFLINE_LYRICS_PREFIX = 'offline_lyrics_';

/**
 * Checks if a specific song has lyrics/chords stored in local cache
 */
export async function checkSongOfflineStatus(
  songId: string,
  artist: string,
  title: string
): Promise<{ hasLyrics: boolean; plain_lyrics?: string; provider?: string }> {
  try {
    // 1. Check local AsyncStorage cache
    const cached = await AsyncStorage.getItem(`${OFFLINE_LYRICS_PREFIX}${songId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.plain_lyrics) {
        return { hasLyrics: true, plain_lyrics: parsed.plain_lyrics, provider: parsed.provider };
      }
    }

    // 2. Check Supabase lyrics_cache table (if online)
    if (songId) {
      const { data } = await supabase
        .from('lyrics_cache')
        .select('plain_lyrics, provider')
        .eq('song_id', songId)
        .maybeSingle();

      if (data?.plain_lyrics) {
        // Save to local cache immediately
        await AsyncStorage.setItem(
          `${OFFLINE_LYRICS_PREFIX}${songId}`,
          JSON.stringify({ plain_lyrics: data.plain_lyrics, provider: data.provider })
        );
        return { hasLyrics: true, plain_lyrics: data.plain_lyrics, provider: data.provider };
      }
    }

    return { hasLyrics: false };
  } catch (e) {
    return { hasLyrics: false };
  }
}

/**
 * Pre-fetches and saves all lyrics, chords, and metadata for a setlist
 */
export async function prepareOfflineGigPackage(
  gigId: string,
  setlistId: string,
  gigInfo: { name: string; venue?: string; gig_date?: string; band?: { name: string } },
  songsList: any[],
  onProgress?: (progress: number, currentTitle: string) => void
): Promise<OfflineGigPackage> {
  const packagedSongs: OfflineSongItem[] = [];
  let totalBytes = 0;

  for (let i = 0; i < songsList.length; i++) {
    const item = songsList[i];
    const s = item.song || {};
    const songId = s.id || item.id;
    const title = s.title || 'Untitled';
    const artist = s.artist || 'Unknown';

    if (onProgress) {
      onProgress(Math.round(((i + 1) / songsList.length) * 100), title);
    }

    // Check existing offline cache
    let status: OfflineSongItem['status'] = 'missing_lyrics';
    let plainLyrics = '';
    let provider = '';

    const check = await checkSongOfflineStatus(songId, artist, title);
    if (check.hasLyrics && check.plain_lyrics) {
      status = 'ready';
      plainLyrics = check.plain_lyrics;
      provider = check.provider || 'offline_cache';
    } else {
      // Try fetching from music API (LRCLIB) while online
      try {
        const fetched = await fetchLyrics(artist, title);
        if (fetched?.plainLyrics) {
          plainLyrics = fetched.plainLyrics;
          provider = fetched.provider || 'lrclib';
          status = 'ready';

          // Cache locally
          await AsyncStorage.setItem(
            `${OFFLINE_LYRICS_PREFIX}${songId}`,
            JSON.stringify({ plain_lyrics: plainLyrics, provider })
          );
        }
      } catch (e) {
        console.warn(`Could not fetch lyrics for ${title}:`, e);
      }
    }

    totalBytes += plainLyrics.length * 2; // rough UTF-16 byte estimate

    packagedSongs.push({
      id: item.id || songId,
      song_id: songId,
      title,
      artist,
      original_key: s.original_key || 'C',
      transposed_key: item.transposed_key || s.original_key || 'C',
      notes: item.notes || '',
      position: item.position || i + 1,
      plain_lyrics: plainLyrics,
      provider,
      status,
    });
  }

  const gigPackage: OfflineGigPackage = {
    gigId,
    setlistId,
    gigName: gigInfo.name,
    venue: gigInfo.venue,
    gigDate: gigInfo.gig_date,
    bandName: gigInfo.band?.name,
    songs: packagedSongs,
    savedAt: Date.now(),
    sizeBytes: totalBytes,
  };

  // Save full gig snapshot locally
  await AsyncStorage.setItem(
    `${OFFLINE_GIG_PREFIX}${setlistId}`,
    JSON.stringify(gigPackage)
  );

  return gigPackage;
}

/**
 * Retrieves the offline gig package from local storage
 */
export async function getOfflineGigPackage(
  setlistId: string
): Promise<OfflineGigPackage | null> {
  try {
    const raw = await AsyncStorage.getItem(`${OFFLINE_GIG_PREFIX}${setlistId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load offline gig package:', e);
    return null;
  }
}

/**
 * Removes an offline gig package from local storage
 */
export async function deleteOfflineGigPackage(setlistId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${OFFLINE_GIG_PREFIX}${setlistId}`);
  } catch (e) {
    console.warn('Failed to delete offline gig package:', e);
  }
}
