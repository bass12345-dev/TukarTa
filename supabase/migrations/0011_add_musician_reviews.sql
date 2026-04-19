-- Migration 0011: Add Musician Reviews and Ratings system

-- 1. Create musician_reviews table
CREATE TABLE IF NOT EXISTS public.musician_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(musician_id, reviewer_id) -- One review per musician per user
);

-- 2. Add RLS
ALTER TABLE public.musician_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" ON public.musician_reviews
  FOR SELECT USING (true);

CREATE POLICY "Logged in users can leave reviews" ON public.musician_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their reviews" ON public.musician_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- 3. Automatic Average Rating Calculation
CREATE OR REPLACE FUNCTION public.update_musician_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.musician_profiles
  SET 
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.musician_reviews
      WHERE musician_id = NEW.musician_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.musician_reviews
      WHERE musician_id = NEW.musician_id
    )
  WHERE user_id = NEW.musician_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for musician_reviews on INSERT, UPDATE, DELETE
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.musician_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_musician_avg_rating();

-- 4. Seed some sample reviews for Marco (the default profile) if it exists
-- Note: Replace with actual IDs if known, or let developers add via UI.
