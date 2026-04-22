-- Migration 0013: Storage bucket and RLS for song screenshots

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('song-screenshots', 'song-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Allow authenticated uploads'
    ) THEN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'song-screenshots');
    END IF;
END
$$;

-- 3. Allow public to view the images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Allow public downloads'
    ) THEN
        CREATE POLICY "Allow public downloads" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'song-screenshots');
    END IF;
END
$$;
