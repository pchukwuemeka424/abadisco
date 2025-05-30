-- First ensure the uploads bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;                                            

-- Enable row level security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update the policy for authenticated users to insert files
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

-- Update owner check to use auth.uid() IS NOT NULL for any authenticated user
DROP POLICY IF EXISTS "Allow authenticated users to view uploaded files" ON storage.objects;
CREATE POLICY "Allow authenticated users to view uploaded files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'uploads');

-- Give public read access
DROP POLICY IF EXISTS "Allow public to view uploaded files" ON storage.objects;
CREATE POLICY "Allow public to view uploaded files" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'uploads');

-- Optional: Enable update/delete ownership check with IS NOT NULL fallback
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'uploads' AND (auth.uid() = owner OR owner IS NULL))
WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'uploads' AND (auth.uid() = owner OR owner IS NULL));
