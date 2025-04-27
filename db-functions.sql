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