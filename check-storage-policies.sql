-- Script to check existing storage policies in Supabase
                                                                                                                                                                
-- Check if the uploads bucket exists
SELECT * FROM storage.buckets WHERE id = 'uploads';

-- Check existing RLS policies on storage.objects
SELECT policy_id, name, table_id, definition, check_clause, operation, roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Count objects in storage by bucket
SELECT bucket_id, count(*) 
FROM storage.objects 
GROUP BY bucket_id;
