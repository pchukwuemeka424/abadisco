-- Setup Categories Admin Functionality
-- This script sets up all necessary database functions and storage for the admin categories page

-- 1. Ensure the business_categories_stats table exists
CREATE TABLE IF NOT EXISTS business_categories_stats (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES business_categories(id) ON DELETE CASCADE,
    total_businesses INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id)
);

-- 2. Create or replace the function to get categories with stats
CREATE OR REPLACE FUNCTION admin_get_business_categories_with_stats()
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(50),
    description VARCHAR(255),
    image_path VARCHAR(255),
    icon_type VARCHAR(50),
    count INTEGER,
    link_path VARCHAR(100),
    total_businesses INTEGER,
    total_views INTEGER,
    total_clicks INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Update counts first to ensure they're current
    PERFORM update_business_category_counts();
    
    RETURN QUERY
    SELECT 
        bc.id,
        bc.title,
        bc.description,
        bc.image_path,
        bc.icon_type,
        bc.count,
        bc.link_path,
        COALESCE(bcs.total_businesses, 0) as total_businesses,
        COALESCE(bcs.total_views, 0) as total_views,
        COALESCE(bcs.total_clicks, 0) as total_clicks,
        bc.created_at,
        bc.updated_at
    FROM 
        business_categories bc
    LEFT JOIN 
        business_categories_stats bcs ON bc.id = bcs.category_id
    ORDER BY 
        bc.title;
END;
$$;

-- 3. Create or replace the function to get category statistics
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
  LEFT JOIN business_categories_stats bcs ON bc.id = bcs.category_id
  WHERE COALESCE(bcs.total_businesses, bc.count, 0) > 0;
  
  -- Get most popular category
  SELECT bc.title, COALESCE(bcs.total_businesses, bc.count, 0) INTO popular_category, popular_count
  FROM business_categories bc
  LEFT JOIN business_categories_stats bcs ON bc.id = bcs.category_id
  ORDER BY COALESCE(bcs.total_businesses, bc.count, 0) DESC
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

-- 4. Create or replace the function to update business category counts
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

-- 5. Create or replace the function to create a new business category
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
  -- Validate inputs
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Category title cannot be empty';
  END IF;
  
  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'Category description cannot be empty';
  END IF;
  
  IF p_image_path IS NULL OR p_image_path = '' THEN
    RAISE EXCEPTION 'Category image path cannot be empty';
  END IF;
  
  -- Insert the new category
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

-- 6. Create or replace the function to update a business category
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
  -- Check if the category exists
  IF NOT EXISTS (SELECT 1 FROM business_categories WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'Category with ID % does not exist', p_category_id;
  END IF;
  
  -- Validate inputs
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Category title cannot be empty';
  END IF;
  
  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'Category description cannot be empty';
  END IF;
  
  IF p_image_path IS NULL OR p_image_path = '' THEN
    RAISE EXCEPTION 'Category image path cannot be empty';
  END IF;
  
  -- Update the category
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

-- 7. Create or replace the function to delete a business category
CREATE OR REPLACE FUNCTION admin_delete_business_category(p_category_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the category exists
  IF NOT EXISTS (SELECT 1 FROM business_categories WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'Category with ID % does not exist', p_category_id;
  END IF;
  
  -- Check if there are any businesses using this category
  IF EXISTS (SELECT 1 FROM businesses WHERE category_id = p_category_id) THEN
    RAISE EXCEPTION 'Cannot delete category with ID % because it has associated businesses', p_category_id;
  END IF;
  
  -- Delete the associated stats first
  DELETE FROM business_categories_stats
  WHERE category_id = p_category_id;
  
  -- Then delete the category
  DELETE FROM business_categories
  WHERE id = p_category_id;
END;
$$;

-- 8. Create or replace the function to increment category view count
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

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_categories_stats_category_id ON business_categories_stats (category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses (category_id);

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION admin_get_business_categories_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_categories_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_category_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_business_category(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_business_category(integer, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_business_category(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_category_view(integer) TO authenticated;

-- 11. Insert some sample categories if none exist
INSERT INTO business_categories (title, description, image_path, icon_type, count, link_path)
SELECT * FROM (VALUES
  ('Markets', 'Explore Aba''s vibrant commercial marketplaces', '/images/Eziukwu Market.jpg', 'shopping', 0, '/markets'),
  ('Fashion & Textiles', 'Quality fabrics and trendy designs', '/images/Cemetery Market.jpeg', 'fashion', 0, '/search?category=fashion'),
  ('Restaurants', 'Taste local and international cuisine', '/images/phonepicutres-TA.webp', 'food', 0, '/search?category=restaurants'),
  ('Electronics', 'Latest gadgets and tech solutions', '/images/Uratta Market.jpeg', 'electronics', 0, '/search?category=electronics'),
  ('Hotels & Lodging', 'Comfortable stays for travelers', '/images/RAILWAY .jpeg', 'realestate', 0, '/search?category=hotels'),
  ('Footwear & Leather', 'Quality shoes and leather products', '/images/ariaria-market.png', 'fashion', 0, '/search?category=footwear'),
  ('Automotive', 'Vehicle parts and repair services', '/images/Cemetery Market.jpeg', 'automotive', 0, '/search?category=automotive'),
  ('Art & Crafts', 'Local artisan creations and crafts', '/images/Ahia Ohuru (New Market).webp', 'art', 0, '/search?category=art')
) AS v(title, description, image_path, icon_type, count, link_path)
WHERE NOT EXISTS (SELECT 1 FROM business_categories);

-- 12. Create initial stats for existing categories
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

-- 13. Update counts for existing categories
SELECT update_business_category_counts();

-- 14. Create storage bucket for category images if it doesn't exist
-- Note: This requires the storage extension to be enabled
-- The bucket will be created via the Supabase dashboard or CLI

COMMENT ON TABLE business_categories IS 'Business categories for organizing businesses in the marketplace';
COMMENT ON TABLE business_categories_stats IS 'Statistics for business categories including view counts and business counts';
COMMENT ON FUNCTION admin_get_business_categories_with_stats() IS 'Get all business categories with their statistics for admin dashboard';
COMMENT ON FUNCTION get_business_categories_stats() IS 'Get overview statistics for the categories dashboard';
COMMENT ON FUNCTION update_business_category_counts() IS 'Update the business counts for all categories based on actual business associations';
