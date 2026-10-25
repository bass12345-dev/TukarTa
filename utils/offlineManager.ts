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
  /** `title|artist` at download time. Lyrics are fetched again only when this changes. */
  signature?: string;
  status: 'ready' | 'missing_lyrics' | 'failed' | 'downloading' | 'pending';
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

/** Live state of one song while a download runs. */
export type SongDownloadState = 'queued' | 'cached' | 'downloading' | 'ready' | 'missing_lyrics' | 'failed';

export interface OfflineDownloadProgress {
  total: number;
  /** Songs that reached a final state: ready, missing lyrics or failed. */
  done: number;
  /** Songs served from the device without any network request. */
  cached: number;
  /** Current state for every song, keyed by song_id. */
  songs: Record<string, SongDownloadState>;
}

export interface PrepareOfflineOptions {
  /** Songs downloaded at the same time. Default 4, capped at 6. */
  concurrency?: number;
  /**
   * Cancels the run. Songs already in flight finish, the rest stay `pending`, and the partial package
   * is saved. Calling prepareOfflineGigPackage again resumes from there.
   */
  signal?: AbortSignal;
  onProgress?: (progress: OfflineDownloadProgress) => void;
}

interface LyricRecord {
  plain_lyrics: string;
  provider: string;
  signature?: string;
}

interface SetlistEntry {
  itemId: string;
  songId: string;
  title: string;
  artist: string;
  originalKey: string;
  transposedKey: string;
  notes: string;
  position: number;
  signature: string;
}

const OFFLINE_GIG_PREFIX = '@tukarta_offline_gig_';
const OFFLINE_LYRICS_PREFIX = 'offline_lyrics_';
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 6;
/** Persist the package after this many finished songs, and once more at the end. */
const FLUSH_EVERY = 4;

const lyricKey = (songId: string) => `${OFFLINE_LYRICS_PREFIX}${songId}`;

function toEntries(songsList: any[]): SetlistEntry[] {
  return songsList.map((item, i) => {
    const s = item.song || {};
    const songId = s.id || item.id;
    const title = s.title || 'Untitled';
    const artist = s.artist || 'Unknown';
    const originalKey = s.original_key || 'C';
    return {
      itemId: item.id || songId,
      songId,
      title,
      artist,
      originalKey,
      transposedKey: item.transposed_key || originalKey,
      notes: item.notes || '',
      position: item.position || i + 1,
      signature: `${title}|${artist}`,
    };
  });
}

function toSongItem(e: SetlistEntry, lyrics: LyricRecord | null, state: SongDownloadState): OfflineSongItem {
  const status: OfflineSongItem['status'] =
    state === 'ready' || state === 'cached'
      ? 'ready'
      : state === 'missing_lyrics'
      ? 'missing_lyrics'
      : state === 'failed'
      ? 'failed'
      : 'pending';
  return {
    id: e.itemId,
    song_id: e.songId,
    title: e.title,
    artist: e.artist,
    original_key: e.originalKey,
    transposed_key: e.transposedKey,
    notes: e.notes,
    position: e.position,
    plain_lyrics: lyrics?.plain_lyrics ?? '',
    provider: lyrics?.provider ?? '',
    signature: e.signature,
    status,
  };
}

/** One multiGet for every song's local lyric cache, instead of one read per song. */
async function readLyricCache(songIds: string[]): Promise<Map<string, LyricRecord>> {
  const found = new Map<string, LyricRecord>();
  if (songIds.length === 0) return found;
  try {
    const pairs = await AsyncStorage.multiGet(songIds.map(lyricKey));
    for (const [key, raw] of pairs) {
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as LyricRecord;
        if (parsed?.plain_lyrics) found.set(key.slice(OFFLINE_LYRICS_PREFIX.length), parsed);
      } catch {
        // corrupt entry: treat as missing
      }
    }
  } catch (e) {
    console.warn('Could not read offline lyric cache:', e);
  }
  return found;
}

/**
 * Network lookup for one song: the shared lyrics_cache table first, then LRCLIB.
 * Resolves null when neither has lyrics. Throws when LRCLIB itself fails (for example, offline).
 */
async function fetchRemoteLyrics(e: SetlistEntry): Promise<LyricRecord | null> {
  try {
    const { data } = await supabase
      .from('lyrics_cache')
      .select('plain_lyrics, provider')
      .eq('song_id', e.songId)
      .maybeSingle();
    if (data?.plain_lyrics) {
      return { plain_lyrics: data.plain_lyrics, provider: data.provider || 'offline_cache', signature: e.signature };
    }
  } catch {
    // table not reachable (offline or RLS): fall through to LRCLIB
  }
  const fetched = await fetchLyrics(e.artist, e.title);
  if (fetched?.plainLyrics) {
    return { plain_lyrics: fetched.plainLyrics, provider: fetched.provider || 'lrclib', signature: e.signature };
  }
  return null;
}

