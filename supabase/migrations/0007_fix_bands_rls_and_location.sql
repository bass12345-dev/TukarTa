-- Migration: 0007_fix_bands_rls_and_location.sql
-- Description: Fixes the missing INSERT policy for the bands table and adds lat/lng columns for location-based search.

-- 1. Allow authenticated users to create bands
-- (Checks that the creator sets themselves as the leader)
CREATE POLICY "Authenticated users can create bands" 
  ON public.bands FOR INSERT 
  WITH CHECK (auth.uid() = leader_id);

-- 2. Add latitude and longitude columns to bands table for future range-based searching
ALTER TABLE public.bands 
ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);

-- 3. Ensure band members can be added by the band leader
-- (This should already be covered by the FOR ALL policy in the initial schema, 
-- but we ensure it works for the initial leader entry)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'band_members' AND policyname = 'Authenticated users can join bands'
    ) THEN
        CREATE POLICY "Authenticated users can join bands" 
          ON public.band_members FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON COLUMN public.bands.lat IS 'Latitude for location-based searching';
COMMENT ON COLUMN public.bands.lng IS 'Longitude for location-based searching';
