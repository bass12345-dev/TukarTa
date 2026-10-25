-- Migration 0018: band setlist proposals that can add missing songs to band members' libraries.
--
-- RLS on musician_song_knowledge only lets a musician write their own rows (auth.uid() = musician_id),
-- and that stays unchanged. Adding a song to *another* member's library goes through the function below:
--   * it is SECURITY DEFINER but only the service role can execute it (the setlist-agent edge function);
--     anon / authenticated clients cannot call it at all;
--   * it only acts on an ai_proposals row of kind 'band_setlist' that the requesting user explicitly
--     approved, i.e. currently in status 'executing' with decided_at set (the edge function's atomic claim);
--   * it re-checks that the approver and every target are still active members of the proposal's band and
--     that each song is part of the proposed setlist;
--   * it only INSERTs new knowledge rows (confidence 1, not live-ready, source 'band_setlist').
--     It never updates or deletes anything a member already has.

-- 1. Allow the new proposal kind ---------------------------------------------------------------------
ALTER TABLE public.ai_proposals DROP CONSTRAINT IF EXISTS ai_proposals_kind_check;
ALTER TABLE public.ai_proposals ADD CONSTRAINT ai_proposals_kind_check CHECK (kind IN (
  'create_gig', 'update_gig', 'add_songs_to_setlist', 'remove_songs_from_setlist',
  'reorder_setlist', 'add_to_dictionary', 'invite_musician', 'band_setlist'));

-- 2. Gated writer for other members' libraries ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ai_apply_band_library_adds(p_proposal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_p         public.ai_proposals%ROWTYPE;
  v_band_id   UUID;
  v_add       JSONB;
  v_member    UUID;
  v_song      UUID;
  v_rows      INTEGER;
  v_inserted  INTEGER := 0;
BEGIN
  SELECT * INTO v_p FROM public.ai_proposals WHERE id = p_proposal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;
  IF v_p.kind <> 'band_setlist' THEN
    RAISE EXCEPTION 'proposal is not a band setlist';
  END IF;
  IF v_p.status <> 'executing' OR v_p.decided_at IS NULL THEN
    RAISE EXCEPTION 'proposal has not been approved';
  END IF;
  IF v_p.expires_at < NOW() THEN
    RAISE EXCEPTION 'proposal has expired';
  END IF;

  v_band_id := (v_p.payload->>'band_id')::UUID;

  -- The approver must still belong to the band.
  IF NOT EXISTS (
    SELECT 1 FROM public.bands b WHERE b.id = v_band_id AND b.leader_id = v_p.user_id
    UNION ALL
    SELECT 1 FROM public.band_members bm WHERE bm.band_id = v_band_id AND bm.user_id = v_p.user_id AND bm.status = 'active'
  ) THEN
    RAISE EXCEPTION 'approver is no longer a member of this band';
  END IF;

  FOR v_add IN SELECT * FROM jsonb_array_elements(COALESCE(v_p.payload->'library_adds', '[]'::JSONB)) LOOP
    v_member := (v_add->>'musician_id')::UUID;

    IF NOT EXISTS (
      SELECT 1 FROM public.bands b WHERE b.id = v_band_id AND b.leader_id = v_member
      UNION ALL
      SELECT 1 FROM public.band_members bm WHERE bm.band_id = v_band_id AND bm.user_id = v_member AND bm.status = 'active'
    ) THEN
      RAISE EXCEPTION 'a target musician is no longer a member of this band';
    END IF;

    FOR v_song IN SELECT jsonb_array_elements_text(COALESCE(v_add->'song_ids', '[]'::JSONB))::UUID LOOP
      IF NOT (COALESCE(v_p.payload->'song_ids', '[]'::JSONB) ? v_song::TEXT) THEN
        RAISE EXCEPTION 'library additions must be songs in the approved setlist';
      END IF;

      INSERT INTO public.musician_song_knowledge (musician_id, song_id, confidence_level, can_perform_live, source)
      VALUES (v_member, v_song, 1, FALSE, 'band_setlist')
      ON CONFLICT (musician_id, song_id) DO NOTHING;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_inserted := v_inserted + v_rows;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('inserted', v_inserted);
END;
$$;

REVOKE ALL ON FUNCTION public.ai_apply_band_library_adds(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ai_apply_band_library_adds(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_apply_band_library_adds(UUID) TO service_role;
