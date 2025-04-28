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

-- Function to increment agent statistics upon new business registration
CREATE OR REPLACE FUNCTION increment_agent_stats(agent_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agents
  SET
    total_registrations = COALESCE(total_registrations, 0) + 1,
    total_businesses = COALESCE(total_businesses, 0) + 1,
    -- Note: This simple increment assumes current_week_registrations is managed elsewhere
    -- (e.g., reset weekly by a cron job or trigger). If not, this logic needs adjustment.
    current_week_registrations = COALESCE(current_week_registrations, 0) + 1
  WHERE id = agent_id_param;

  -- Optional: Add logging or return value if needed
  -- RAISE NOTICE 'Agent stats updated for ID: %', agent_id_param;
END;
$$;