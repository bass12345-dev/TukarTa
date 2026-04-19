-- Migration: 0008_user_location_coords.sql
-- Description: Adds latitude and longitude columns to the users table to support range-based musician searching.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);

COMMENT ON COLUMN public.users.lat IS 'Latitude for musician search';
COMMENT ON COLUMN public.users.lng IS 'Longitude for musician search';
