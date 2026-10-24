-- Migration 0015: Allow authenticated users to insert, update, or replace lyrics and chords in lyrics_cache

-- 1. Drop old restrictive policies if they exist
DROP POLICY IF EXISTS "Edge functions insert lyrics" ON public.lyrics_cache;
DROP POLICY IF EXISTS "Authenticated users can update lyrics_cache" ON public.lyrics_cache;
DROP POLICY IF EXISTS "Authenticated users insert lyrics_cache" ON public.lyrics_cache;
DROP POLICY IF EXISTS "Authenticated users update lyrics_cache" ON public.lyrics_cache;

-- 2. Allow authenticated users to INSERT
CREATE POLICY "Authenticated users insert lyrics_cache"
  ON public.lyrics_cache
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow authenticated users to UPDATE (required by PostgREST upsert ON CONFLICT DO UPDATE)
CREATE POLICY "Authenticated users update lyrics_cache"
  ON public.lyrics_cache
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
