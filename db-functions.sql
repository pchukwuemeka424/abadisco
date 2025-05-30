-- Function to get users grouped by market
CREATE OR REPLACE FUNCTION get_users_by_market(agent_id UUID)
RETURNS TABLE (
  market_name TEXT,
  count BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    m.name as market_name,
    COUNT(DISTINCT u.id) as count
  FROM 
    users u
  JOIN businesses b ON u.id = b.owner_id
  JOIN markets m ON b.market_id = m.id
  WHERE 
    b.created_by = agent_id
    AND m.name IS NOT NULL
  GROUP BY 
    m.name
  ORDER BY 
    count DESC;
$$;

-- Function to get users grouped by category
CREATE OR REPLACE FUNCTION get_users_by_category(agent_id UUID)
RETURNS TABLE (
  category_name TEXT,
  count BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    bc.name as category_name,
    COUNT(DISTINCT u.id) as count
  FROM 
    users u
  JOIN businesses b ON u.id = b.owner_id
  JOIN business_categories bc ON b.category_id = bc.id
  WHERE 
    b.created_by = agent_id
    AND bc.name IS NOT NULL
  GROUP BY 
    bc.name
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

-- Function to log activities (for triggers)
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_description TEXT;
  resource_type TEXT;
BEGIN
  -- Set the resource type based on the table being modified
  resource_type := TG_TABLE_NAME;
  
  -- Create appropriate descriptions based on operation type and table
  IF (TG_OP = 'INSERT') THEN
    IF (TG_TABLE_NAME = 'products') THEN
      action_description := 'New ' || TG_TABLE_NAME || ' created: ID ' || NEW.id;
    ELSE
      action_description := 'New ' || TG_TABLE_NAME || ' created: ' || coalesce(NEW.name, NEW.title, 'ID ' || NEW.id);
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (TG_TABLE_NAME = 'products') THEN
      action_description := TG_TABLE_NAME || ' updated: ID ' || NEW.id;
    ELSE
      action_description := TG_TABLE_NAME || ' updated: ' || coalesce(NEW.name, NEW.title, 'ID ' || NEW.id);
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (TG_TABLE_NAME = 'products') THEN
      action_description := TG_TABLE_NAME || ' deleted: ID ' || OLD.id;
    ELSE
      action_description := TG_TABLE_NAME || ' deleted: ' || coalesce(OLD.name, OLD.title, 'ID ' || OLD.id);
    END IF;
  END IF;

  -- Insert activity record
  INSERT INTO activities (action_type, user_type, description, resource_type, resource_id)
  VALUES (
    lower(TG_OP),  -- 'insert', 'update', or 'delete'
    'system',      -- Default to system since triggers don't have user context
    action_description,
    resource_type,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
  );
  
  -- Return the appropriate record based on operation
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Custom function to insert KYC verification records without role column issue
CREATE OR REPLACE FUNCTION public.insert_kyc_verification(
  p_user_id uuid,
  p_document_type text,
  p_document_image_url text,
  p_document_number text,
  p_status text DEFAULT 'pending'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.kyc_verifications (
    user_id,
    document_type,
    document_image_url,
    document_number,
    status,
    submitted_at
  ) VALUES (
    p_user_id,
    p_document_type,
    p_document_image_url,
    p_document_number,
    p_status,
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION public.insert_kyc_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_kyc_verification TO service_role;

-- Comment explaining the function
COMMENT ON FUNCTION public.insert_kyc_verification IS 'Safely inserts KYC verification records, avoiding RLS policy issues with role column';