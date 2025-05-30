-- Updated Users table definition with simplified schema
-- This schema removes fields that might trigger agent record creation

-- Drop the existing table if it exists (uncomment if needed)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create the simplified users table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NULL,
  password text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  full_name text NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users 
USING btree (email) TABLESPACE pg_default;

-- Disable any existing triggers that might create agent records
DROP TRIGGER IF EXISTS update_agent_stats_on_user_change ON public.users;
DROP TRIGGER IF EXISTS log_user_activity ON public.users;

-- Add comment to explain the purpose of this simplified schema
COMMENT ON TABLE public.users IS 'User accounts with simplified schema to prevent automatic agent record creation';