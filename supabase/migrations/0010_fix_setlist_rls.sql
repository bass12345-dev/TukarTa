-- Migration 0010: Fix missing RLS policies for setlists, setlist_songs, and gigs
-- These policies allow band members to manage their data.

-- 1. Policies for setlists
CREATE POLICY "Band members can create setlists" 
  ON public.setlists FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.gigs g ON g.band_id = bm.band_id
      WHERE g.id = setlists.gig_id AND bm.status = 'active'
    )
  );

CREATE POLICY "Band members can update setlists" 
  ON public.setlists FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members 
      WHERE band_id = setlists.band_id AND status = 'active'
    )
  );

CREATE POLICY "Band members can delete setlists" 
  ON public.setlists FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members 
      WHERE band_id = setlists.band_id AND status = 'active'
    )
  );

-- 2. Policies for setlist_songs
CREATE POLICY "Band members can insert setlist songs"
  ON public.setlist_songs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.setlists sl ON sl.band_id = bm.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.status = 'active'
    )
  );

CREATE POLICY "Band members can update setlist songs"
  ON public.setlist_songs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.setlists sl ON sl.band_id = bm.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.status = 'active'
    )
  );

CREATE POLICY "Band members can delete setlist songs"
  ON public.setlist_songs FOR DELETE
  USING (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.setlists sl ON sl.band_id = bm.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.status = 'active'
    )
  );

-- 3. Additional policies for gigs (Improvement)
CREATE POLICY "Band members can update gigs"
  ON public.gigs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members 
      WHERE band_id = gigs.band_id AND status = 'active'
    )
  );

CREATE POLICY "Band members can delete gigs"
  ON public.gigs FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members 
      WHERE band_id = gigs.band_id AND status = 'active'
    )
  );
