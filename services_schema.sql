-- Services Schema for Business Listings
-- Created on: 2025-05-01

-- Table for Service Types (Restaurant, Bar, etc.)
CREATE TABLE IF NOT EXISTS service_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for General Services (Dine-in, Takeaway, etc.)
CREATE TABLE IF NOT EXISTS general_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Service Categories (e.g., Local Dishes, Beverages)
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    service_type_id INTEGER REFERENCES service_types(id),
    description TEXT,
    is_subcategory BOOLEAN DEFAULT FALSE,
    parent_category_id INTEGER REFERENCES service_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, service_type_id)
);

-- Table for Specific Services (e.g., Nkwobi, Suya, etc.)
CREATE TABLE IF NOT EXISTS specific_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES service_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Junction table for Business and Services
CREATE TABLE IF NOT EXISTS business_services (
    id SERIAL PRIMARY KEY,
    business_id UUID NOT NULL,
    service_id INTEGER REFERENCES specific_services(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, service_id)
);

-- Insert Service Types
INSERT INTO service_types (name) VALUES 
('Restaurant'),
('Bar'),
('Cafe'),
('Bakery'),
('Market'),
('Pharmacy'),
('Salon'),
('Hotel'),
('Boutique'),
('Spa'),
('Gym'),
('Laundry'),
('Auto Repair'),
('Electronics'),
('Other');

-- Insert General Services
INSERT INTO general_services (name) VALUES 
('Dine-in'),
('Takeaway'),
('Delivery'),
('Outdoor Seating'),
('Reservations'),
('Catering');

-- Insert Service Categories for Restaurant
WITH restaurant_id AS (SELECT id FROM service_types WHERE name = 'Restaurant')
INSERT INTO service_categories (name, service_type_id)
VALUES 
('Local Dishes', (SELECT id FROM restaurant_id)),
('Continental Dishes', (SELECT id FROM restaurant_id)),
('Chinese Cuisine', (SELECT id FROM restaurant_id)),
('Fast Food', (SELECT id FROM restaurant_id)),
('Grills & BBQ', (SELECT id FROM restaurant_id)),
('Seafood', (SELECT id FROM restaurant_id)),
('Small Chops', (SELECT id FROM restaurant_id)),
('Vegetarian Options', (SELECT id FROM restaurant_id)),
('Desserts', (SELECT id FROM restaurant_id)),
('Beverages', (SELECT id FROM restaurant_id)),
('Private Dining', (SELECT id FROM restaurant_id)),
('Event Catering', (SELECT id FROM restaurant_id));

-- Insert Specific Services for Local Dishes
WITH local_dishes_id AS (
    SELECT sc.id FROM service_categories sc
    JOIN service_types st ON sc.service_type_id = st.id
    WHERE sc.name = 'Local Dishes' AND st.name = 'Restaurant'
)
INSERT INTO specific_services (name, category_id)
VALUES 
('Nkwobi', (SELECT id FROM local_dishes_id)),
('Isiewu', (SELECT id FROM local_dishes_id)),
('Suya', (SELECT id FROM local_dishes_id)),
('Restaurant Pepper Soup', (SELECT id FROM local_dishes_id)),
('Egusi Soup', (SELECT id FROM local_dishes_id)),
('Ogbono Soup', (SELECT id FROM local_dishes_id)),
('Okra Soup', (SELECT id FROM local_dishes_id)),
('Afang Soup', (SELECT id FROM local_dishes_id)),
('Edikaikong', (SELECT id FROM local_dishes_id)),
('Oha Soup', (SELECT id FROM local_dishes_id)),
('Banga Soup', (SELECT id FROM local_dishes_id)),
('Jollof Rice', (SELECT id FROM local_dishes_id)),
('Native Rice', (SELECT id FROM local_dishes_id)),
('Ofada Rice & Sauce', (SELECT id FROM local_dishes_id)),
('Moi Moi', (SELECT id FROM local_dishes_id)),
('Akara', (SELECT id FROM local_dishes_id)),
('Tuwo Shinkafa', (SELECT id FROM local_dishes_id)),
('Amala & Ewedu', (SELECT id FROM local_dishes_id)),
('Eba & Soup', (SELECT id FROM local_dishes_id)),
('Fufu & Soup', (SELECT id FROM local_dishes_id)),
('Pounded Yam', (SELECT id FROM local_dishes_id));

-- Insert Service Categories for Bar
WITH bar_id AS (SELECT id FROM service_types WHERE name = 'Bar')
INSERT INTO service_categories (name, service_type_id)
VALUES 
('Local Drinks', (SELECT id FROM bar_id)),
('Beverages', (SELECT id FROM bar_id)),
('Bar Food', (SELECT id FROM bar_id)),
('Services', (SELECT id FROM bar_id));

-- Insert Specific Services for Local Drinks
WITH local_drinks_id AS (
    SELECT sc.id FROM service_categories sc
    JOIN service_types st ON sc.service_type_id = st.id
    WHERE sc.name = 'Local Drinks' AND st.name = 'Bar'
)
INSERT INTO specific_services (name, category_id)
VALUES 
('Palm Wine', (SELECT id FROM local_drinks_id)),
('Bar Pepper Soup', (SELECT id FROM local_drinks_id)),
('Bar Nkwobi', (SELECT id FROM local_drinks_id)),
('Isi Ewu', (SELECT id FROM local_drinks_id)),
('Point & Kill (Fresh Fish)', (SELECT id FROM local_drinks_id)),
('Bar Suya', (SELECT id FROM local_drinks_id));

-- Insert Specific Services for Beverages in Bar
WITH bar_beverages_id AS (
    SELECT sc.id FROM service_categories sc
    JOIN service_types st ON sc.service_type_id = st.id
    WHERE sc.name = 'Beverages' AND st.name = 'Bar'
)
INSERT INTO specific_services (name, category_id)
VALUES 
('Local Beer', (SELECT id FROM bar_beverages_id)),
('Imported Beer', (SELECT id FROM bar_beverages_id)),
('Wine & Spirits', (SELECT id FROM bar_beverages_id)),
('Cocktails', (SELECT id FROM bar_beverages_id)),
('Soft Drinks', (SELECT id FROM bar_beverages_id)),
('Fresh Juices', (SELECT id FROM bar_beverages_id));

-- Insert Market Categories
WITH market_id AS (SELECT id FROM service_types WHERE name = 'Market')
INSERT INTO service_categories (name, service_type_id)
VALUES 
('Clothing & Textiles', (SELECT id FROM market_id)),
('Electronics & Gadgets', (SELECT id FROM market_id)),
('Home Appliances', (SELECT id FROM market_id)),
('Footwear', (SELECT id FROM market_id)),
('Bags & Accessories', (SELECT id FROM market_id)),
('Cosmetics', (SELECT id FROM market_id)),
('Food & Groceries', (SELECT id FROM market_id)),
('Hardware & Tools', (SELECT id FROM market_id)),
('Auto Parts', (SELECT id FROM market_id)),
('Building Materials', (SELECT id FROM market_id)),
('Wholesale', (SELECT id FROM market_id)),
('Retail', (SELECT id FROM market_id)),
('Import/Export', (SELECT id FROM market_id));

-- Adding triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers for each table
CREATE TRIGGER update_service_types_modtime
BEFORE UPDATE ON service_types
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_general_services_modtime
BEFORE UPDATE ON general_services
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_service_categories_modtime
BEFORE UPDATE ON service_categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_specific_services_modtime
BEFORE UPDATE ON specific_services
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_business_services_modtime
BEFORE UPDATE ON business_services
FOR EACH ROW EXECUTE FUNCTION update_modified_column();