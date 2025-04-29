-- Business Categories Admin Functions
-- Created: April 29, 2025

-- Create stored functions for admin dashboard and category management

-- Function to get business categories statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_business_categories_stats()
RETURNS TABLE (
    total_categories INTEGER,
    active_categories INTEGER,
    most_popular_category VARCHAR(50),
    most_popular_category_count INTEGER,
    newest_category VARCHAR(50),
    newest_category_date TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM business_categories)::INTEGER AS total_categories,
        (SELECT COUNT(*) FROM business_categories WHERE count > 0)::INTEGER AS active_categories,
        (SELECT title FROM business_categories ORDER BY count DESC NULLS LAST LIMIT 1) AS most_popular_category,
        (SELECT count FROM business_categories ORDER BY count DESC NULLS LAST LIMIT 1)::INTEGER AS most_popular_category_count,
        (SELECT title FROM business_categories ORDER BY created_at DESC LIMIT 1) AS newest_category,
        (SELECT created_at FROM business_categories ORDER BY created_at DESC LIMIT 1) AS newest_category_date;
END;
$$;

-- Function to update category counts based on actual business associations
CREATE OR REPLACE FUNCTION update_business_category_counts()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- This assumes there's a businesses table with a category_id field
    -- Update the counts in the business_categories table
    UPDATE business_categories bc
    SET count = (
        SELECT COUNT(*) 
        FROM businesses b 
        WHERE b.category_id = bc.id AND b.is_active = true
    ),
    updated_at = CURRENT_TIMESTAMP;
END;
$$;

-- Function to create a new business category with proper validation
CREATE OR REPLACE FUNCTION admin_create_business_category(
    p_title VARCHAR(50),
    p_description VARCHAR(255),
    p_image_path VARCHAR(255),
    p_icon_type VARCHAR(50),
    p_link_path VARCHAR(100)
)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_category_id INTEGER;
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
    INSERT INTO business_categories (title, description, image_path, icon_type, link_path)
    VALUES (p_title, p_description, p_image_path, p_icon_type, p_link_path)
    RETURNING id INTO new_category_id;
    
    -- Create initial stats record
    INSERT INTO business_categories_stats (category_id)
    VALUES (new_category_id);
    
    -- Log the activity (the trigger will handle this)
    
    RETURN new_category_id;
END;
$$;

-- Function to update an existing business category
CREATE OR REPLACE FUNCTION admin_update_business_category(
    p_category_id INTEGER,
    p_title VARCHAR(50),
    p_description VARCHAR(255),
    p_image_path VARCHAR(255),
    p_icon_type VARCHAR(50),
    p_link_path VARCHAR(100)
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Check if the category exists
    IF NOT EXISTS (SELECT 1 FROM business_categories WHERE id = p_category_id) THEN
        RAISE EXCEPTION 'Category with ID % does not exist', p_category_id;
        RETURN FALSE;
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
    SET title = p_title,
        description = p_description,
        image_path = p_image_path,
        icon_type = p_icon_type,
        link_path = p_link_path,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_category_id;
    
    -- Log the activity (the trigger will handle this)
    
    RETURN TRUE;
END;
$$;

-- Function to delete a business category
CREATE OR REPLACE FUNCTION admin_delete_business_category(
    p_category_id INTEGER
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Check if the category exists
    IF NOT EXISTS (SELECT 1 FROM business_categories WHERE id = p_category_id) THEN
        RAISE EXCEPTION 'Category with ID % does not exist', p_category_id;
        RETURN FALSE;
    END IF;
    
    -- Check if there are any businesses using this category
    -- This assumes there's a businesses table with a category_id field
    IF EXISTS (SELECT 1 FROM businesses WHERE category_id = p_category_id) THEN
        RAISE EXCEPTION 'Cannot delete category with ID % because it has associated businesses', p_category_id;
        RETURN FALSE;
    END IF;
    
    -- Delete the category stats first (due to foreign key constraint)
    DELETE FROM business_categories_stats WHERE category_id = p_category_id;
    
    -- Delete the category
    DELETE FROM business_categories WHERE id = p_category_id;
    
    -- Log the activity (the trigger will handle this)
    
    RETURN TRUE;
END;
$$;

-- Function to manage featured businesses
CREATE OR REPLACE FUNCTION admin_manage_featured_business(
    p_business_id INTEGER,
    p_is_featured BOOLEAN
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    business_name VARCHAR(100);
BEGIN
    -- Check if the business exists
    -- This assumes there's a businesses table
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id) THEN
        RAISE EXCEPTION 'Business with ID % does not exist', p_business_id;
        RETURN FALSE;
    END IF;
    
    -- Get the business name for the activity log
    SELECT name INTO business_name FROM businesses WHERE id = p_business_id;
    
    -- Check if the business is already in the featured_businesses table
    IF p_is_featured AND NOT EXISTS (SELECT 1 FROM featured_businesses WHERE business_id = p_business_id) THEN
        -- Get business details
        INSERT INTO featured_businesses (
            business_id, 
            name, 
            category, 
            rating, 
            reviews, 
            image_path
        )
        SELECT 
            id, 
            name, 
            (SELECT title FROM business_categories WHERE id = b.category_id),
            COALESCE((SELECT AVG(rating) FROM business_reviews WHERE business_id = b.id), 0),
            COALESCE((SELECT COUNT(*) FROM business_reviews WHERE business_id = b.id), 0),
            primary_image_path
        FROM businesses b
        WHERE id = p_business_id;
        
        -- Log activity - Updated to use action_type instead of type
        INSERT INTO activities (action_type, user_type, description, user_id, resource_type, resource_id)
        VALUES (
            'feature',
            'admin',
            'Business "' || business_name || '" was added to featured businesses',
            auth.uid(),
            'businesses',
            p_business_id
        );
    ELSIF NOT p_is_featured AND EXISTS (SELECT 1 FROM featured_businesses WHERE business_id = p_business_id) THEN
        -- Remove from featured_businesses
        DELETE FROM featured_businesses WHERE business_id = p_business_id;
        
        -- Log activity - Updated to use action_type instead of type
        INSERT INTO activities (action_type, user_type, description, user_id, resource_type, resource_id)
        VALUES (
            'unfeature',
            'admin',
            'Business "' || business_name || '" was removed from featured businesses',
            auth.uid(),
            'businesses',
            p_business_id
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to get business categories for admin dashboard with statistics
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