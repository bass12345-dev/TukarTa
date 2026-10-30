// Edge function: fill in the genre and BPM of ONE song right after a user adds it.
// Signed-in users only. Fills only fields that are empty; never overwrites a value.
// POST { songId } -> { songId, genre_filled, bpm_filled, genre, bpm }
// Sources: MusicBrainz recording tags for genre, youtube-minus-one 'bpm' mode for BPM.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Same genre words and matching as enrich-songs (most specific first).
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
  const tags = (data?.recordings || [])
    .flatMap((r: any) => (r.tags || []).map((t: any) => ({ name: String(t.name || ''), count: Number(t.count) || 0 })))
    .sort((a: any, b: any) => b.count - a.count)
    .map((t: any) => t.name);
  return pickGenre(tags);
}

async function bpmFromYoutubeMinusOne(title: string, artist: string): Promise<number | null> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/youtube-minus-one`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist, mode: 'bpm' }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.bpm === 'number' && data.bpm >= 40 ? Math.round(data.bpm) : null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'sign in required' }, 401);

    // Verify the caller is a signed-in user (not the anon key).
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'sign in required' }, 401);

    const body = await req.json().catch(() => ({}));
    const songId = typeof body.songId === 'string' ? body.songId : '';
    if (!songId) return json({ error: 'songId is required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: song, error } = await admin.from('songs').select('id, title, artist, genre, bpm').eq('id', songId).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!song) return json({ error: 'song not found' }, 404);

    const artist = song.artist && !/unknown|audience|request/i.test(song.artist) ? song.artist : '';
    const update: Record<string, unknown> = {};

    if (!song.genre) {
      const genre = await genreFromMusicBrainz(song.title, artist).catch(() => null);
      if (genre) update.genre = genre;
    }
    if (!song.bpm) {
      const bpm = await bpmFromYoutubeMinusOne(song.title, artist).catch(() => null);
      if (bpm) update.bpm = bpm;
    }

    if (Object.keys(update).length > 0) {
      // Only the empty columns above are written, so a value set by someone else is kept.
      let q = admin.from('songs').update(update).eq('id', song.id);
      if (!song.genre) q = q.is('genre', null);
      if (!song.bpm) q = q.is('bpm', null);
      const { error: upErr } = await q;
      if (upErr) return json({ error: upErr.message }, 500);
    }

    return json({
      songId: song.id,
      genre_filled: 'genre' in update,
      bpm_filled: 'bpm' in update,
      genre: (update.genre as string | undefined) ?? song.genre ?? null,
      bpm: (update.bpm as number | undefined) ?? song.bpm ?? null,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
