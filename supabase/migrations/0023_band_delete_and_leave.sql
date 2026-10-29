-- Band delete and leave.
-- Only the band's creator (leader) may delete the band. The existing
-- "Leaders manage band membership" policy already lets the leader remove members.
CREATE POLICY "Only leader deletes band" ON public.bands
  FOR DELETE USING (auth.uid() = leader_id);

-- Any member may remove their own membership (leave the band).
CREATE POLICY "Members can leave band" ON public.band_members
  FOR DELETE USING (auth.uid() = user_id);
