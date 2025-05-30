-- Products table definition with foreign key to users table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  image_urls text NULL,
  title text NULL,
  owner_id text NULL,
  CONSTRAINT products_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Trigger to log product activity
CREATE TRIGGER log_product_activity
AFTER INSERT OR DELETE OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_activity();