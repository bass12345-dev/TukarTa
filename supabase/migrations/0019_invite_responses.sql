-- Migration 0019: working invite responses + tighter band membership
--
-- 1. Invitees accept/decline through respond_to_invite(), which runs as the table owner.
--    Previously the client updated musician_invites directly, which RLS blocks for invitees,
--    so accepted invites stayed "pending".
-- 2. Band leaders can read the invites their bands sent (sent-invites list, duplicate checks).
-- 3. One open invite per band/musician pair.
-- 4. Users can only insert a band_members row for themselves when they lead that band
--    (band creation). Previously anyone could add themselves to any band.

-- 1. Leaders read invites they sent
CREATE POLICY "Band leader reads invites they sent"
  ON public.musician_invites FOR SELECT
  USING (
    auth.uid() IN (
      SELECT leader_id FROM public.bands WHERE id = musician_invites.from_band_id
    )
  );

-- 2. Only one pending invite per band/musician pair
CREATE UNIQUE INDEX IF NOT EXISTS musician_invites_one_pending
  ON public.musician_invites (from_band_id, to_musician_id)
  WHERE status = 'pending';

-- 3. Atomic accept/decline
CREATE OR REPLACE FUNCTION public.respond_to_invite(p_invite_id UUID, p_accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.musician_invites%ROWTYPE;
BEGIN
  SELECT * INTO inv
  FROM public.musician_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;

  IF inv.to_musician_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not your invite';
  END IF;

  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invite already %', inv.status;
  END IF;

  UPDATE public.musician_invites
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
      responded_at = NOW()
  WHERE id = p_invite_id;

  IF p_accept AND NOT EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = inv.from_band_id AND user_id = inv.to_musician_id
  ) THEN
    INSERT INTO public.band_members (band_id, user_id, status)
    VALUES (inv.from_band_id, inv.to_musician_id, 'active');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_invite(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_invite(UUID, BOOLEAN) TO authenticated;

-- 4. Replace the open self-join policy with a leader-only one (band creation still works)
DROP POLICY IF EXISTS "Authenticated users can join bands" ON public.band_members;

CREATE POLICY "Band leader adds themselves on creation"
  ON public.band_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IN (
      SELECT leader_id FROM public.bands WHERE id = band_members.band_id
    )
  );
