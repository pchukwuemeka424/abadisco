-- Functions to fix business category counts and view tracking

-- Function to get categories with their statistics
CREATE OR REPLACE FUNCTION admin_get_business_categories_with_stats()
RETURNS SETOF business_categories
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the counts first to ensure they're current
  PERFORM update_business_category_counts();
  
  -- Return categories with their stats
  RETURN QUERY
  SELECT 
    bc.*,
    COALESCE(bcs.total_businesses, 0) as total_businesses,
    COALESCE(bcs.total_views, 0) as total_views,
    COALESCE(bcs.total_clicks, 0) as total_clicks
  FROM 
    business_categories bc
  LEFT JOIN 
    business_categories_stats bcs ON bc.id = bcs.category_id
  ORDER BY 
    bc.title;
END;
$$;

-- Function to get overview statistics for the Categories dashboard
CREATE OR REPLACE FUNCTION get_business_categories_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_count integer;
  active_count integer;
  popular_category text;
  popular_count integer;
  newest_cat text;
  newest_date timestamp with time zone;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM business_categories;
  
  -- Get active count (categories with at least one business)
  SELECT COUNT(*) INTO active_count 
  FROM business_categories bc
  JOIN business_categories_stats bcs ON bc.id = bcs.category_id
  WHERE bcs.total_businesses > 0;
  
  -- Get most popular category
  SELECT bc.title, bcs.total_businesses INTO popular_category, popular_count
  FROM business_categories bc
  JOIN business_categories_stats bcs ON bc.id = bcs.category_id
  ORDER BY bcs.total_businesses DESC
  LIMIT 1;
  
  -- Get newest category
  SELECT title, created_at INTO newest_cat, newest_date
  FROM business_categories
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Build the result
  SELECT json_build_object(
    'total_categories', total_count,
    'active_categories', active_count,
    'most_popular_category', COALESCE(popular_category, 'None'),
    'most_popular_category_count', COALESCE(popular_count, 0),
    'newest_category', COALESCE(newest_cat, 'None'),
    'newest_category_date', newest_date
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to update the business category counts
CREATE OR REPLACE FUNCTION update_business_category_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create temporary stats
  CREATE TEMP TABLE temp_category_stats AS
  SELECT 
    category_id,
    COUNT(*) as business_count
  FROM 
    businesses
  WHERE 
    category_id IS NOT NULL
  GROUP BY 
    category_id;
  
  -- Update existing stats
  UPDATE business_categories_stats bcs
  SET 
    total_businesses = tc.business_count,
    last_updated = NOW()
  FROM 
    temp_category_stats tc
  WHERE 
    bcs.category_id = tc.category_id;
  
  -- Insert new stats for categories that don't have entries yet
  INSERT INTO business_categories_stats (category_id, total_businesses, last_updated)
  SELECT 
    tc.category_id,
    tc.business_count,
    NOW()
  FROM 
    temp_category_stats tc
  LEFT JOIN 
    business_categories_stats bcs ON tc.category_id = bcs.category_id
  WHERE 
    bcs.category_id IS NULL;
  
  -- Update the count field in business_categories for backward compatibility
  UPDATE business_categories bc
  SET 
    count = COALESCE(bcs.total_businesses, 0)
  FROM 
    business_categories_stats bcs
  WHERE 
    bc.id = bcs.category_id;
  
  -- Drop temp table
  DROP TABLE temp_category_stats;
  
  -- Create stats entries for categories with no businesses
  INSERT INTO business_categories_stats (category_id, total_businesses, total_views, total_clicks, last_updated)
  SELECT 
    bc.id,
    0,
    0,
    0,
    NOW()
  FROM 
    business_categories bc
  LEFT JOIN 
    business_categories_stats bcs ON bc.id = bcs.category_id
  WHERE 
    bcs.category_id IS NULL;
END;
$$;

-- Function to increment view count for a category
CREATE OR REPLACE FUNCTION increment_category_view(p_category_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create stats record if it doesn't exist
  INSERT INTO business_categories_stats (category_id, total_businesses, total_views, total_clicks, last_updated)
  VALUES (p_category_id, 0, 1, 0, NOW())
  ON CONFLICT (category_id) 
  DO UPDATE SET 
    total_views = business_categories_stats.total_views + 1,
    last_updated = NOW();
END;
$$;

-- Function to update a business category
CREATE OR REPLACE FUNCTION admin_update_business_category(
  p_category_id integer,
  p_title text,
  p_description text,
  p_image_path text,
  p_icon_type text,
  p_link_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE business_categories
  SET 
    title = p_title,
    description = p_description,
    image_path = p_image_path,
    icon_type = p_icon_type,
    link_path = p_link_path,
    updated_at = NOW()
  WHERE 
    id = p_category_id;
END;
$$;

-- Function to create a new business category
CREATE OR REPLACE FUNCTION admin_create_business_category(
  p_title text,
  p_description text,
  p_image_path text,
  p_icon_type text,
  p_link_path text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_category_id integer;
BEGIN
  INSERT INTO business_categories (
    title, 
    description, 
    image_path, 
    icon_type, 
    count, 
    link_path, 
    created_at, 
    updated_at
  )
  VALUES (
    p_title,
    p_description,
    p_image_path,
    p_icon_type,
    0,
    p_link_path,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_category_id;
  
  -- Create initial stats entry
  INSERT INTO business_categories_stats (
    category_id, 
    total_businesses, 
    total_views, 
    total_clicks, 
    last_updated
  )
  VALUES (
    new_category_id,
    0,
    0,
    0,
    NOW()
  );
  
  RETURN new_category_id;
END;
$$;

-- Function to delete a business category
CREATE OR REPLACE FUNCTION admin_delete_business_category(p_category_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the associated stats first
  DELETE FROM business_categories_stats
  WHERE category_id = p_category_id;
  
  -- Then delete the category
  DELETE FROM business_categories
  WHERE id = p_category_id;
END;
$$;