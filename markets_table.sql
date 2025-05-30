-- Markets table definition
CREATE TABLE public.markets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NULL,
  description text NULL,
  image_url text NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  is_active boolean NULL DEFAULT true,
  CONSTRAINT markets_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Trigger to log market activity
CREATE TRIGGER log_market_activity
AFTER INSERT OR DELETE OR UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION log_activity();