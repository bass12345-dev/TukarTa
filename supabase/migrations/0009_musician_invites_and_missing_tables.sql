-- Migration 0009: Add missing tables for Invitations, Approvals, and Song Versions

-- 1. musician_invites
CREATE TABLE IF NOT EXISTS public.musician_invites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_band_id   UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  to_musician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gig_id         UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
                 -- 'pending' | 'accepted' | 'declined'
  message        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at   TIMESTAMPTZ
);

ALTER TABLE public.musician_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invited musician reads their invites"
  ON public.musician_invites FOR SELECT
  USING (auth.uid() = to_musician_id);

CREATE POLICY "Band leader creates invites"
  ON public.musician_invites FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT leader_id FROM public.bands WHERE id = from_band_id
    )
  );

CREATE POLICY "Band leader updates their invites"
  ON public.musician_invites FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT leader_id FROM public.bands WHERE id = from_band_id
    )
  );

-- 2. setlist_approvals
CREATE TABLE IF NOT EXISTS public.setlist_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id  UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',
              -- 'pending' | 'approved' | 'suggested'
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setlist_id, member_id)
);

ALTER TABLE public.setlist_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members see all approvals"
  ON public.setlist_approvals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.setlists sl ON sl.band_id = bm.band_id
      WHERE sl.id = setlist_approvals.setlist_id
    )
  );

CREATE POLICY "Members manage their own approval"
  ON public.setlist_approvals FOR ALL
  USING (auth.uid() = member_id);

-- 3. song_versions
CREATE TABLE IF NOT EXISTS public.song_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id        UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  band_id        UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  chord_text     TEXT,
  original_key   TEXT,
  capo_position  SMALLINT DEFAULT 0,
  notes          TEXT,
  created_by     UUID NOT NULL REFERENCES public.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(song_id, band_id)
);

ALTER TABLE public.song_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members read their song versions"
  ON public.song_versions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members
      WHERE band_id = song_versions.band_id AND status = 'active'
    )
  );

CREATE POLICY "Band members manage their song versions"
  ON public.song_versions FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members
      WHERE band_id = song_versions.band_id AND status = 'active'
    )
  );
