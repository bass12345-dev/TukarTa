// Edge function: fill in missing genre and BPM for songs in the shared library.
// Admin only: call with the BACKFILL_ADMIN_TOKEN secret (or the service-role key) as the Bearer token.
// POST { limit?: number (1-50, default 20), after?: song id, dryRun?: boolean }
//   -> { processed, genre_filled, bpm_filled, skipped, dry_run, next_after }
// Page by id: pass next_after back as `after` until next_after is null.
//
// Genre: MusicBrainz recording tags (free, no key). Falls back to Serper (Google search)
// when SERPER_API_KEY is set and MusicBrainz has no genre tag for the song.
// BPM: the existing youtube-minus-one function in mode 'bpm' (Deezer, then a web scrape).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Admin token set as a function secret (BACKFILL_ADMIN_TOKEN). Lets the backfill run even when
// the platform's copy of the service key does not match the key shown in the dashboard.
const BACKFILL_ADMIN_TOKEN = Deno.env.get('BACKFILL_ADMIN_TOKEN') || '';
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre words we accept. The first match wins, so more specific names come first.
const GENRES = [
  'classic rock', 'soft rock', 'hard rock', 'pop rock', 'alternative rock', 'alt rock', 'indie rock',
  'hip hop', 'r&b', 'dance-pop', 'electronic', 'classical', 'acoustic', 'country', 'reggae',
  'gospel', 'worship', 'christian', 'metal', 'punk', 'jazz', 'blues', 'funk', 'disco', 'soul',
  'folk', 'latin', 'edm', 'house', 'techno', 'swing', 'rap', 'ballad', 'opm', 'rock', 'pop', 'indie',
];

const MB_UA = 'TukarTa/1.0 (song metadata backfill)';

function pickGenre(tags: string[]): string | null {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    const hit = GENRES.find((g) => t === g || t.includes(g));
    if (hit) return hit;
  }
  return null;
}

async function genreFromMusicBrainz(title: string, artist: string): Promise<string | null> {
  const clean = (s: string) => s.replace(/["\\]/g, ' ').trim();
  const q = artist
    ? `recording:"${clean(title)}" AND artist:"${clean(artist)}"`
    : `recording:"${clean(title)}"`;
  const res = await fetch(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&fmt=json&limit=3`, {
    headers: { 'User-Agent': MB_UA, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const recordings: any[] = data?.recordings || [];
  // Tags on the top matches, most-voted first.
  const tags = recordings
    .flatMap((r) => (r.tags || []).map((t: any) => ({ name: String(t.name || ''), count: Number(t.count) || 0 })))
    .sort((a, b) => b.count - a.count)
    .map((t) => t.name);
  return pickGenre(tags);
}

async function genreFromSerper(title: string, artist: string): Promise<string | null> {
  if (!SERPER_API_KEY) return null;
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `"${title}" ${artist} song genre`, num: 5 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const snippets: string[] = [
    data?.knowledgeGraph?.description, data?.knowledgeGraph?.attributes?.Genre,
    ...((data?.organic || []).map((o: any) => `${o.title || ''} ${o.snippet || ''}`)),
  ].filter(Boolean).map(String);
  for (const s of snippets) {
    const hit = pickGenre([s.toLowerCase()]);
    if (hit) return hit;
  }
  return null;
}

async function bpmFromYoutubeMinusOne(title: string, artist: string): Promise<number | null> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/youtube-minus-one`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist, mode: 'bpm' }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.bpm === 'number' && data.bpm >= 40 ? Math.round(data.bpm) : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const isAdmin =
      (!!BACKFILL_ADMIN_TOKEN && token === BACKFILL_ADMIN_TOKEN) ||
      (!!SERVICE_ROLE_KEY && token === SERVICE_ROLE_KEY);
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(50, Math.max(1, Number(body.limit) || 20));
    const after = typeof body.after === 'string' ? body.after : '';
    const dryRun = !!body.dryRun;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    let query = admin
      .from('songs')
      .select('id, title, artist, genre, bpm')
      .or('genre.is.null,bpm.is.null')
      .order('id')
      .limit(limit);
    if (after) query = query.gt('id', after);
    const { data: songs, error } = await query;
    if (error) return json({ error: error.message }, 500);

    let genreFilled = 0;
    let bpmFilled = 0;
    let skipped = 0;

    for (const s of songs || []) {
      const artist = s.artist && !/unknown|audience|request/i.test(s.artist) ? s.artist : '';
      const update: Record<string, unknown> = {};

      if (!s.genre) {
        // MusicBrainz allows about one request per second.
        const mb = await genreFromMusicBrainz(s.title, artist).catch(() => null);
        await sleep(1100);
        const genre = mb || (await genreFromSerper(s.title, artist).catch(() => null));
        if (genre) update.genre = genre;
      }
      if (!s.bpm) {
        const bpm = await bpmFromYoutubeMinusOne(s.title, artist).catch(() => null);
        if (bpm) update.bpm = bpm;
      }

      if (Object.keys(update).length === 0) { skipped++; continue; }
      if ('genre' in update) genreFilled++;
      if ('bpm' in update) bpmFilled++;
      if (!dryRun) {
        const { error: upErr } = await admin.from('songs').update(update).eq('id', s.id);
        if (upErr) return json({ error: upErr.message, processed: genreFilled + bpmFilled + skipped }, 500);
      }
    }

    const processed = (songs || []).length;
    return json({
      processed, genre_filled: genreFilled, bpm_filled: bpmFilled, skipped, dry_run: dryRun,
      next_after: processed < limit ? null : songs![processed - 1].id,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
