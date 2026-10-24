/**
 * musicApi.ts
 * Integration with LRCLIB, iTunes, and TheAudioDB for song search, metadata, and lyrics.
 */

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
  retries = 2,
  baseDelay = 600,
  timeoutMs = 7000
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);
      if (res.ok) return res;
      if (res.status !== 503 && res.status !== 429 && res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (timer) clearTimeout(timer);
      lastErr = e;
    }
    if (attempt < retries) await sleep(baseDelay * Math.pow(2, attempt));
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
 * 1) Exact match via /api/get?artist_name=...&track_name=...
 * 2) Fuzzy search fallback via /api/search?q=... if exact match 404s
 * 3) Fallback to lyrics.ovh if LRCLIB is overloaded
 */
export async function getLyrics(artist: string, title: string) {
  const cleanArtist = (artist || '').replace(/unknown artist/i, '').trim();
  const cleanTitle = (title || '').trim();

  // 1. Exact LRCLIB match
  if (cleanArtist && cleanTitle) {
    try {
      const url = `${LRCLIB_URL}/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const response = await fetchWithRetry(url, 2, 500);
      if (response.ok) {
        const data = await response.json();
        if (data?.plainLyrics || data?.syncedLyrics) {
          return data;
        }
      }
    } catch (error) {
      console.warn('LRCLIB /get fallback triggered:', error);
    }
  }

  // 2. Fuzzy LRCLIB search fallback (handles slight title/artist variations like "(Remastered)" or "feat.")
  try {
    const query = `${cleanTitle} ${cleanArtist}`.trim();
    const searchUrl = `${LRCLIB_URL}/search?q=${encodeURIComponent(query)}`;
    const searchRes = await fetchWithRetry(searchUrl, 2, 500);
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const withLyrics = items.find((i: any) => i.plainLyrics || i.syncedLyrics) || items[0];
        if (withLyrics && (withLyrics.plainLyrics || withLyrics.syncedLyrics)) {
          return {
            plainLyrics: withLyrics.plainLyrics || null,
            syncedLyrics: withLyrics.syncedLyrics || null,
          };
        }
      }
    }
  } catch (error) {
    console.warn('LRCLIB /search lyrics fallback failed:', error);
  }

  // 3. Secondary free lyrics fallback (lyrics.ovh) when LRCLIB is down
  if (cleanArtist && cleanTitle) {
    try {
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      const ovhRes = await fetchWithRetry(ovhUrl, 1, 400, 5000);
      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData?.lyrics) {
          return {
            plainLyrics: ovhData.lyrics.trim(),
            syncedLyrics: null,
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
 * Combines search results with metadata for a better UI experience.
 */
export async function searchAndEnrichSongs(query: string): Promise<SongResult[]> {
  return searchSongs(query);
}
