-- Create KYC verifications table
create table public.kyc_verifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  full_name text null,
  id_type text null,
  id_number text null,
  id_file_url text null,
  status text null default 'pending'::text,
  ai_result text null,
  created_at timestamp with time zone null default now(),
  constraint kyc_verifications_pkey primary key (id)
) TABLESPACE pg_default;

-- Trigger to log KYC activity
create trigger log_kyc_activity
after INSERT or DELETE or update on public.kyc_verifications for each row
execute function log_activity();