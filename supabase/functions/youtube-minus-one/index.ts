// Edge function: find embeddable YouTube karaoke / minus-one videos AND real song BPM/tempo server-side (no browser CORS limits).
// POST/GET { title, artist, mode?: 'all' | 'bpm' | 'video' }  ->  { ids: string[], bpm: number | null, duration: number | null, artist: string | null }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLACEHOLDER = /\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi;

async function fetchRealBpmAndMeta(cleanTitle: string, cleanArtist: string): Promise<{ bpm: number | null; duration: number | null; artist: string | null }> {
  const searchStr = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
  let bpm: number | null = null;
  let duration: number | null = null;
  let resolvedArtist: string | null = cleanArtist || null;

  // 1. Deezer public track API (checks top 6 matches for populated BPM & duration)
  try {
    const searchRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchStr)}&limit=6`);
    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      const items = (searchJson?.data || []).slice(0, 6);
      if (items.length > 0) {
        if (!resolvedArtist && items[0]?.artist?.name) {
          resolvedArtist = items[0].artist.name;
        }
        if (items[0]?.duration) {
          duration = Number(items[0].duration);
        }
        const trackDetails = await Promise.all(
          items.map(async (item: any) => {
            try {
              const r = await fetch(`https://api.deezer.com/track/${item.id}`);
              return r.ok ? await r.json() : null;
            } catch {
              return null;
            }
          })
        );
        const matchWithBpm = trackDetails.find((t) => t && typeof t.bpm === 'number' && t.bpm >= 40 && t.bpm <= 240);
        if (matchWithBpm) {
          bpm = Math.round(matchWithBpm.bpm);
          if (!duration && matchWithBpm.duration) duration = Number(matchWithBpm.duration);
          if (!resolvedArtist && matchWithBpm.artist?.name) resolvedArtist = matchWithBpm.artist.name;
        }
      }
    }
  } catch {
    // ignore Deezer error
  }

  // 2. Fallback web scrape for "<song> <artist> bpm tempo" if Deezer track had bpm=0
  if (!bpm) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchStr + ' bpm tempo')}`;
      const ddgRes = await fetch(ddgUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const match =
          html.match(/\b([5-9]\d|1\d\d|2[01]\d)\s*BPM\b/i) ||
          html.match(/tempo\s+(?:of|is)\s+([5-9]\d|1\d\d|2[01]\d)/i);
        if (match && match[1]) {
          const parsed = parseInt(match[1], 10);
          if (parsed >= 45 && parsed <= 220) bpm = parsed;
        }
      }
    } catch {
      // ignore fallback error
    }
  }

  return { bpm, duration, artist: resolvedArtist };
}

// Search phrase per practice role (Practice Mode). Unknown or missing role keeps the karaoke search.
const INSTRUMENT_SEARCH: Record<string, string> = {
  bass: 'bass cover tabs',
  guitar: 'guitar cover tabs',
  singer: 'karaoke minus one',
  drums: 'drum cover',
  keys: 'piano cover',
  session: 'minus one',
};

async function fetchYoutubeKaraokeIds(cleanTitle: string, cleanArtist: string, suffix = 'karaoke minus 1'): Promise<string[]> {
  const query = cleanArtist
    ? `${cleanTitle} ${cleanArtist} ${suffix}`
    : `${cleanTitle} ${suffix}`;

  const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const html = await res.text();

  const reg = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = reg.exec(html)) !== null) {
    if (!found.includes(m[1])) found.push(m[1]);
  }

  // Keep only embeddable videos (oEmbed fails for embedding-disabled uploads)
  const candidates = found.slice(0, 10);
  const checked = await Promise.all(
    candidates.map(async (id) => {
      try {
        const r = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
        );
        return r.ok ? id : null;
      } catch {
        return null;
      }
    })
  );
  const ids = checked.filter((x): x is string => !!x).slice(0, 6);
  return ids.length ? ids : candidates.slice(0, 6);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let title = '';
    let artist = '';
    let mode = 'all';
    let instrument = '';
    if (req.method === 'GET') {
      const u = new URL(req.url);
      title = u.searchParams.get('title') || '';
      artist = u.searchParams.get('artist') || '';
      mode = u.searchParams.get('mode') || 'all';
      instrument = u.searchParams.get('instrument') || '';
    } else {
      const body = await req.json().catch(() => ({}));
      title = body.title || '';
      artist = body.artist || '';
      mode = body.mode || 'all';
      instrument = body.instrument || '';
    }

    const cleanTitle = title.trim();
    const cleanArtist = artist.replace(PLACEHOLDER, '').trim();
    if (!cleanTitle) {
      return new Response(JSON.stringify({ ids: [], bpm: null, duration: null, artist: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'bpm') {
      const meta = await fetchRealBpmAndMeta(cleanTitle, cleanArtist);
      return new Response(JSON.stringify({ ids: [], ...meta }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [ids, meta] = await Promise.all([
      fetchYoutubeKaraokeIds(
        cleanTitle,
        cleanArtist,
        Object.prototype.hasOwnProperty.call(INSTRUMENT_SEARCH, instrument) ? INSTRUMENT_SEARCH[instrument] : 'karaoke minus 1',
      ).catch(() => []),
      fetchRealBpmAndMeta(cleanTitle, cleanArtist).catch(() => ({ bpm: null, duration: null, artist: null })),
    ]);

    return new Response(JSON.stringify({ ids, ...meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ids: [], bpm: null, duration: null, artist: null, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
