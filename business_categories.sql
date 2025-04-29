-- Business Categories and Featured Businesses SQL Schema
-- Created: April 29, 2025

-- Create business_categories table
CREATE TABLE IF NOT EXISTS business_categories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    icon_type VARCHAR(50) NOT NULL,  -- Storing a reference to the icon type
    count INTEGER,
    link_path VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create featured_businesses table
CREATE TABLE IF NOT EXISTS featured_businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    reviews INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create business_highlights table for storing highlights as separate entries
CREATE TABLE IF NOT EXISTS business_highlights (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES featured_businesses(id) ON DELETE CASCADE,
    highlight_text VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create business_categories_stats table for admin dashboard statistics
CREATE TABLE IF NOT EXISTS business_categories_stats (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES business_categories(id) ON DELETE CASCADE,
    total_businesses INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert data for business_categories
INSERT INTO business_categories (title, description, image_path, icon_type, count, link_path) VALUES
('Markets', 'Explore Aba''s vibrant commercial marketplaces', '/images/Eziukwu Market.jpg', 'shopping-bag', 520, '/markets'),
('Fashion & Textiles', 'Quality fabrics and trendy designs', '/images/Cemetery Market.jpeg', 'fabric', NULL, '/search?category=fashion'),
('Restaurants', 'Taste local and international cuisine', '/images/phonepicutres-TA.webp', 'book-open', NULL, '/search?category=restaurants'),
('Electronics', 'Latest gadgets and tech solutions', '/images/Uratta Market.jpeg', 'desktop-computer', NULL, '/search?category=electronics'),
('Hotels & Lodging', 'Comfortable stays for travelers', '/images/RAILWAY .jpeg', 'office-building', NULL, '/search?category=hotels'),
('Footwear & Leather', 'Quality shoes and leather products', '/images/ariaria-market.png', 'user', NULL, '/search?category=footwear'),
('Automotive', 'Vehicle parts and repair services', '/images/Cemetery Market.jpeg', 'briefcase', NULL, '/search?category=automotive'),
('Art & Crafts', 'Local artisan creations and crafts', '/images/Ahia Ohuru (New Market).webp', 'photograph', NULL, '/search?category=art');

-- Insert data for featured_businesses
INSERT INTO featured_businesses (name, category, rating, reviews, image_path) VALUES
('Ariaria International Market', 'Market', 4.8, 420, '/images/ariaria-market.png'),
('Eziukwu Road Market', 'Market', 4.6, 380, '/images/Eziukwu Market.jpg'),
('Luxury Hotel Aba', 'Hotel', 4.7, 215, '/images/Uratta Market.jpeg');

-- Get the IDs for the newly inserted businesses
DO $$
DECLARE
    ariaria_id INTEGER;
    eziukwu_id INTEGER;
    luxury_hotel_id INTEGER;
BEGIN
    -- Get IDs for each business
    SELECT id INTO ariaria_id FROM featured_businesses WHERE name = 'Ariaria International Market';
    SELECT id INTO eziukwu_id FROM featured_businesses WHERE name = 'Eziukwu Road Market';
    SELECT id INTO luxury_hotel_id FROM featured_businesses WHERE name = 'Luxury Hotel Aba';

    -- Insert highlights for Ariaria International Market
    INSERT INTO business_highlights (business_id, highlight_text, display_order) VALUES
    (ariaria_id, 'Largest market in Eastern Nigeria', 1),
    (ariaria_id, 'Specializes in garments and footwear', 2),
    (ariaria_id, 'Over 10,000 shops', 3);

    -- Insert highlights for Eziukwu Road Market
    INSERT INTO business_highlights (business_id, highlight_text, display_order) VALUES
    (eziukwu_id, 'Known for electronics', 1),
    (eziukwu_id, 'Wide variety of imported goods', 2),
    (eziukwu_id, 'Central location', 3);

    -- Insert highlights for Luxury Hotel Aba
    INSERT INTO business_highlights (business_id, highlight_text, display_order) VALUES
    (luxury_hotel_id, '5-star accommodation', 1),
    (luxury_hotel_id, 'Conference facilities', 2),
    (luxury_hotel_id, 'Exquisite dining', 3);
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_business_categories_title ON business_categories (title);
CREATE INDEX IF NOT EXISTS idx_featured_businesses_category ON featured_businesses (category);
CREATE INDEX IF NOT EXISTS idx_business_highlights_business_id ON business_highlights (business_id);

-- Create index for business_categories_stats
CREATE INDEX IF NOT EXISTS idx_business_categories_stats_category_id ON business_categories_stats (category_id);

-- Row Level Security (RLS) Policies
-- Enable Row Level Security
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_highlights ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access to business_categories
CREATE POLICY business_categories_anon_read_policy
  ON business_categories FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to read business_categories
CREATE POLICY business_categories_auth_read_policy
  ON business_categories FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert new business categories
CREATE POLICY business_categories_admin_insert_policy
  ON business_categories FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to update business categories
CREATE POLICY business_categories_admin_update_policy
  ON business_categories FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to delete business categories
CREATE POLICY business_categories_admin_delete_policy
  ON business_categories FOR DELETE
  USING (auth.role() = 'admin');

-- Policy: Allow anonymous read access to featured_businesses
CREATE POLICY featured_businesses_anon_read_policy
  ON featured_businesses FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to read featured_businesses
CREATE POLICY featured_businesses_auth_read_policy
  ON featured_businesses FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert new featured businesses
CREATE POLICY featured_businesses_admin_insert_policy
  ON featured_businesses FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to update featured businesses
CREATE POLICY featured_businesses_admin_update_policy
  ON featured_businesses FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to delete featured businesses
CREATE POLICY featured_businesses_admin_delete_policy
  ON featured_businesses FOR DELETE
  USING (auth.role() = 'admin');

-- Policy: Allow anonymous read access to business_highlights
CREATE POLICY business_highlights_anon_read_policy
  ON business_highlights FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to read business_highlights
CREATE POLICY business_highlights_auth_read_policy
  ON business_highlights FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert business highlights
CREATE POLICY business_highlights_admin_insert_policy
  ON business_highlights FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to update business highlights
CREATE POLICY business_highlights_admin_update_policy
  ON business_highlights FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Policy: Allow only admins to delete business highlights
CREATE POLICY business_highlights_admin_delete_policy
  ON business_highlights FOR DELETE
  USING (auth.role() = 'admin');

-- Example queries:

-- 1. Get all business categories with their counts
-- SELECT title, description, image_path, count, link_path 
-- FROM business_categories 
-- ORDER BY title;

-- 2. Get featured businesses with their highlights
-- SELECT fb.name, fb.category, fb.rating, fb.reviews, fb.image_path, 
--        array_agg(bh.highlight_text ORDER BY bh.display_order) as highlights
-- FROM featured_businesses fb
-- JOIN business_highlights bh ON fb.id = bh.business_id
-- GROUP BY fb.id, fb.name, fb.category, fb.rating, fb.reviews, fb.image_path
-- ORDER BY fb.rating DESC;