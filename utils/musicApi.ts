/**
 * musicApi.ts
 * Integration with LRCLIB and TheAudioDB for song search and metadata.
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

/**
 * Searches for songs using LRCLIB.
 */
export async function searchSongs(query: string): Promise<SongResult[]> {
  try {
    const response = await fetch(`${LRCLIB_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('LRCLIB search failed');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item.id,
      title: item.trackName,
      artist: item.artistName,
      album: item.albumName,
      duration: formatDuration(item.duration),
      hasLyrics: !!(item.plainLyrics || item.syncedLyrics),
    }));
  } catch (error) {
    console.error('LRCLIB Error:', error);
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
 * Fetches lyrics from LRCLIB.
 */
export async function getLyrics(artist: string, title: string) {
  try {
    const url = `${LRCLIB_URL}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('LRCLIB Lyrics Error:', error);
    return null;
  }
}

/**
 * Combines search results with metadata for a better UI experience.
 * (Optional: can be called individually for performance)
 */
export async function searchAndEnrichSongs(query: string): Promise<SongResult[]> {
  const basicResults = await searchSongs(query);
  
  // To avoid hitting TheAudioDB too hard, we only enrich unique artists or top results
  // For the MVP, let's just return basic results and fetch metadata on-demand in the UI
  return basicResults;
}
