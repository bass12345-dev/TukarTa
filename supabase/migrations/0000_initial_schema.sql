-- Initial Schema for TukarTa (Setlist AI)

-- 1. Users Table (Extends Auth Users)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  city          TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Musician Profiles
CREATE TABLE IF NOT EXISTS public.musician_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roles         TEXT[] NOT NULL DEFAULT '{}',
  genres        TEXT[] NOT NULL DEFAULT '{}',
  avg_rating    NUMERIC(3,2) DEFAULT NULL,
  rating_count  INT NOT NULL DEFAULT 0,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.musician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musician profiles are public" ON public.musician_profiles FOR SELECT USING (true);
CREATE POLICY "Musicians manage their own profile" ON public.musician_profiles FOR ALL USING (auth.uid() = user_id);

-- 3. Songs Catalog
CREATE TABLE IF NOT EXISTS public.songs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  genre         TEXT,
  original_key  TEXT,
  bpm           INT,
  duration_sec  INT,
  added_by      UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(title, artist)
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs are publicly readable" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add songs" ON public.songs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Musician Song Knowledge
CREATE TABLE IF NOT EXISTS public.musician_song_knowledge (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_id           UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  confidence_level  SMALLINT NOT NULL DEFAULT 3 CHECK (confidence_level BETWEEN 1 AND 5),
  can_perform_live  BOOLEAN NOT NULL DEFAULT FALSE,
  last_practiced_at TIMESTAMPTZ,
  source            TEXT DEFAULT 'manual',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(musician_id, song_id)
);

ALTER TABLE public.musician_song_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musicians can see each other's song knowledge" ON public.musician_song_knowledge FOR SELECT USING (true);
CREATE POLICY "Musicians manage their own song knowledge" ON public.musician_song_knowledge FOR ALL USING (auth.uid() = musician_id);

-- 5. Bands
CREATE TABLE IF NOT EXISTS public.bands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  genres      TEXT[] NOT NULL DEFAULT '{}',
  city        TEXT,
  leader_id   UUID NOT NULL REFERENCES public.users(id),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bands are publicly readable" ON public.bands FOR SELECT USING (true);
CREATE POLICY "Only leader manages band" ON public.bands FOR UPDATE USING (auth.uid() = leader_id);

-- 6. Band Members
CREATE TABLE IF NOT EXISTS public.band_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id     UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'active',
  UNIQUE(band_id, user_id)
);

ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can see their band" ON public.band_members FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.band_members bm2 WHERE bm2.band_id = band_members.band_id));
CREATE POLICY "Leaders manage band membership" ON public.band_members FOR ALL USING (auth.uid() IN (SELECT leader_id FROM public.bands WHERE id = band_members.band_id));

-- 7. Gigs
CREATE TABLE IF NOT EXISTS public.gigs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id       UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  venue         TEXT,
  gig_date      TIMESTAMPTZ,
  duration_min  INT NOT NULL DEFAULT 60,
  mood_tags     TEXT[] DEFAULT '{}',
  genre_focus   TEXT,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can read gigs" ON public.gigs FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.band_members WHERE band_id = gigs.band_id AND status = 'active'));
CREATE POLICY "Band members can create gigs" ON public.gigs FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.band_members WHERE band_id = gigs.band_id AND status = 'active'));

-- 8. Setlists
CREATE TABLE IF NOT EXISTS public.setlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id        UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  band_id       UUID NOT NULL REFERENCES public.bands(id),
  name          TEXT NOT NULL DEFAULT 'Main Setlist',
  status        TEXT NOT NULL DEFAULT 'draft',
  locked        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members read setlists" ON public.setlists FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.band_members WHERE band_id = setlists.band_id AND status = 'active'));

-- 9. Setlist Songs
CREATE TABLE IF NOT EXISTS public.setlist_songs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id  UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES public.songs(id),
  position    SMALLINT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setlist_id, position)
);

ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members read setlist songs" ON public.setlist_songs FOR SELECT USING (auth.uid() IN (SELECT bm.user_id FROM public.band_members bm JOIN public.setlists sl ON sl.band_id = bm.band_id WHERE sl.id = setlist_songs.setlist_id AND bm.status = 'active'));

-- 10. Lyrics Cache
CREATE TABLE IF NOT EXISTS public.lyrics_cache (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id        UUID NOT NULL REFERENCES public.songs(id) UNIQUE,
  plain_lyrics   TEXT,
  synced_lyrics  JSONB,
  provider       TEXT DEFAULT 'lrclib',
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE public.lyrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lyrics are publicly readable" ON public.lyrics_cache FOR SELECT USING (true);
CREATE POLICY "Edge functions insert lyrics" ON public.lyrics_cache FOR INSERT WITH CHECK (true);

-- Storage Buckets Setup
-- Note: These usually need to be run via the dashboard or a privileged key
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('song-screenshots', 'song-screenshots', false);
