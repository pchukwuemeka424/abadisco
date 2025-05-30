-- Custom function to insert KYC verification records without role column issue
CREATE OR REPLACE FUNCTION public.insert_kyc_verification(
  p_user_id uuid,
  p_document_type text,
  p_document_image_url text,
  p_document_number text,
  p_status text DEFAULT 'pending'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.kyc_verifications (
    user_id,
    document_type,
    document_image_url,
    document_number,
    status,
    submitted_at
  ) VALUES (
    p_user_id,
    p_document_type,
    p_document_image_url,
    p_document_number,
    p_status,
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION public.insert_kyc_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_kyc_verification TO service_role;

-- Comment explaining the function
COMMENT ON FUNCTION public.insert_kyc_verification IS 'Safely inserts KYC verification records, avoiding RLS policy issues with role column';