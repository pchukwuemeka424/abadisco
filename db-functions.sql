-- Function to get users grouped by market
CREATE OR REPLACE FUNCTION get_users_by_market(agent_id UUID)
RETURNS TABLE (
  market TEXT,
  count BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    market,
    COUNT(*) as count
  FROM 
    users
  WHERE 
    agent_user_id = agent_id
    AND market IS NOT NULL
  GROUP BY 
    market
  ORDER BY 
    count DESC;
$$;

-- Function to get users grouped by category
CREATE OR REPLACE FUNCTION get_users_by_category(agent_id UUID)
RETURNS TABLE (
  category TEXT,
  count BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    category,
    COUNT(*) as count
  FROM 
    users
  WHERE 
    agent_user_id = agent_id
    AND category IS NOT NULL
  GROUP BY 
    category
  ORDER BY 
    count DESC;
$$;

-- Create products table with simplified schema
CREATE TABLE IF NOT EXISTS public.products (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  image_urls text null,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

-- Add an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);