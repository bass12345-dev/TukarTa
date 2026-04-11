-- Onboarding Schema Updates

-- 1. Update Users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Update Musician Profiles table
ALTER TABLE public.musician_profiles
ADD COLUMN IF NOT EXISTS rate_amount NUMERIC,
ADD COLUMN IF NOT EXISTS rate_type TEXT, -- 'per_gig', 'per_hour'
ADD COLUMN IF NOT EXISTS availability_tags TEXT[] DEFAULT '{}';

-- 2.1 Add unique constraint to user_id (required for ON CONFLICT)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'musician_profiles_user_id_key') THEN
        ALTER TABLE public.musician_profiles ADD CONSTRAINT musician_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Automatic Profile Creation Trigger
-- This function will create rows in public.users and public.musician_profiles
-- whenever a new user signs up via Supabase Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.musician_profiles
  INSERT INTO public.musician_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for public.handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Initial sync for existing users (optional but good for safety)
INSERT INTO public.users (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.musician_profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
