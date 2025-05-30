-- KYC Verifications table definition
CREATE TABLE public.kyc_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  document_image_url text NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  submitted_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at timestamp with time zone NULL,
  processed_by uuid NULL,
  rejection_reason text NULL,
  CONSTRAINT kyc_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT kyc_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT kyc_verifications_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES admin(id)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX idx_kyc_verifications_user_id ON public.kyc_verifications USING btree (user_id);
CREATE INDEX idx_kyc_verifications_status ON public.kyc_verifications USING btree (status);

-- Trigger to log KYC verification activity
CREATE TRIGGER log_kyc_verification_activity
AFTER INSERT OR DELETE OR UPDATE ON kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION log_activity();