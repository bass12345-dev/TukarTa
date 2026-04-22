-- Migration 0014: Add unique constraint to setlist_songs to support upsert

-- 1. Remove any existing duplicates first (keep the one with the lowest position)
DELETE FROM public.setlist_songs a
USING public.setlist_songs b
WHERE a.id > b.id
  AND a.setlist_id = b.setlist_id
  AND a.song_id = b.song_id;

-- 2. Add the unique constraint
ALTER TABLE public.setlist_songs
ADD CONSTRAINT setlist_songs_setlist_id_song_id_key UNIQUE (setlist_id, song_id);
