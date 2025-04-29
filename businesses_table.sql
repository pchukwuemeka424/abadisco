-- Businesses table definition
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  market_id uuid NULL,
  category_id integer NULL,  -- Changed from uuid to integer to match the business_categories table
  owner_id uuid NULL,
  contact_phone text NULL,
  contact_email text NULL,
  address text NULL,
  logo_url text NULL,
  status text NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_market_id_fkey FOREIGN KEY (market_id) REFERENCES markets(id),
  CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES business_categories(id),
  CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id)
) TABLESPACE pg_default;

-- Create indexes for foreign key columns for better query performance
CREATE INDEX idx_businesses_market_id ON public.businesses USING btree (market_id);
CREATE INDEX idx_businesses_category_id ON public.businesses USING btree (category_id);
CREATE INDEX idx_businesses_owner_id ON public.businesses USING btree (owner_id);

-- Trigger to log business activity
CREATE TRIGGER log_business_activity
AFTER INSERT OR DELETE OR UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION log_activity();