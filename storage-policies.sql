-- Storage policies for Supabase
-- Run this in your Supabase SQL editor

-- Policy for authenticated users to insert files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy for authenticated users to select/read files
CREATE POLICY "Allow authenticated users to view uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Policy for authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'uploads');

-- Policy for authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid() = owner);

-- Public read access for anyone
-- Uncomment this if you want the public to be able to view files
-- CREATE POLICY "Allow public to view uploaded files"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'uploads');