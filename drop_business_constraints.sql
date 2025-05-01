-- Drop foreign key constraints linking businesses to users table
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey;
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_created_by_fkey;

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints removed from businesses table.';
END $$;