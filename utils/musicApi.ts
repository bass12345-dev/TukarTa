/**
 * musicApi.ts
 * Integration with LRCLIB, iTunes, Deezer, and Supabase Edge Functions for song search, metadata, real BPM, and lyrics.
 */
import { supabase } from './supabase';

export interface SongResult {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: string;
  hasLyrics: boolean;
  coverArt?: string;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const LRCLIB_URL = 'https://lrclib.net/api';
const THEAUDIODB_API_KEY = '123'; // Free test key from their documentation
const THEAUDIODB_URL = `https://www.theaudiodb.com/api/v1/json/${THEAUDIODB_API_KEY}`;

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with retry + exponential backoff + timeout for transient errors (503 ServerOverloaded, 429, network).
 */
async function fetchWithRetry(
  url: string,
  retries = 3,
  baseDelay = 700,
  timeoutMs = 7500
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TukarTa/1.0 (https://tukarta.app)',
        },
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);
      if (res.ok || res.status === 404 || (res.status >= 400 && res.status < 500 && res.status !== 429)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (timer) clearTimeout(timer);
      lastErr = e;
    }
    if (attempt < retries) await sleep(baseDelay * Math.pow(1.5, attempt));
  }
  throw lastErr;
}

async function searchLrclib(query: string): Promise<SongResult[]> {
  const response = await fetchWithRetry(`${LRCLIB_URL}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('LRCLIB search failed');
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    id: item.id,
    title: item.trackName,
    artist: item.artistName,
    album: item.albumName,
    duration: formatDuration(Math.round(item.duration)),
    hasLyrics: !!(item.plainLyrics || item.syncedLyrics),
    plainLyrics: item.plainLyrics || undefined,
    syncedLyrics: item.syncedLyrics || undefined,
  }));
}

/** Keyless metadata fallback (title/artist/album/genre) when LRCLIB is overloaded (503) or returns empty. */
async function searchItunes(query: string): Promise<SongResult[]> {
  const response = await fetchWithRetry(
    `https://itunes.apple.com/search?media=music&entity=song&limit=25&term=${encodeURIComponent(query)}`,
    1,
    500,
    6000
  );
  if (!response.ok) throw new Error('iTunes search failed');
  const data = await response.json();
  return (data.results || []).map((item: any) => ({
    id: `itunes-${item.trackId}`,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    genre: item.primaryGenreName,
    duration: formatDuration(Math.round((item.trackTimeMillis || 0) / 1000)),
    hasLyrics: false,
    coverArt: item.artworkUrl100,
  }));
}

/**
 * Searches songs: LRCLIB first (retrying on 503), falling back to iTunes metadata.
 * Lyrics are saved immediately if present in LRCLIB search or fetched later at preparation time via getLyrics().
 */
export async function searchSongs(query: string): Promise<SongResult[]> {
  try {
    const results = await searchLrclib(query);
    if (results.length > 0) return results;
  } catch (error) {
    console.warn('LRCLIB unavailable, falling back to iTunes:', error);
  }
  try {
    return await searchItunes(query);
  } catch (error) {
    console.error('Song search failed on all providers:', error);
    return [];
  }
}

/**
 * Fetches additional metadata (genre, artist image) from TheAudioDB.
 */
