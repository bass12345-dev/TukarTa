/**
 * musicApi.ts
 * Integration with LRCLIB, iTunes, Deezer, and Supabase Edge Functions for song search, metadata, real BPM, and lyrics.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ─── Backing-track (Minus 1) selection ──────────────────────────────────────────────────────────
// Candidates come from several YouTube searches and are ranked from their titles: true backing tracks
// with no lead vocal rank first; melody, guide vocals, live and cover versions sink. The ranked list is
// cached per song on the device, so the same song loads instantly next time.

export interface BackingCandidate {
  id: string;
  title: string;
  score: number;
}

const BACKING_CACHE_PREFIX = 'backing-track:v2:';
const BACKING_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const YT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const BOOST_RULES: [RegExp, number][] = [
  [/\bminus[\s-]?(one|1)\b/i, 40],
  [/\bbacking[\s-]?tracks?\b/i, 30],
  [/\binstrumental\b/i, 25],
  [/\bno[\s-]?vocals?\b/i, 15],
  [/\bkaraoke\b/i, 5],
];

const PENALTY_RULES: [RegExp, number][] = [
  [/\bmelody\b/i, -50],
  [/\bguide[\s-]?vocals?\b|\bscratch[\s-]?vocals?\b/i, -50],
  [/\bwith[\s-]?vocals?\b|\bvocals?\s+(version|included)\b/i, -40],
  [/\blyrics?\b/i, -20],
  [/\blive\b/i, -30],
  [/\bcover\b/i, -30],
  [/\bsing[\s-]?along\b/i, -15],
];

const normalizeText = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const cleanPlaceholderArtist = (artist?: string) =>
  (artist || '').replace(/\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi, '').trim();

/** Scores one YouTube video title as a backing track for `songTitle` by `artist`. Higher is better. */
export function scoreBackingTitle(videoTitle: string, songTitle: string, artist = ''): number {
  let score = 0;
  for (const [re, weight] of BOOST_RULES) if (re.test(videoTitle)) score += weight;
  for (const [re, weight] of PENALTY_RULES) if (re.test(videoTitle)) score += weight;

  const nt = normalizeText(videoTitle);
  const ns = normalizeText(songTitle);
  const na = normalizeText(artist);
  if (ns && nt.includes(ns)) score += 15;
  else score -= 60; // probably a different song
  if (na && nt.includes(na)) score += 10;
  return score;
}

/** Three searches that cover minus-one uploads, instrumental uploads and backing-track uploads. */
export function buildBackingQueries(title: string, artist = ''): string[] {
  const base = artist ? `${title} ${artist}` : title;
  return [`${base} minus one`, `${base} instrumental`, `${base} backing track`];
}

function unescapeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

/** Pulls (videoId, title) pairs out of a YouTube results page. */
function parseSearchResults(html: string): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const chunk = html.slice(m.index, m.index + 6000);
    const t =
      chunk.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/) ||
      chunk.match(/"title":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
    if (t) out.push({ id, title: unescapeJsonString(t[1]) });
  }
  return out;
}

async function youtubeResultsHtml(query: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': YT_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' },
    });
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  }
}

/** oEmbed answers 401/403 for uploads whose owner disabled embedding. A network error keeps the candidate. */
async function isEmbeddable(id: string): Promise<boolean> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    return r.ok;
  } catch {
    return true;
  }
}

/** Runs every backing query, scores each title, drops excluded and non-embeddable videos, best first. */
export async function searchBackingCandidates(
  title: string,
  artist?: string,
  exclude: string[] = []
): Promise<BackingCandidate[]> {
  const cleanTitle = (title || '').trim();
  const cleanArtist = cleanPlaceholderArtist(artist);
  if (!cleanTitle) return [];

  const pages = await Promise.all(buildBackingQueries(cleanTitle, cleanArtist).map(youtubeResultsHtml));
  const byId = new Map<string, { id: string; title: string }>();
  for (const page of pages) {
    for (const r of parseSearchResults(page)) if (!byId.has(r.id)) byId.set(r.id, r);
  }

  const ranked = [...byId.values()]
    .filter((r) => !exclude.includes(r.id))
    .map((r) => ({ ...r, score: scoreBackingTitle(r.title, cleanTitle, cleanArtist) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const embeddable = await Promise.all(ranked.map((c) => isEmbeddable(c.id)));
  return ranked.filter((_, i) => embeddable[i]).slice(0, 6);
}

function backingCacheKey(title: string, artist?: string) {
  return `${BACKING_CACHE_PREFIX}${normalizeText(title)}|${normalizeText(cleanPlaceholderArtist(artist))}`;
}

async function readBackingCache(key: string): Promise<BackingCandidate[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; list: BackingCandidate[] };
    if (Date.now() - parsed.at > BACKING_CACHE_TTL_MS || !Array.isArray(parsed.list)) return null;
    return parsed.list;
  } catch {
    return null;
  }
}

async function writeBackingCache(key: string, list: BackingCandidate[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), list }));
  } catch {
    // the cache is an optimisation only
  }
}

/** Forget the cached ranking for a song, e.g. after every candidate failed to play. */
export async function forgetBackingTracks(title: string, artist?: string) {
  try {
    await AsyncStorage.removeItem(backingCacheKey(title, artist));
  } catch {
    // ignore
  }
}

/**
 * Ranked backing tracks for a song, best first. Uses the cached ranking when present. Searches YouTube
 * directly (works on native apps); if that finds nothing, falls back to the `youtube-minus-one` Edge
 * Function, which returns ids without titles, so those results cannot be scored.
 */
export async function fetchBackingTracks(
  title: string,
  artist?: string,
  options: { exclude?: string[] } = {}
): Promise<BackingCandidate[]> {
  const exclude = options.exclude ?? [];
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return [];

  const key = backingCacheKey(cleanTitle, artist);
  const cached = await readBackingCache(key);
  if (cached) {
    const usable = cached.filter((c) => !exclude.includes(c.id));
    if (usable.length > 0) return usable;
  }

  let list = await searchBackingCandidates(cleanTitle, artist, exclude);

  if (list.length === 0) {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-minus-one', {
        body: { title: cleanTitle, artist: cleanPlaceholderArtist(artist) },
      });
      if (!error && Array.isArray(data?.ids)) {
        list = (data.ids as string[])
          .filter((id) => !exclude.includes(id))
          .map((id) => ({ id, title: '', score: 0 }));
      }
    } catch (err) {
      console.warn('youtube-minus-one fallback failed:', err);
    }
  }

  if (list.length > 0) await writeBackingCache(key, list);
  return list;
}

/** Ids only, best first. Kept for callers that do not need titles or scores. */
export async function fetchKaraokeVideoIds(title: string, artist?: string): Promise<string[]> {
  return (await fetchBackingTracks(title, artist)).map((c) => c.id);
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
