-- Migration: Add genre to knowledge and props to profiles
-- This migration adds support for personal song categorization and more detailed profiles.

-- 1. Add genre to musician song knowledge
-- This allows each musician to have their own "type" for a song (e.g. Worship, Acoustic)
ALTER TABLE public.musician_song_knowledge ADD COLUMN IF NOT EXISTS genre TEXT;

-- 2. Add profile metadata to musician profiles
ALTER TABLE public.musician_profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.musician_profiles ADD COLUMN IF NOT EXISTS years_exp INT DEFAULT 0;

-- 2.1 Ensure handle is unique if provided
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'musician_profiles_handle_key') THEN
        ALTER TABLE public.musician_profiles ADD CONSTRAINT musician_profiles_handle_key UNIQUE (handle);
    END IF;
END $$;

-- 3. Comments for clarity
COMMENT ON COLUMN public.musician_song_knowledge.genre IS 'The musician''s personal categorization of the song (e.g., OPM, Rock, Worship)';
COMMENT ON COLUMN public.musician_profiles.handle IS 'Unique artistic or social handle (e.g., @marcorivera)';
COMMENT ON COLUMN public.musician_profiles.years_exp IS 'Total years of professional music experience';