export async function getArtistMetadata(artist: string) {
  try {
    const response = await fetch(`${THEAUDIODB_URL}/search.php?s=${encodeURIComponent(artist)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.artists || data.artists.length === 0) return null;

    const artistData = data.artists[0];
    return {
      genre: artistData.strGenre,
      style: artistData.strStyle,
      thumbnail: artistData.strArtistThumb,
      biography: artistData.strBiographyEN,
    };
  } catch (error) {
    console.error('TheAudioDB Error:', error);
    return null;
  }
}

/**
 * Fetches lyrics from LRCLIB:
 * 1) Strips placeholder artist names ("Audience Request", "Unknown", etc.)
 * 2) Exact match via /api/get?artist_name=...&track_name=... (if artist is real)
 * 3) Fuzzy search fallback via /api/search?q=... (handles title-only requests or variations)
 * 4) Fallback to lyrics.ovh if LRCLIB has no lyrics or is overloaded
 */
export async function getLyrics(artist: string, title: string) {
  // Strip placeholder / dummy artist strings so title-only requests search cleanly
  const cleanArtist = (artist || '')
    .replace(/\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi, '')
    .trim();
  const cleanTitle = (title || '').trim();

  if (!cleanTitle) return null;

  // 1. Exact LRCLIB match when a real artist name is provided
  if (cleanArtist) {
    try {
      const url = `${LRCLIB_URL}/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const response = await fetchWithRetry(url, 2, 500);
      if (response.ok) {
        const data = await response.json();
        if (data?.plainLyrics || data?.syncedLyrics) {
          return {
            plainLyrics: data.plainLyrics || null,
            syncedLyrics: data.syncedLyrics || null,
            artist: data.artistName || cleanArtist,
            trackName: data.trackName || cleanTitle,
            provider: 'lrclib',
          };
        }
      }
    } catch (error: any) {
      if (error?.message && !error.message.includes('404')) { console.warn('LRCLIB /get fallback triggered:', error); }
    }
  }

  // 2. LRCLIB search fallback: handles title-only audience requests & fuzzy variations
  let discoveredArtist = cleanArtist;
  try {
    const query = cleanArtist ? `${cleanTitle} ${cleanArtist}`.trim() : cleanTitle;
    const searchUrl = `${LRCLIB_URL}/search?q=${encodeURIComponent(query)}`;
    const searchRes = await fetchWithRetry(searchUrl, 3, 700);
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const withLyrics = items.find((i: any) => i.plainLyrics || i.syncedLyrics);
        if (withLyrics && (withLyrics.plainLyrics || withLyrics.syncedLyrics)) {
          return {
            plainLyrics: withLyrics.plainLyrics || null,
            syncedLyrics: withLyrics.syncedLyrics || null,
            artist: withLyrics.artistName || cleanArtist,
            trackName: withLyrics.trackName || cleanTitle,
            provider: 'lrclib',
          };
        }
        if (!discoveredArtist && items[0]?.artistName) {
          discoveredArtist = items[0].artistName;
        }
      }
    }
  } catch (error) {
    console.warn('LRCLIB /search lyrics fallback failed:', error);
  }

  // 3. Secondary free lyrics fallback (lyrics.ovh) when LRCLIB has no lyrics
  const artistForOvh = cleanArtist || discoveredArtist;
  if (artistForOvh && cleanTitle) {
    try {
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistForOvh)}/${encodeURIComponent(cleanTitle)}`;
      const ovhRes = await fetchWithRetry(ovhUrl, 1, 400, 5000);
      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData?.lyrics) {
          return {
            plainLyrics: ovhData.lyrics.trim(),
            syncedLyrics: null,
            artist: artistForOvh,
            trackName: cleanTitle,
            provider: 'lyrics.ovh',
          };
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  return null;
}

/**
 * Fetches real song BPM / tempo, duration (sec), and verified artist from online sources (Deezer + Web tempo scrape)
 * via our server-side Supabase Edge Function (CORS-safe on Web & Native), with direct native fallback.
 */
export async function fetchSongRealBpm(
  title: string,
  artist?: string
): Promise<{ bpm: number | null; duration: number | null; artist: string | null }> {
  const cleanArtist = (artist || '')
    .replace(/\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi, '')
    .trim();
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return { bpm: null, duration: null, artist: null };

  // 1. Primary: Server-side Supabase Edge Function (zero CORS issues on Web & Mobile)
  try {
    const { data, error } = await supabase.functions.invoke('youtube-minus-one', {
      body: { title: cleanTitle, artist: cleanArtist, mode: 'bpm' },
    });
    if (!error && data && (data.bpm || data.duration)) {
      return {
        bpm: typeof data.bpm === 'number' && data.bpm >= 40 ? Math.round(data.bpm) : null,
        duration: typeof data.duration === 'number' && data.duration > 30 ? Math.round(data.duration) : null,
        artist: data.artist || cleanArtist || null,
      };
    }
  } catch {
    // Fallback to direct Deezer API below
  }

  // 2. Fallback: Direct Deezer public API (works natively on iOS/Android)
  try {
    const q = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
    const sRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`);
    if (sRes.ok) {
      const sJson = await sRes.json();
      const items = (sJson?.data || []).slice(0, 5);
      for (const item of items) {
        const tRes = await fetch(`https://api.deezer.com/track/${item.id}`);
        if (tRes.ok) {
          const track = await tRes.json();
          if (track && typeof track.bpm === 'number' && track.bpm >= 40) {
            return {
              bpm: Math.round(track.bpm),
              duration: track.duration ? Number(track.duration) : null,
              artist: track.artist?.name || cleanArtist || null,
            };
          }
        }
      }
    }
  } catch {
    // Ignore fallback error
  }

  return { bpm: null, duration: null, artist: null };
}

