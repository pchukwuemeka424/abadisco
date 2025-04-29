-- Users table definition with indexes and triggers
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NULL,
  business_type text NULL,
  registration_number text NULL,
  description text NULL,
  phone text NULL,
  email text NULL,
  website text NULL,
  address text NULL,
  logo_url text NULL,
  facebook text NULL,
  instagram text NULL,
  whatsapp text NULL,
  custom_services text[] NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  full_name text NULL,
  image text NULL,
  status text NULL DEFAULT 'Now Open'::text,
  category text NULL,
  services text NULL,
  market text NULL,
  rating text NULL,
  role text NULL DEFAULT 'users'::text,
  last_sign_in_at text NULL,
  created_by text NULL,
  agent_user_id text NULL,
  updated_at text NULL,
  CONSTRAINT business_profiles_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create index on created_by column
CREATE INDEX IF NOT EXISTS idx_users_agent_user_id ON public.users 
USING btree (created_by) TABLESPACE pg_default;

-- Create composite index on created_by and created_at
CREATE INDEX IF NOT EXISTS idx_users_agent_created_at ON public.users 
USING btree (created_by, created_at) TABLESPACE pg_default;

-- Trigger to log user activity
CREATE TRIGGER log_user_activity
AFTER INSERT OR DELETE OR UPDATE ON users 
FOR EACH ROW
EXECUTE FUNCTION log_activity();

-- Trigger to update agent statistics when a user is created or modified
CREATE TRIGGER update_agent_stats_on_user_change
AFTER INSERT OR UPDATE OF created_by ON users 
FOR EACH ROW
EXECUTE FUNCTION update_agent_statistics();