-- Fix RLS error for songs upsert
-- The error "new row violates row-level security policy (USING expression) for table \"songs\""
-- happens during upsert because an UPDATE is triggered but no UPDATE policy exists.

-- Add UPDATE policy for songs
-- We allow authenticated users to perform updates during upsert.
-- Since title/artist are unique, this essentially allows "merging" duplicates.
CREATE POLICY "Authenticated users can update songs" ON public.songs
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
