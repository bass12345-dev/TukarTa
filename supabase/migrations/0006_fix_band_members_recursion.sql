-- Migration: Fix infinite recursion in band_members RLS policy
-- The previous policy for SELECT on band_members was recursive because it queried itself.

-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "Band members can see their band" ON public.band_members;

-- 2. Create a non-recursive policy for SELECT
-- Since bands are public, it's safe to make the member list public for reading as well.
CREATE POLICY "Band members are publicly readable" ON public.band_members
  FOR SELECT
  USING (true);

-- 3. Keep the management policy (no recursion here as it checks the bands table)
-- POLICY "Leaders manage band membership" remains as-is:
-- FOR ALL USING (auth.uid() IN (SELECT leader_id FROM public.bands WHERE id = band_members.band_id));