/**
 * Searches YouTube for the most reliable Minus 1 / Karaoke backing track for a song,
 * sanitizes placeholder artists, and returns the direct videoIds to embed and auto-play.
 * Uses the Supabase `youtube-minus-one` Edge Function first so Web and Mobile never hit CORS limits.
 * `broaden` skips the karaoke-only search and looks for an instrumental version instead (second attempt).
 */
export async function fetchKaraokeVideoIds(
  title: string,
  artist?: string,
  options: { broaden?: boolean } = {}
): Promise<string[]> {
  const cleanArtist = (artist || '')
    .replace(/\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi, '')
    .trim();
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return [];

  // 1. Primary: Supabase Edge Function (server-side YouTube scrape + oEmbed embeddability check, zero CORS)
  if (!options.broaden) {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-minus-one', {
        body: { title: cleanTitle, artist: cleanArtist },
      });
      if (!error && Array.isArray(data?.ids) && data.ids.length > 0) {
        return data.ids;
      }
    } catch (err) {
      console.warn('Edge function youtube-minus-one fallback to direct:', err);
    }
  }

  // 2. Fallback: Direct YouTube search (works on Native Android/iOS without CORS)
  const suffix = options.broaden ? 'instrumental' : 'karaoke minus 1';
  const query = cleanArtist ? `${cleanTitle} ${cleanArtist} ${suffix}` : `${cleanTitle} ${suffix}`;

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (res.ok) {
      const html = await res.text();
      const reg = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
      const ids: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = reg.exec(html)) !== null) {
        if (!ids.includes(m[1])) ids.push(m[1]);
      }
      // Keep only videos that allow embedding (oEmbed returns 401/403 for blocked ones)
      const candidates = ids.slice(0, 8);
      const checks = await Promise.all(
        candidates.map(async (id) => {
          try {
            const r = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
            );
            return r.ok ? id : null;
          } catch {
            return id; // network/CORS hiccup: keep as candidate
          }
        })
      );
      const embeddable = checks.filter((x): x is string => !!x);
      return (embeddable.length > 0 ? embeddable : candidates).slice(0, 6);
    }
  } catch (e) {
    console.warn('YouTube karaoke search failed:', e);
  }
  return [];
}

export async function fetchKaraokeVideoId(title: string, artist?: string): Promise<string | null> {
  const ids = await fetchKaraokeVideoIds(title, artist);
  return ids[0] || null;
}

/**
 * Combines search results with metadata for a better UI experience.
 */
export async function searchAndEnrichSongs(query: string): Promise<SongResult[]> {
  return searchSongs(query);
}
