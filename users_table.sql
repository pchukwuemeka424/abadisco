-- Users table definition with only email and password
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NULL,
  password text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users 
USING btree (email) TABLESPACE pg_default;

-- Trigger to log user activity
CREATE TRIGGER log_user_activity
AFTER INSERT OR DELETE OR UPDATE ON users 
FOR EACH ROW
EXECUTE FUNCTION log_activity();