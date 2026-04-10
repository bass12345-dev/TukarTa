# DATABASE_SCHEMA.md
# Database Schema — Setlist AI MVP

All tables use Supabase PostgreSQL. Row Level Security (RLS) is enabled on every table.
UUIDs are generated via `gen_random_uuid()`. Timestamps use `timestamptz`.

---

## Tables

### users
Extends Supabase `auth.users`. Stores public profile data.

```sql
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  city          TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);
```

---

### musician_profiles
Extends user profile with musician-specific fields.

```sql
CREATE TABLE public.musician_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roles         TEXT[] NOT NULL DEFAULT '{}', -- ['singer', 'guitarist', etc.]
  genres        TEXT[] NOT NULL DEFAULT '{}',
  avg_rating    NUMERIC(3,2) DEFAULT NULL,
  rating_count  INT NOT NULL DEFAULT 0,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.musician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musician profiles are public"
  ON public.musician_profiles FOR SELECT USING (true);

CREATE POLICY "Musicians manage their own profile"
  ON public.musician_profiles FOR ALL USING (auth.uid() = user_id);
```

---

### songs
Master song catalog. Songs are added by musicians and shared across the platform.

```sql
CREATE TABLE public.songs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  genre         TEXT,
  original_key  TEXT,         -- e.g. 'C', 'F#m'
  bpm           INT,
  duration_sec  INT,
  added_by      UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(title, artist)       -- prevent duplicates
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs are publicly readable"
  ON public.songs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add songs"
  ON public.songs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

---

### musician_song_knowledge
**The core table.** Each row = one musician knows one song.

```sql
CREATE TABLE public.musician_song_knowledge (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_id           UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  confidence_level  SMALLINT NOT NULL DEFAULT 3
                    CHECK (confidence_level BETWEEN 1 AND 5),
  can_perform_live  BOOLEAN NOT NULL DEFAULT FALSE,
  last_practiced_at TIMESTAMPTZ,
  source            TEXT DEFAULT 'manual', -- 'manual' | 'screenshot' | 'spotify'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(musician_id, song_id)
);

ALTER TABLE public.musician_song_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musicians can see each other's song knowledge"
  ON public.musician_song_knowledge FOR SELECT USING (true);

CREATE POLICY "Musicians manage their own song knowledge"
  ON public.musician_song_knowledge FOR ALL
  USING (auth.uid() = musician_id);
```

---

### bands

```sql
CREATE TABLE public.bands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  genres      TEXT[] NOT NULL DEFAULT '{}',
  city        TEXT,
  leader_id   UUID NOT NULL REFERENCES public.users(id),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bands are publicly readable"
  ON public.bands FOR SELECT USING (true);

CREATE POLICY "Only leader manages band"
  ON public.bands FOR UPDATE USING (auth.uid() = leader_id);
```

---

### band_members

```sql
CREATE TABLE public.band_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id     UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT,           -- their role in this band
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'active', -- 'active' | 'invited' | 'removed'

  UNIQUE(band_id, user_id)
);

ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members can see their band"
  ON public.band_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members bm2
      WHERE bm2.band_id = band_members.band_id
    )
  );

CREATE POLICY "Leaders manage band membership"
  ON public.band_members FOR ALL
  USING (
    auth.uid() IN (
      SELECT leader_id FROM public.bands WHERE id = band_members.band_id
    )
  );
```

---

### gigs

```sql
CREATE TABLE public.gigs (
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

CREATE POLICY "Band members can read gigs"
  ON public.gigs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members
      WHERE band_id = gigs.band_id AND status = 'active'
    )
  );

CREATE POLICY "Band members can create gigs"
  ON public.gigs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.band_members
      WHERE band_id = gigs.band_id AND status = 'active'
    )
  );
```

---

### setlists

```sql
CREATE TABLE public.setlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id        UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  band_id       UUID NOT NULL REFERENCES public.bands(id),
  name          TEXT NOT NULL DEFAULT 'Main Setlist',
  status        TEXT NOT NULL DEFAULT 'draft',
                -- 'draft' | 'shared' | 'finalized'
  locked        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members read setlists"
  ON public.setlists FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.band_members
      WHERE band_id = setlists.band_id AND status = 'active'
    )
  );
```

---

### setlist_songs

```sql
CREATE TABLE public.setlist_songs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id  UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES public.songs(id),
  position    SMALLINT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(setlist_id, position)
);

ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Band members read setlist songs"
  ON public.setlist_songs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT bm.user_id FROM public.band_members bm
      JOIN public.setlists sl ON sl.band_id = bm.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.status = 'active'
    )
  );
```

---

### setlist_approvals

```sql
CREATE TABLE public.setlist_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id  UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.users(id),
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
```

---

### lyrics_cache

```sql
CREATE TABLE public.lyrics_cache (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id        UUID NOT NULL REFERENCES public.songs(id) UNIQUE,
  plain_lyrics   TEXT,
  synced_lyrics  JSONB,        -- LRC format timestamps
  provider       TEXT DEFAULT 'lrclib',
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE public.lyrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lyrics are publicly readable"
  ON public.lyrics_cache FOR SELECT USING (true);

CREATE POLICY "Edge functions insert lyrics"
  ON public.lyrics_cache FOR INSERT WITH CHECK (true);
```

---

### song_versions
Private chord sheets per band.

```sql
CREATE TABLE public.song_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id        UUID NOT NULL REFERENCES public.songs(id),
  band_id        UUID NOT NULL REFERENCES public.bands(id),
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
```

---

### musician_invites

```sql
CREATE TABLE public.musician_invites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_band_id   UUID NOT NULL REFERENCES public.bands(id),
  to_musician_id UUID NOT NULL REFERENCES public.users(id),
  gig_id         UUID REFERENCES public.gigs(id),
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
```

---

## Supabase Storage Buckets

```sql
-- Profile photos (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Screenshot uploads (private, user-only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('song-screenshots', 'song-screenshots', false);

CREATE POLICY "Users upload their own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'song-screenshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read their own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-screenshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Key Queries

**Get all songs that all band members know (for setlist generation):**

```sql
SELECT s.*
FROM public.songs s
WHERE (
  SELECT COUNT(DISTINCT msk.musician_id)
  FROM public.musician_song_knowledge msk
  JOIN public.band_members bm ON bm.user_id = msk.musician_id
  WHERE bm.band_id = $1
    AND bm.status = 'active'
    AND msk.song_id = s.id
    AND msk.can_perform_live = true
) = (
  SELECT COUNT(*)
  FROM public.band_members
  WHERE band_id = $1 AND status = 'active'
);
```

**Find musicians near a city who know songs in our setlist:**

```sql
SELECT
  u.id,
  u.display_name,
  u.city,
  mp.roles,
  mp.genres,
  mp.avg_rating,
  COUNT(msk.song_id) AS matching_songs
FROM public.users u
JOIN public.musician_profiles mp ON mp.user_id = u.id
JOIN public.musician_song_knowledge msk ON msk.musician_id = u.id
WHERE u.city = $1                           -- filter by city
  AND msk.song_id = ANY($2::uuid[])         -- songs in our setlist
  AND msk.can_perform_live = true
GROUP BY u.id, u.display_name, u.city, mp.roles, mp.genres, mp.avg_rating
ORDER BY matching_songs DESC, mp.avg_rating DESC;
```
