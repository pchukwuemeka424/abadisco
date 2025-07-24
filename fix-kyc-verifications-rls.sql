-- Migration: Fix RLS policies for kyc_verifications table
-- 1. Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'kyc_verifications' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%I" ON public.kyc_verifications;', pol.policyname);
    END LOOP;
END $$;

-- 3. Allow authenticated users to manage their own KYC records
CREATE POLICY kyc_verifications_user_all_policy ON public.kyc_verifications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. (Optional) Allow admin role to access all records
-- CREATE POLICY kyc_verifications_admin_all_policy ON public.kyc_verifications
--     FOR ALL
--     TO authenticated
--     USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')); 