/** Runs `worker` over `items` with at most `limit` in flight. Stops starting new items once aborted. */
async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!signal?.aborted && next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Downloads lyrics for every song in a setlist so the gig works without signal.
 *
 * - Songs already saved in the package with unchanged title/artist are reused without a request.
 * - Songs whose lyrics are in the local cache are reused the same way.
 * - Only the remaining songs are fetched, up to `concurrency` at a time.
 * - Storage is written in batches: one multiSet every few songs, plus one at the end.
 * - Cancelling keeps everything finished so far. Running it again resumes.
 */
export async function prepareOfflineGigPackage(
  gigId: string,
  setlistId: string,
  gigInfo: { name: string; venue?: string; gig_date?: string; band?: { name: string } },
  songsList: any[],
  options: PrepareOfflineOptions = {}
): Promise<OfflineGigPackage> {
  const concurrency = Math.min(MAX_CONCURRENCY, Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY));
  const { signal, onProgress } = options;

  const entries = toEntries(songsList);
  const total = entries.length;

  const previous = await getOfflineGigPackage(setlistId);
  const previousById = new Map((previous?.songs ?? []).map((s) => [s.song_id, s]));
  const localLyrics = await readLyricCache(entries.map((e) => e.songId));

  const states: Record<string, SongDownloadState> = {};
  entries.forEach((e) => (states[e.songId] = 'queued'));
  const results = new Map<string, OfflineSongItem>();
  let done = 0;
  let cachedCount = 0;

  const emit = () => onProgress?.({ total, done, cached: cachedCount, songs: { ...states } });
  const setState = (songId: string, state: SongDownloadState) => {
    states[songId] = state;
    emit();
  };

  const buildPackage = (): OfflineGigPackage => {
    const songs = entries.map((e) => results.get(e.songId) ?? toSongItem(e, null, 'queued'));
    return {
      gigId,
      setlistId,
      gigName: gigInfo.name,
      venue: gigInfo.venue,
      gigDate: gigInfo.gig_date,
      bandName: gigInfo.band?.name,
      songs,
      savedAt: Date.now(),
      sizeBytes: songs.reduce((bytes, s) => bytes + (s.plain_lyrics?.length ?? 0) * 2, 0), // rough UTF-16 estimate
    };
  };

  // Batched persistence: lyric entries and the package snapshot go out in one multiSet
  const pendingWrites: [string, string][] = [];
  let finishedSinceFlush = 0;
  let writeChain: Promise<unknown> = Promise.resolve();
  const flush = (force: boolean) => {
    if (!force && finishedSinceFlush < FLUSH_EVERY) return writeChain;
    finishedSinceFlush = 0;
    const batch = pendingWrites.splice(0);
    batch.push([`${OFFLINE_GIG_PREFIX}${setlistId}`, JSON.stringify(buildPackage())]);
    writeChain = writeChain
      .then(() => AsyncStorage.multiSet(batch))
      .catch((e) => console.warn('Offline package save failed:', e));
    return writeChain;
  };

  const processEntry = async (e: SetlistEntry) => {
    if (signal?.aborted) return; // cancelled: leave it pending for a resume

    const prev = previousById.get(e.songId);
    const local = localLyrics.get(e.songId);
    let lyrics: LyricRecord | null = null;
    let state: SongDownloadState;

    if (prev?.status === 'ready' && prev.plain_lyrics && prev.signature === e.signature) {
      lyrics = { plain_lyrics: prev.plain_lyrics, provider: prev.provider || 'offline_cache', signature: e.signature };
      state = 'cached';
    } else if (local && local.signature === e.signature) {
      lyrics = local;
      state = 'cached';
    } else {
      setState(e.songId, 'downloading');
      try {
        lyrics = await fetchRemoteLyrics(e);
        state = lyrics ? 'ready' : 'missing_lyrics';
      } catch (err) {
        console.warn(`Could not fetch lyrics for ${e.title}:`, err);
        state = 'failed';
      }
      if (lyrics) pendingWrites.push([lyricKey(e.songId), JSON.stringify(lyrics)]);
    }

    results.set(e.songId, toSongItem(e, lyrics, state));
    if (state === 'cached') cachedCount++;
    done++;
    finishedSinceFlush++;
    setState(e.songId, state);
    flush(false);
  };

  await runPool(entries, concurrency, processEntry, signal);
  await flush(true);
  return buildPackage();
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

/**
 * Lists every gig package saved on this device (most recently saved first).
 * Works without a network or a signed-in account, so the Offline Gig Mode home can show them.
 */
export async function listOfflineGigPackages(): Promise<OfflineGigPackage[]> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(OFFLINE_GIG_PREFIX));
    if (keys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(keys);
    const packages: OfflineGigPackage[] = [];
    for (const [, raw] of pairs) {
      if (!raw) continue;
      try {
        const pkg = JSON.parse(raw) as OfflineGigPackage;
        if (pkg?.setlistId && Array.isArray(pkg.songs)) packages.push(pkg);
      } catch {}
    }
    return packages.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch (e) {
    console.warn('Failed to list offline gig packages:', e);
    return [];
  }
}
