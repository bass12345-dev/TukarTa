-- 1. Create the 'song-screenshots' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('song-screenshots', 'song-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow users to upload their own screenshots
DROP POLICY IF EXISTS "Users can upload own screenshots" ON storage.objects;
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'song-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to read their own screenshots
DROP POLICY IF EXISTS "Users can read own screenshots" ON storage.objects;
CREATE POLICY "Users can read own screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'song-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to update/delete their own screenshots
DROP POLICY IF EXISTS "Users can update own screenshots" ON storage.objects;
CREATE POLICY "Users can update own screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'song-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'song-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
