-- Service Categories SQL Schema for Supabase
-- Created: May 1, 2025

-- Create the service_categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
    id SERIAL PRIMARY KEY,  -- Using SERIAL for PostgreSQL auto-increment
    name VARCHAR(100) NOT NULL,         -- Name of the category
    description TEXT,                   -- Optional description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- Using timestamptz
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- Adding updated_at for consistency
) TABLESPACE pg_default;

-- Create the sub_service_categories table
CREATE TABLE IF NOT EXISTS sub_service_categories (
    id SERIAL PRIMARY KEY,          -- Using SERIAL for PostgreSQL auto-increment
    parent_id INTEGER NOT NULL,     -- Reference to the parent category
    name VARCHAR(100) NOT NULL,     -- Name of the sub-category
    description TEXT,               -- Optional description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- Using timestamptz
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- Adding updated_at for consistency
    FOREIGN KEY (parent_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON public.service_categories USING btree (name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_sub_service_parent_id ON sub_service_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_sub_service_categories_name ON sub_service_categories (name);

-- Insert common Nigerian service categories
INSERT INTO service_categories (name, description) VALUES
('Restaurant', 'Places where people pay to sit and eat meals that are cooked and served on the premises.'),
('Hotel', 'Establishments that provide lodging, meals, and other services for travelers.'),
('Barbing Salon', 'Men''s hair grooming and shaving services.'),
('Beauty Salon', 'Women''s hair and beauty services.'),
('Supermarket', 'Large self-service store selling foods and household goods.'),
('Boutique', 'Small shop selling fashionable clothes or accessories.'),
('Electronics Shop', 'Store selling TVs, radios, phones, etc.'),
('Pharmacy', 'Retail store selling medicinal drugs and health products.'),
('ICT Services', 'Providers of tech support, internet, and software development.'),
('Laundry Services', 'Businesses that wash, dry, and iron clothes.'),
('Auto Repair', 'Car and vehicle maintenance and repairs.'),
('Bakery', 'Establishments producing and selling bread, cakes, and pastries.'),
('Event Planning', 'Firms organizing weddings, parties, and corporate events.'),
('Real Estate', 'Companies involved in selling, buying, or renting properties.'),
('Logistics', 'Businesses offering delivery, courier, and transport services.'),
('POS / Fintech Agent', 'Retailers offering financial services with POS machines.'),
('Tailoring / Fashion Design', 'Design and sewing of custom clothing.'),
('Educational Services', 'Schools, tutors, and training centers.'),
('Health Clinics', 'Medical centers offering outpatient care.'),
('Construction Services', 'Building, carpentry, plumbing, and electrical works.'),
('Handyman Services', 'Skilled workers who provide a wide range of repair, maintenance, and improvement services for homes and businesses.');

-- Setup function to insert sub-categories with error handling
DO $$
DECLARE
    restaurant_id INTEGER;
    hotel_id INTEGER;
    barbing_id INTEGER;
    beauty_id INTEGER;
    supermarket_id INTEGER;
    boutique_id INTEGER;
    electronics_id INTEGER;
    pharmacy_id INTEGER;
    ict_id INTEGER;
    laundry_id INTEGER;
    auto_id INTEGER;
    bakery_id INTEGER;
    event_id INTEGER;
    real_estate_id INTEGER;
    logistics_id INTEGER;
    pos_id INTEGER;
    tailoring_id INTEGER;
    education_id INTEGER;
    health_id INTEGER;
    construction_id INTEGER;
    handyman_id INTEGER;
BEGIN
    -- Get IDs for each main category
    SELECT id INTO restaurant_id FROM service_categories WHERE name = 'Restaurant';
    SELECT id INTO hotel_id FROM service_categories WHERE name = 'Hotel';
    SELECT id INTO barbing_id FROM service_categories WHERE name = 'Barbing Salon';
    SELECT id INTO beauty_id FROM service_categories WHERE name = 'Beauty Salon';
    SELECT id INTO supermarket_id FROM service_categories WHERE name = 'Supermarket';
    SELECT id INTO boutique_id FROM service_categories WHERE name = 'Boutique';
    SELECT id INTO electronics_id FROM service_categories WHERE name = 'Electronics Shop';
    SELECT id INTO pharmacy_id FROM service_categories WHERE name = 'Pharmacy';
    SELECT id INTO ict_id FROM service_categories WHERE name = 'ICT Services';
    SELECT id INTO laundry_id FROM service_categories WHERE name = 'Laundry Services';
    SELECT id INTO auto_id FROM service_categories WHERE name = 'Auto Repair';
    SELECT id INTO bakery_id FROM service_categories WHERE name = 'Bakery';
    SELECT id INTO event_id FROM service_categories WHERE name = 'Event Planning';
    SELECT id INTO real_estate_id FROM service_categories WHERE name = 'Real Estate';
    SELECT id INTO logistics_id FROM service_categories WHERE name = 'Logistics';
    SELECT id INTO pos_id FROM service_categories WHERE name = 'POS / Fintech Agent';
    SELECT id INTO tailoring_id FROM service_categories WHERE name = 'Tailoring / Fashion Design';
    SELECT id INTO education_id FROM service_categories WHERE name = 'Educational Services';
    SELECT id INTO health_id FROM service_categories WHERE name = 'Health Clinics';
    SELECT id INTO construction_id FROM service_categories WHERE name = 'Construction Services';
    SELECT id INTO handyman_id FROM service_categories WHERE name = 'Handyman Services';

    -- Insert sub-categories for Restaurant
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (restaurant_id, 'Fast Food', 'Quick service restaurants offering ready-to-eat food.'),
    (restaurant_id, 'Local Nigerian Cuisine', 'Traditional Nigerian dishes and delicacies.'),
    (restaurant_id, 'Continental Restaurant', 'International or European style cuisine.'),
    (restaurant_id, 'Chinese Restaurant', 'Chinese cuisine restaurants.'),
    (restaurant_id, 'Barbecue/Grill', 'Specialized in grilled meats and vegetables.'),
    (restaurant_id, 'Seafood Restaurant', 'Specializing in fish and seafood dishes.'),
    (restaurant_id, 'Food Truck/Mobile Food', 'Mobile food vendors.'),
    (restaurant_id, 'Catering Service', 'Meal preparation for events and parties.'),
    (restaurant_id, 'Fine Dining', 'Upscale restaurants offering premium cuisine and service.'),
    (restaurant_id, 'Cafe', 'Casual establishments serving coffee, light meals, and snacks.'),
    (restaurant_id, 'Buffet Restaurant', 'Self-service dining with multiple food options.'),
    (restaurant_id, 'Street Food Vendor', 'Mobile or stationary street food operations.'),
    (restaurant_id, 'Food Court Stall', 'Food service within shopping malls or markets.'),
    (restaurant_id, 'Pizzeria', 'Specializing in pizza and Italian dishes.'),
    (restaurant_id, 'Burger Joint', 'Focused on hamburgers and fast food.'),
    (restaurant_id, 'Ice Cream Parlor', 'Selling ice cream and frozen desserts.'),
    (restaurant_id, 'Juice Bar', 'Serving fresh fruit juices and smoothies.'),
    (restaurant_id, 'Shawarma Stand', 'Specializing in Middle Eastern wrap sandwiches.'),
    (restaurant_id, 'Suya Spot', 'Specializing in Nigerian spiced meat skewers.'),
    (restaurant_id, 'Pepper Soup Joint', 'Nigerian spicy soup specialties.'),
    (restaurant_id, 'Amala Joint', 'Specializing in Amala and Yoruba cuisine.'),
    (restaurant_id, 'Bukka/Mama Put', 'Traditional Nigerian street food and home cooking.'),
    (restaurant_id, 'Vegetarian/Vegan Restaurant', 'Plant-based menu options.'),
    (restaurant_id, 'Jollof Rice Specialist', 'Focused on various Jollof rice preparations.'),
    (restaurant_id, 'Palm Wine Bar', 'Serving palm wine and local drinks.'),
    (restaurant_id, 'Nkwobi/Isi-Ewu Joint', 'Specializing in spicy cow foot or goat head delicacies.'),
    (restaurant_id, 'Pounded Yam Specialist', 'Known for pounded yam and various soups.'),
    (restaurant_id, 'Beer Parlour with Food', 'Places serving alcoholic beverages with food.'),
    (restaurant_id, 'University Canteen', 'Food services within educational institutions.'),
    (restaurant_id, 'Corporate Canteen', 'Food services within business premises.');

    -- Insert sub-categories for Hotel
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (hotel_id, 'Luxury Hotel', 'High-end accommodations with premium amenities.'),
    (hotel_id, 'Budget Hotel', 'Affordable accommodations with basic amenities.'),
    (hotel_id, 'Boutique Hotel', 'Stylish small hotels with unique character.'),
    (hotel_id, 'Guest House', 'Smaller residential accommodations.'),
    (hotel_id, 'Motel', 'Roadside accommodations primarily for motorists.'),
    (hotel_id, 'Resort', 'Hotels with recreational facilities and activities.'),
    (hotel_id, 'Serviced Apartment', 'Apartment-style accommodations with hotel services.'),
    (hotel_id, 'Business Hotel', 'Catering to business travelers with work facilities.'),
    (hotel_id, 'Airport Hotel', 'Located near airports for traveler convenience.'),
    (hotel_id, 'Conference Hotel', 'Specializing in meeting and conference facilities.'),
    (hotel_id, 'Bed & Breakfast', 'Small lodging offering overnight stays and breakfast.'),
    (hotel_id, 'Hostel', 'Budget accommodations with shared facilities.'),
    (hotel_id, 'Extended Stay Hotel', 'For longer stays with kitchen facilities.'),
    (hotel_id, 'Eco-Hotel', 'Environmentally friendly accommodation.'),
    (hotel_id, 'Spa Hotel', 'Offering extensive spa and wellness facilities.'),
    (hotel_id, 'Heritage Hotel', 'Historic buildings converted to hotels.'),
    (hotel_id, 'Beach Resort', 'Located on or near beaches.'),
    (hotel_id, 'Mountain Lodge', 'Accommodations in mountainous regions.'),
    (hotel_id, 'Convention Center Hotel', 'Connected to or near convention centers.'),
    (hotel_id, 'All-Inclusive Resort', 'Package deals including meals and activities.'),
    (hotel_id, 'Apartment Hotel', 'Hotel-style services in apartment settings.'),
    (hotel_id, 'Family-Oriented Hotel', 'Facilities and services for families with children.'),
    (hotel_id, 'Adults-Only Hotel', 'Restricting guests to adults only.'),
    (hotel_id, 'Transit Hotel', 'For short stays during travel connections.'),
    (hotel_id, 'Boarding House', 'Long-term room rentals with shared facilities.'),
    (hotel_id, 'Hotel with Nightclub', 'Offering on-site nightlife entertainment.'),
    (hotel_id, 'Themed Hotel', 'Based around specific themes or concepts.'),
    (hotel_id, 'Wilderness Lodge', 'Located in remote natural settings.'),
    (hotel_id, 'Design Hotel', 'Focus on unique architectural and interior design.'),
    (hotel_id, 'Container Hotel', 'Made from repurposed shipping containers.');

    -- Insert sub-categories for Barbing Salon
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (barbing_id, 'Traditional Barber Shop', 'Classic haircut and shaving services.'),
    (barbing_id, 'Modern Men''s Grooming', 'Contemporary styles and grooming services.'),
    (barbing_id, 'Kids Barber', 'Specialized in children''s haircuts.'),
    (barbing_id, 'Executive Barber Shop', 'Premium men''s grooming services.'),
    (barbing_id, 'Mobile Barber', 'At-home or on-demand barbing services.'),
    (barbing_id, 'Specialty Haircut Shop', 'Specializing in unique haircut styles.'),
    (barbing_id, 'Hair Coloring Specialist', 'Focused on men''s hair coloring and dyeing.'),
    (barbing_id, 'Beard Sculpting Specialist', 'Expert in detailed beard shaping and styling.'),
    (barbing_id, 'Afro-Textured Hair Specialist', 'Specialized in African hair types.'),
    (barbing_id, 'Hair Loss/Thinning Specialist', 'Addressing male pattern baldness and thinning.'),
    (barbing_id, 'Hot Towel Shave Specialist', 'Traditional straight razor shaves with hot towels.'),
    (barbing_id, 'Corporate Barber', 'Mobile services for office/corporate environments.'),
    (barbing_id, 'Wedding Grooming Specialist', 'Pre-wedding grooming services for men.'),
    (barbing_id, 'Men''s Hair Braiding', 'Braiding and cornrow services for men.'),
    (barbing_id, 'Dreadlock Creation/Maintenance', 'Specializing in creating and maintaining dreadlocks.'),
    (barbing_id, 'Men''s Wigs and Hairpieces', 'Providing and fitting men''s hair systems.'),
    (barbing_id, 'Men''s Hair Extensions', 'Applying and maintaining men''s hair extensions.'),
    (barbing_id, 'Celebrity Barber', 'Serving high-profile clients.'),
    (barbing_id, 'Military Haircut Specialist', 'Meeting military grooming regulations.'),
    (barbing_id, 'Barber School/Academy', 'Training new barbers.'),
    (barbing_id, 'Barbing Equipment Supplier', 'Selling professional barbing tools.'),
    (barbing_id, 'Hair and Scalp Treatment Specialist', 'Addressing scalp conditions and hair health.'),
    (barbing_id, 'Membership Barbershop', 'Subscription-based barber services.'),
    (barbing_id, 'Father-Son Barber', 'Specializing in paired haircuts for fathers and sons.'),
    (barbing_id, 'Corporate Events Barber', 'Pop-up services for corporate events.'),
    (barbing_id, 'Vintage Style Specialist', 'Classic and retro men''s hairstyles.'),
    (barbing_id, 'Men''s Hair Perming', 'Chemical treatments to curl or wave men''s hair.'),
    (barbing_id, 'Men''s Hair Relaxing', 'Chemical treatments to relax tightly curled hair.'),
    (barbing_id, 'Men''s Precision Cutting', 'Highly detailed and precise haircuts.'),
    (barbing_id, 'Eco-Friendly Barber', 'Using sustainable products and practices.');

    -- Insert sub-categories for Beauty Salon
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (beauty_id, 'Hair Salon', 'Hair cutting, styling, and treatment services.'),
    (beauty_id, 'Nail Salon', 'Manicure and pedicure services.'),
    (beauty_id, 'Spa & Massage', 'Body treatments and massage services.'),
    (beauty_id, 'Makeup Studio', 'Professional makeup application services.'),
    (beauty_id, 'Skincare Clinic', 'Facial and skin treatment services.'),
    (beauty_id, 'Hair Extensions & Wigs', 'Specialized in hair extensions and wigs.'),
    (beauty_id, 'Full-Service Beauty Salon', 'Comprehensive beauty services.'),
    (beauty_id, 'Bridal Beauty Services', 'Complete beauty services for brides.'),
    (beauty_id, 'Hair Coloring Specialist', 'Expert in hair dyeing techniques.'),
    (beauty_id, 'Hair Weaving/Extension Expert', 'Specializing in hair additions.'),
    (beauty_id, 'Natural Hair Care Specialist', 'Focused on maintaining natural hair textures.'),
    (beauty_id, 'Lash Extensions', 'Application of false eyelashes.'),
    (beauty_id, 'Eyebrow Threading', 'Precise eyebrow shaping using thread.'),
    (beauty_id, 'Microblading', 'Semi-permanent eyebrow tattooing.'),
    (beauty_id, 'Permanent Makeup', 'Cosmetic tattooing for lasting makeup effects.'),
    (beauty_id, 'Waxing Services', 'Hair removal using wax.'),
    (beauty_id, 'Body Scrub/Exfoliation', 'Removal of dead skin cells.'),
    (beauty_id, 'Tanning Services', 'Spray tans and tanning beds.'),
    (beauty_id, 'Hair Braiding Specialist', 'Expert in various braiding techniques.'),
    (beauty_id, 'Hair Relaxer Specialist', 'Chemical straightening of curly hair.'),
    (beauty_id, 'Traditional Headtie/Gele Artist', 'Expert in Nigerian headwrap styling.'),
    (beauty_id, 'Henna Art', 'Temporary body art using henna.'),
    (beauty_id, 'Anti-Aging Treatments', 'Services targeting signs of aging.'),
    (beauty_id, 'Acne Treatments', 'Specialized care for acne-prone skin.'),
    (beauty_id, 'Hot Stone Therapy', 'Massage incorporating heated stones.'),
    (beauty_id, 'Aromatherapy', 'Therapeutic use of scented oils.'),
    (beauty_id, 'Mobile Beauty Services', 'In-home or on-location beauty treatments.'),
    (beauty_id, 'Men''s Beauty Services', 'Beauty treatments specifically for men.'),
    (beauty_id, 'Organic/Natural Beauty Products', 'Using natural and organic cosmetics.'),
    (beauty_id, 'Traditional Beauty Practices', 'Cultural beauty traditions and techniques.');

    -- Insert sub-categories for Supermarket
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (supermarket_id, 'Hypermarket', 'Very large supermarkets with diverse product range.'),
    (supermarket_id, 'Mini Mart', 'Small neighborhood convenience stores.'),
    (supermarket_id, 'Grocery Store', 'Focus on food items and household essentials.'),
    (supermarket_id, 'Specialty Food Store', 'Focusing on specific food categories.'),
    (supermarket_id, 'Wholesale Supermarket', 'Bulk purchase shopping with wholesale prices.'),
    (supermarket_id, 'Organic Food Market', 'Specializing in certified organic products.'),
    (supermarket_id, 'Discount Supermarket', 'Focus on lower prices and basic products.'),
    (supermarket_id, 'International Food Store', 'Specializing in imported products.'),
    (supermarket_id, 'Fresh Produce Market', 'Focus on fruits and vegetables.'),
    (supermarket_id, 'Butcher Shop', 'Specializing in meat products.'),
    (supermarket_id, 'Fishmonger', 'Specializing in seafood products.'),
    (supermarket_id, 'Bakery Market', 'Focus on fresh baked goods.'),
    (supermarket_id, 'Delicatessen', 'Specializing in fine foods and meats.'),
    (supermarket_id, 'Health Food Store', 'Focus on nutritional and dietary products.'),
    (supermarket_id, 'Confectionery Store', 'Focus on sweets and candies.'),
    (supermarket_id, 'Halal Food Store', 'Specializing in halal-certified products.'),
    (supermarket_id, 'Gluten-Free Shop', 'Products for gluten-intolerant customers.'),
    (supermarket_id, 'Vegan/Vegetarian Market', 'Plant-based food products.'),
    (supermarket_id, 'Bulk Food Store', 'Selling products in large quantities.'),
    (supermarket_id, 'Farm Shop', 'Direct sales from local farms.'),
    (supermarket_id, 'Convenience Store', 'Small format stores in convenient locations.'),
    (supermarket_id, 'Gas Station Minimart', 'Attached to gas/petrol stations.'),
    (supermarket_id, '24-Hour Supermarket', 'Operating round the clock.'),
    (supermarket_id, 'Online Grocery with Pickup', 'Order online, collect in store.'),
    (supermarket_id, 'African Products Store', 'Specializing in African food items.'),
    (supermarket_id, 'Baby & Child Products Store', 'Specializing in infant and child goods.'),
    (supermarket_id, 'Home Essentials Store', 'Household goods and necessities.'),
    (supermarket_id, 'Frozen Food Specialist', 'Focus on frozen products.'),
    (supermarket_id, 'Traditional Herbs & Spices', 'Specializing in cooking ingredients.'),
    (supermarket_id, 'Ready Meals Specialist', 'Pre-prepared meal solutions.');

    -- Insert sub-categories for Boutique
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (boutique_id, 'Women''s Fashion', 'Women''s clothing and accessories.'),
    (boutique_id, 'Men''s Fashion', 'Men''s clothing and accessories.'),
    (boutique_id, 'Children''s Fashion', 'Children''s clothing and accessories.'),
    (boutique_id, 'Unisex Fashion', 'Clothing for all genders.'),
    (boutique_id, 'Traditional Attire', 'Traditional Nigerian clothing.'),
    (boutique_id, 'Accessories Boutique', 'Fashion accessories and jewelry.'),
    (boutique_id, 'Luxury Designer Boutique', 'High-end designer clothing and accessories.'),
    (boutique_id, 'Streetwear Store', 'Urban and casual fashion styles.'),
    (boutique_id, 'Vintage Clothing Store', 'Retro and second-hand fashion items.'),
    (boutique_id, 'Sustainable Fashion Store', 'Eco-friendly and ethical clothing.'),
    (boutique_id, 'Occasion Wear Specialist', 'Formal and event-specific clothing.'),
    (boutique_id, 'Bridal Boutique', 'Wedding dresses and bridal accessories.'),
    (boutique_id, 'Plus Size Fashion', 'Clothing for larger body types.'),
    (boutique_id, 'Maternity Wear', 'Clothing for pregnant women.'),
    (boutique_id, 'Athletic/Sportswear', 'Clothing for sports and active lifestyles.'),
    (boutique_id, 'Swimwear Store', 'Bathing suits and beach accessories.'),
    (boutique_id, 'Lingerie Boutique', 'Intimate apparel and sleepwear.'),
    (boutique_id, 'Footwear Specialist', 'Shoes and related accessories.'),
    (boutique_id, 'Handbag Store', 'Purses, bags, and related accessories.'),
    (boutique_id, 'Jewelry Store', 'Fashion and costume jewelry.'),
    (boutique_id, 'Watch Retailer', 'Wristwatches and timepieces.'),
    (boutique_id, 'Ankara/African Print Store', 'Specializing in African print fabrics and clothing.'),
    (boutique_id, 'Aso Oke Specialist', 'Traditional Yoruba woven cloth.'),
    (boutique_id, 'Adire/Tie-Dye Boutique', 'Traditional Nigerian tie-dye.'),
    (boutique_id, 'School Uniform Retailer', 'Uniforms for educational institutions.'),
    (boutique_id, 'Secondhand/Thrift Store', 'Pre-owned clothing at lower prices.'),
    (boutique_id, 'Fashion Market Stall', 'Operating within markets.'),
    (boutique_id, 'Online Boutique with Showroom', 'Physical location to view online inventory.'),
    (boutique_id, 'Seasonal Fashion Specialist', 'Focused on specific seasonal wear.'),
    (boutique_id, 'Indigenous Craft Boutique', 'Locally made fashion items.');

    -- Insert sub-categories for Electronics Shop
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (electronics_id, 'Mobile Phone Shop', 'Smartphones and mobile accessories.'),
    (electronics_id, 'Computer Store', 'Computers, laptops, and accessories.'),
    (electronics_id, 'Home Appliances', 'Refrigerators, TVs, washing machines, etc.'),
    (electronics_id, 'Entertainment Electronics', 'Audio, video, and gaming systems.'),
    (electronics_id, 'Electronics Repair', 'Repair services for electronic devices.'),
    (electronics_id, 'Used/Refurbished Electronics', 'Pre-owned electronic devices.'),
    (electronics_id, 'Smartphone Specialty Store', 'Focus exclusively on mobile phones.'),
    (electronics_id, 'Computer Hardware Store', 'Computer components and parts.'),
    (electronics_id, 'Software Retailer', 'Computer and mobile device software.'),
    (electronics_id, 'Gaming Equipment Store', 'Video game consoles and accessories.'),
    (electronics_id, 'Professional Audio Equipment', 'Sound equipment for professionals.'),
    (electronics_id, 'DJ Equipment Supplier', 'Specialized equipment for DJs.'),
    (electronics_id, 'Home Theater Systems', 'Complete audio-visual home setups.'),
    (electronics_id, 'Camera & Photography Store', 'Photography equipment and supplies.'),
    (electronics_id, 'Smart Home Devices', 'Connected home technology.'),
    (electronics_id, 'Office Equipment', 'Printers, scanners, and office electronics.'),
    (electronics_id, 'Security Camera Systems', 'Surveillance equipment.'),
    (electronics_id, 'Electronic Components Supplier', 'Parts for electronic projects.'),
    (electronics_id, 'Battery & Power Supply Store', 'Various batteries and power solutions.'),
    (electronics_id, 'Cable & Adapter Shop', 'Connectivity solutions and adapters.'),
    (electronics_id, 'Medical Electronics', 'Electronic devices for health monitoring.'),
    (electronics_id, 'Car Electronics & Audio', 'Automotive electronic systems.'),
    (electronics_id, 'Solar & Renewable Energy Products', 'Sustainable power solutions.'),
    (electronics_id, 'Electronics Testing Service', 'Verifying functionality of devices.'),
    (electronics_id, 'Custom PC Builder', 'Building computers to specifications.'),
    (electronics_id, 'Electronics Rental', 'Short-term use of electronic devices.'),
    (electronics_id, 'Business IT Provider', 'Electronic solutions for businesses.'),
    (electronics_id, 'Laptop Specialist', 'Focus on portable computers.'),
    (electronics_id, 'Smart Wearables Store', 'Smartwatches and fitness trackers.'),
    (electronics_id, 'Data Recovery Service', 'Retrieving lost information from devices.');

    -- Insert sub-categories for Pharmacy
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (pharmacy_id, 'Retail Pharmacy', 'General medication and health products retail.'),
    (pharmacy_id, 'Hospital Pharmacy', 'Located within or affiliated with hospitals.'),
    (pharmacy_id, 'Community Pharmacy', 'Neighborhood-focused pharmaceutical services.'),
    (pharmacy_id, 'Clinical Pharmacy', 'Specialized in patient-centered medication management.'),
    (pharmacy_id, 'Compounding Pharmacy', 'Creating customized medications for specific patient needs.'),
    (pharmacy_id, 'Mail Order Pharmacy', 'Delivering medications through postal services.'),
    (pharmacy_id, 'Specialty Pharmacy', 'Focusing on medications for complex conditions.'),
    (pharmacy_id, 'Online Pharmacy', 'E-commerce platform for medication sales.'),
    (pharmacy_id, 'Herbal/Natural Medicine Store', 'Traditional and natural remedies.'),
    (pharmacy_id, 'Medical Equipment Supplier', 'Selling health-related devices and equipment.'),
    (pharmacy_id, 'Cosmetic Pharmacy', 'Focus on beauty and skincare products.'),
    (pharmacy_id, 'Diabetic Care Pharmacy', 'Specializing in diabetes management products.'),
    (pharmacy_id, 'Prescription Delivery Service', 'Home delivery of prescribed medications.'),
    (pharmacy_id, 'Vitamin and Supplement Shop', 'Nutritional supplements and vitamins.'),
    (pharmacy_id, 'Baby & Maternal Care Pharmacy', 'Products for infants and new mothers.'),
    (pharmacy_id, 'First Aid Supplier', 'Emergency medical supplies and kits.'),
    (pharmacy_id, 'Sports Medicine Pharmacy', 'Products for athletes and sports injuries.'),
    (pharmacy_id, 'Veterinary Pharmacy', 'Medications for animals and pets.'),
    (pharmacy_id, 'Geriatric Pharmacy', 'Specialized in elderly medication management.'),
    (pharmacy_id, 'Homeopathic Pharmacy', 'Alternative medicine and homeopathic remedies.');

    -- Insert sub-categories for ICT Services
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (ict_id, 'Software Development', 'Custom software and application development.'),
    (ict_id, 'Web Development', 'Website creation and maintenance.'),
    (ict_id, 'IT Support Services', 'Technical support for computer systems.'),
    (ict_id, 'Network Installation', 'Setting up computer networks for businesses.'),
    (ict_id, 'Cybersecurity Services', 'Protection against digital threats and vulnerabilities.'),
    (ict_id, 'Hardware Maintenance', 'Repair and upkeep of computer hardware.'),
    (ict_id, 'Cloud Computing Services', 'Online storage and computing resources.'),
    (ict_id, 'Data Recovery', 'Retrieving lost or damaged digital information.'),
    (ict_id, 'Digital Marketing', 'Online promotion and advertising services.'),
    (ict_id, 'IT Training', 'Education in information technology skills.'),
    (ict_id, 'Mobile App Development', 'Creating applications for smartphones.'),
    (ict_id, 'E-commerce Solutions', 'Online shop setup and management.'),
    (ict_id, 'Database Management', 'Handling and organizing business data.'),
    (ict_id, 'IT Consultancy', 'Strategic technology planning for businesses.'),
    (ict_id, 'VoIP Services', 'Internet-based voice communication.'),
    (ict_id, 'Graphic Design', 'Digital visual content creation.'),
    (ict_id, 'Social Media Management', 'Handling business presence on social platforms.'),
    (ict_id, 'Computer Networking', 'Setting up network infrastructure.'),
    (ict_id, 'Domain & Hosting Services', 'Website address and server space provision.'),
    (ict_id, 'Business Process Automation', 'Streamlining operations with technology.');

    -- Insert sub-categories for Laundry Services
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (laundry_id, 'Dry Cleaning', 'Cleaning clothes without water using chemical solvents.'),
    (laundry_id, 'Wash & Fold', 'Basic washing and folding laundry services.'),
    (laundry_id, 'Ironing Services', 'Professional pressing and ironing of clothes.'),
    (laundry_id, 'Laundromat', 'Self-service coin-operated washing machines.'),
    (laundry_id, 'Pick-up & Delivery', 'Collecting and returning clean laundry.'),
    (laundry_id, 'Commercial Laundry', 'Services for businesses like hotels and restaurants.'),
    (laundry_id, 'Specialized Cleaning', 'For delicate fabrics and special care items.'),
    (laundry_id, 'Shoe Cleaning', 'Professional cleaning of footwear.'),
    (laundry_id, 'Home Textiles Cleaning', 'Services for curtains, rugs, and upholstery.'),
    (laundry_id, 'Express Laundry', 'Rapid turnaround laundry services.'),
    (laundry_id, 'Stain Removal Specialist', 'Expert in removing difficult stains.'),
    (laundry_id, 'Wedding Dress Cleaning', 'Specialized care for bridal gowns.'),
    (laundry_id, 'Uniform Laundry', 'Services for work and school uniforms.'),
    (laundry_id, 'Sports Equipment Cleaning', 'For athletic gear and equipment.'),
    (laundry_id, 'Leather & Suede Cleaning', 'Specialized care for leather items.'),
    (laundry_id, 'Subscription Laundry Service', 'Regular scheduled laundry pickup.'),
    (laundry_id, 'Eco-Friendly Laundry', 'Using environmentally safe cleaning methods.'),
    (laundry_id, 'Hospital/Medical Laundry', 'Specialized cleaning for healthcare facilities.'),
    (laundry_id, 'Industrial Workwear Cleaning', 'Heavy-duty cleaning for work clothes.'),
    (laundry_id, 'Alteration Services with Laundry', 'Combined cleaning and garment adjustment.');

    -- Insert sub-categories for Auto Repair
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (auto_id, 'General Auto Repair', 'Comprehensive vehicle maintenance and repair.'),
    (auto_id, 'Auto Body Repair', 'Fixing vehicle body damage and painting.'),
    (auto_id, 'Engine Repair', 'Specializing in engine diagnostics and fixing.'),
    (auto_id, 'Transmission Services', 'Repair and maintenance of vehicle transmissions.'),
    (auto_id, 'Brake Services', 'Specializing in brake system repair and maintenance.'),
    (auto_id, 'Electrical System Repair', 'Working on vehicle electrical components.'),
    (auto_id, 'Tire Services', 'Tire sales, repair, and alignment.'),
    (auto_id, 'Air Conditioning Services', 'Maintaining and repairing vehicle cooling systems.'),
    (auto_id, 'Mobile Mechanic', 'On-location vehicle repair services.'),
    (auto_id, 'Auto Diagnostics', 'Computer-based vehicle problem identification.'),
    (auto_id, 'Oil Change Service', 'Routine oil replacement and lubrication.'),
    (auto_id, 'Suspension Repair', 'Fixing vehicle suspension systems.'),
    (auto_id, 'Exhaust System Repair', 'Muffler and exhaust pipe maintenance.'),
    (auto_id, 'Car Detailing', 'Thorough cleaning and restoration services.'),
    (auto_id, 'Windshield Repair', 'Fixing or replacing auto glass.'),
    (auto_id, 'Vehicle Inspection Service', 'Comprehensive checkup of vehicle condition.'),
    (auto_id, 'Motorcycle Repair', 'Maintenance services for motorcycles.'),
    (auto_id, 'Fleet Maintenance', 'Servicing multiple commercial vehicles.'),
    (auto_id, 'Classic Car Restoration', 'Restoring vintage and collector vehicles.'),
    (auto_id, 'Diesel Engine Specialist', 'Focused on diesel-powered vehicles.');

    -- Insert sub-categories for Bakery
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (bakery_id, 'Bread Bakery', 'Specializing in various types of bread.'),
    (bakery_id, 'Pastry Shop', 'Focusing on pastries and sweet baked goods.'),
    (bakery_id, 'Cake Shop', 'Specializing in cakes for various occasions.'),
    (bakery_id, 'Specialty Desserts', 'Creating unique and specialized desserts.'),
    (bakery_id, 'Bakery-Cafe', 'Combining baked goods with café services.'),
    (bakery_id, 'Wholesale Bakery', 'Supplying bakery products to businesses.'),
    (bakery_id, 'Artisanal Bakery', 'Handcrafted, high-quality baked products.'),
    (bakery_id, 'Gluten-Free Bakery', 'Specializing in gluten-free baked goods.'),
    (bakery_id, 'Vegan Bakery', 'Bakery products without animal-derived ingredients.'),
    (bakery_id, 'Custom Order Bakery', 'Made-to-order specialized baked goods.'),
    (bakery_id, 'Donut Shop', 'Specializing in various types of donuts.'),
    (bakery_id, 'Cookie Shop', 'Focused on cookies and biscuits.'),
    (bakery_id, 'Wedding Cake Specialist', 'Creating cakes for wedding celebrations.'),
    (bakery_id, 'Pie Shop', 'Specializing in sweet and savory pies.'),
    (bakery_id, 'Cupcake Bakery', 'Focused on cupcakes and small cakes.'),
    (bakery_id, 'Bread Delivery Service', 'Home delivery of fresh bread products.'),
    (bakery_id, 'Nigerian Traditional Pastries', 'Local baked goods and snacks.'),
    (bakery_id, 'Confectionery Shop', 'Specializing in candies and confections.'),
    (bakery_id, 'Bakery Equipment Supplier', 'Selling tools and supplies for baking.'),
    (bakery_id, 'Baking School', 'Classes and workshops teaching baking skills.');

    -- Insert sub-categories for Event Planning
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (event_id, 'Wedding Planner', 'Organizing wedding ceremonies and receptions.'),
    (event_id, 'Corporate Event Planner', 'Planning business meetings and conferences.'),
    (event_id, 'Birthday Party Planner', 'Specializing in birthday celebrations.'),
    (event_id, 'Festival Organizer', 'Managing large-scale festivals and fairs.'),
    (event_id, 'Concert Organizer', 'Planning music and entertainment events.'),
    (event_id, 'Exhibition Planner', 'Organizing trade shows and exhibitions.'),
    (event_id, 'Private Party Planner', 'Handling private gatherings and celebrations.'),
    (event_id, 'Destination Event Planner', 'Specializing in events at remote locations.'),
    (event_id, 'Event Decorator', 'Providing decoration services for events.'),
    (event_id, 'Event Catering Services', 'Food and beverage services for events.'),
    (event_id, 'Event Equipment Rental', 'Supplying equipment for events.'),
    (event_id, 'Event Security Services', 'Providing security for events.'),
    (event_id, 'Event Photography', 'Capturing moments during events.'),
    (event_id, 'Event Videography', 'Recording videos of events.'),
    (event_id, 'Event Entertainment Services', 'Providing performers and entertainment.'),
    (event_id, 'Event Transportation Services', 'Arranging transport for event attendees.'),
    (event_id, 'Event Marketing Services', 'Promoting events to target audiences.'),
    (event_id, 'Event Ticketing Services', 'Managing ticket sales and distribution.'),
    (event_id, 'Event Cleanup Services', 'Post-event cleaning and restoration.'),
    (event_id, 'Event Planning Training', 'Teaching skills for event planning.');

    -- Insert sub-categories for Real Estate
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (real_estate_id, 'Residential Property Sales', 'Selling homes and apartments.'),
    (real_estate_id, 'Commercial Property Sales', 'Selling office and retail spaces.'),
    (real_estate_id, 'Property Leasing', 'Renting properties to tenants.'),
    (real_estate_id, 'Property Management', 'Managing rental properties.'),
    (real_estate_id, 'Real Estate Investment', 'Advising on property investments.'),
    (real_estate_id, 'Real Estate Development', 'Building new properties.'),
    (real_estate_id, 'Real Estate Appraisal', 'Valuing properties for sale or rent.'),
    (real_estate_id, 'Real Estate Consultancy', 'Providing expert advice on real estate.'),
    (real_estate_id, 'Real Estate Marketing', 'Promoting properties for sale or rent.'),
    (real_estate_id, 'Real Estate Legal Services', 'Handling property-related legal matters.'),
    (real_estate_id, 'Luxury Property Sales', 'Specializing in high-end properties.'),
    (real_estate_id, 'Affordable Housing Services', 'Providing low-cost housing solutions.'),
    (real_estate_id, 'Vacation Property Rentals', 'Renting holiday homes and apartments.'),
    (real_estate_id, 'Industrial Property Sales', 'Selling warehouses and factories.'),
    (real_estate_id, 'Land Sales', 'Selling undeveloped land.'),
    (real_estate_id, 'Real Estate Technology Services', 'Providing tech solutions for real estate.'),
    (real_estate_id, 'Real Estate Training', 'Teaching skills for real estate careers.'),
    (real_estate_id, 'Real Estate Photography', 'Taking professional photos of properties.'),
    (real_estate_id, 'Real Estate Videography', 'Creating video tours of properties.'),
    (real_estate_id, 'Real Estate Staging', 'Preparing properties for sale or rent.');

    -- Insert sub-categories for Logistics
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (logistics_id, 'Courier Services', 'Delivering packages and documents.'),
    (logistics_id, 'Freight Services', 'Transporting goods in bulk.'),
    (logistics_id, 'Warehousing Services', 'Storing goods for businesses.'),
    (logistics_id, 'Supply Chain Management', 'Coordinating production and delivery.'),
    (logistics_id, 'E-commerce Logistics', 'Handling online order deliveries.'),
    (logistics_id, 'Last Mile Delivery', 'Delivering goods to final destinations.'),
    (logistics_id, 'Cold Chain Logistics', 'Transporting temperature-sensitive goods.'),
    (logistics_id, 'Logistics Consultancy', 'Providing expert advice on logistics.'),
    (logistics_id, 'Logistics Technology Solutions', 'Offering tech tools for logistics.'),
    (logistics_id, 'Logistics Training', 'Teaching skills for logistics careers.'),
    (logistics_id, 'International Shipping', 'Transporting goods across borders.'),
    (logistics_id, 'Local Delivery Services', 'Transporting goods within cities.'),
    (logistics_id, 'Heavy Equipment Transport', 'Moving large machinery and equipment.'),
    (logistics_id, 'Vehicle Fleet Management', 'Managing company transport vehicles.'),
    (logistics_id, 'Customs Brokerage', 'Handling import/export documentation.'),
    (logistics_id, 'Reverse Logistics', 'Managing returns and recycling.'),
    (logistics_id, 'Logistics Marketing', 'Promoting logistics services.'),
    (logistics_id, 'Logistics Legal Services', 'Handling logistics-related legal matters.'),
    (logistics_id, 'Logistics Insurance Services', 'Providing insurance for goods in transit.'),
    (logistics_id, 'Logistics Equipment Rental', 'Supplying tools and vehicles for logistics.');

    -- Insert sub-categories for POS / Fintech Agent
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (pos_id, 'POS Machine Sales', 'Selling point-of-sale devices.'),
    (pos_id, 'POS Machine Rentals', 'Renting point-of-sale devices.'),
    (pos_id, 'POS Machine Repairs', 'Fixing point-of-sale devices.'),
    (pos_id, 'Mobile Money Services', 'Providing mobile-based financial transactions.'),
    (pos_id, 'Bill Payment Services', 'Handling utility and other bill payments.'),
    (pos_id, 'Money Transfer Services', 'Sending and receiving money.'),
    (pos_id, 'Cash Withdrawal Services', 'Providing cash withdrawal facilities.'),
    (pos_id, 'Cash Deposit Services', 'Accepting cash deposits.'),
    (pos_id, 'Loan Services', 'Offering small loans to customers.'),
    (pos_id, 'Savings Services', 'Providing savings accounts and plans.'),
    (pos_id, 'Insurance Services', 'Selling insurance policies.'),
    (pos_id, 'Investment Services', 'Offering investment opportunities.'),
    (pos_id, 'Fintech Consultancy', 'Providing advice on financial technology.'),
    (pos_id, 'Fintech Training', 'Teaching skills for fintech careers.'),
    (pos_id, 'Fintech Marketing', 'Promoting fintech services.'),
    (pos_id, 'Fintech Legal Services', 'Handling fintech-related legal matters.'),
    (pos_id, 'Fintech Technology Solutions', 'Offering tech tools for fintech.'),
    (pos_id, 'Fintech Equipment Sales', 'Selling tools and devices for fintech.'),
    (pos_id, 'Fintech Equipment Rentals', 'Renting tools and devices for fintech.'),
    (pos_id, 'Fintech Equipment Repairs', 'Fixing tools and devices for fintech.');

    -- Insert sub-categories for Tailoring / Fashion Design
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (tailoring_id, 'Custom Clothing Design', 'Creating unique clothing designs.'),
    (tailoring_id, 'Clothing Alterations', 'Adjusting clothing to fit better.'),
    (tailoring_id, 'Clothing Repairs', 'Fixing damaged clothing.'),
    (tailoring_id, 'Clothing Embroidery', 'Adding decorative stitching to clothing.'),
    (tailoring_id, 'Clothing Printing', 'Adding designs to clothing using printing.'),
    (tailoring_id, 'Clothing Dyeing', 'Changing the color of clothing.'),
    (tailoring_id, 'Clothing Pattern Making', 'Creating patterns for clothing designs.'),
    (tailoring_id, 'Clothing Sewing Classes', 'Teaching sewing skills.'),
    (tailoring_id, 'Clothing Design Consultancy', 'Providing advice on clothing design.'),
    (tailoring_id, 'Clothing Design Marketing', 'Promoting clothing design services.'),
    (tailoring_id, 'Clothing Design Technology Solutions', 'Offering tech tools for clothing design.'),
    (tailoring_id, 'Clothing Design Equipment Sales', 'Selling tools and devices for clothing design.'),
    (tailoring_id, 'Clothing Design Equipment Rentals', 'Renting tools and devices for clothing design.'),
    (tailoring_id, 'Clothing Design Equipment Repairs', 'Fixing tools and devices for clothing design.'),
    (tailoring_id, 'Clothing Design Training', 'Teaching skills for clothing design careers.'),
    (tailoring_id, 'Clothing Design Legal Services', 'Handling clothing design-related legal matters.'),
    (tailoring_id, 'Clothing Design Insurance Services', 'Providing insurance for clothing design businesses.'),
    (tailoring_id, 'Clothing Design Equipment Supplier', 'Supplying tools and devices for clothing design.'),
    (tailoring_id, 'Clothing Design Equipment Manufacturer', 'Making tools and devices for clothing design.');

    -- Insert sub-categories for Educational Services
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (education_id, 'Primary School', 'Providing education for young children.'),
    (education_id, 'Secondary School', 'Providing education for teenagers.'),
    (education_id, 'University', 'Providing higher education.'),
    (education_id, 'Vocational School', 'Teaching practical skills for careers.'),
    (education_id, 'Language School', 'Teaching foreign languages.'),
    (education_id, 'Music School', 'Teaching music skills.'),
    (education_id, 'Art School', 'Teaching art skills.'),
    (education_id, 'Dance School', 'Teaching dance skills.'),
    (education_id, 'Sports School', 'Teaching sports skills.'),
    (education_id, 'Driving School', 'Teaching driving skills.'),
    (education_id, 'Cooking School', 'Teaching cooking skills.'),
    (education_id, 'Technology School', 'Teaching technology skills.'),
    (education_id, 'Business School', 'Teaching business skills.'),
    (education_id, 'Medical School', 'Teaching medical skills.'),
    (education_id, 'Law School', 'Teaching legal skills.'),
    (education_id, 'Engineering School', 'Teaching engineering skills.'),
    (education_id, 'Science School', 'Teaching science skills.'),
    (education_id, 'Math School', 'Teaching math skills.'),
    (education_id, 'History School', 'Teaching history skills.'),
    (education_id, 'Geography School', 'Teaching geography skills.');

    -- Insert sub-categories for Health Clinics
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (health_id, 'General Practice Clinic', 'Providing general medical care.'),
    (health_id, 'Specialist Clinic', 'Providing specialized medical care.'),
    (health_id, 'Dental Clinic', 'Providing dental care.'),
    (health_id, 'Eye Clinic', 'Providing eye care.'),
    (health_id, 'Ear Clinic', 'Providing ear care.'),
    (health_id, 'Skin Clinic', 'Providing skin care.'),
    (health_id, 'Hair Clinic', 'Providing hair care.'),
    (health_id, 'Nail Clinic', 'Providing nail care.'),
    (health_id, 'Foot Clinic', 'Providing foot care.'),
    (health_id, 'Hand Clinic', 'Providing hand care.'),
    (health_id, 'Heart Clinic', 'Providing heart care.'),
    (health_id, 'Lung Clinic', 'Providing lung care.'),
    (health_id, 'Kidney Clinic', 'Providing kidney care.'),
    (health_id, 'Liver Clinic', 'Providing liver care.'),
    (health_id, 'Stomach Clinic', 'Providing stomach care.'),
    (health_id, 'Brain Clinic', 'Providing brain care.'),
    (health_id, 'Spine Clinic', 'Providing spine care.'),
    (health_id, 'Joint Clinic', 'Providing joint care.'),
    (health_id, 'Muscle Clinic', 'Providing muscle care.'),
    (health_id, 'Bone Clinic', 'Providing bone care.');

    -- Insert sub-categories for Construction Services
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (construction_id, 'Building Construction', 'Constructing buildings.'),
    (construction_id, 'Road Construction', 'Constructing roads.'),
    (construction_id, 'Bridge Construction', 'Constructing bridges.'),
    (construction_id, 'Tunnel Construction', 'Constructing tunnels.'),
    (construction_id, 'Dam Construction', 'Constructing dams.'),
    (construction_id, 'Power Plant Construction', 'Constructing power plants.'),
    (construction_id, 'Water Plant Construction', 'Constructing water plants.'),
    (construction_id, 'Sewage Plant Construction', 'Constructing sewage plants.'),
    (construction_id, 'Pipeline Construction', 'Constructing pipelines.'),
    (construction_id, 'Railway Construction', 'Constructing railways.'),
    (construction_id, 'Airport Construction', 'Constructing airports.'),
    (construction_id, 'Port Construction', 'Constructing ports.'),
    (construction_id, 'Factory Construction', 'Constructing factories.'),
    (construction_id, 'Warehouse Construction', 'Constructing warehouses.'),
    (construction_id, 'Shopping Mall Construction', 'Constructing shopping malls.'),
    (construction_id, 'Hospital Construction', 'Constructing hospitals.'),
    (construction_id, 'School Construction', 'Constructing schools.'),
    (construction_id, 'Hotel Construction', 'Constructing hotels.'),
    (construction_id, 'Office Construction', 'Constructing offices.'),
    (construction_id, 'Residential Construction', 'Constructing homes.');

    -- Insert sub-categories for Handyman Services (existing 30 + additional 70)
    INSERT INTO sub_service_categories (parent_id, name, description) VALUES
    (handyman_id, 'Plumbing Services', 'Repairing and installing pipes, fixtures, and water systems in homes and businesses.'),
    (handyman_id, 'Electrical Services', 'Handling electrical installations, repairs, and maintenance of electrical systems.'),
    (handyman_id, 'Carpentry Services', 'Working with wood to repair, build, or install structures, furniture, and fixtures.'),
    (handyman_id, 'Painting Services', 'Applying paint to interior and exterior surfaces, including walls, trim, and furniture.'),
    (handyman_id, 'Tiling Services', 'Installing and repairing tile floors, walls, backsplashes, and other surfaces.'),
    (handyman_id, 'Roofing Services', 'Repairing, replacing, and maintaining roofs of various materials.'),
    (handyman_id, 'Door & Window Repair', 'Fixing or replacing doors, windows, hinges, locks, and related hardware.'),
    (handyman_id, 'Drywall Installation & Repair', 'Installing, repairing, and finishing drywall, plasterboard, or gypsum board.'),
    (handyman_id, 'Furniture Assembly', 'Putting together prefabricated furniture and fixtures.'),
    (handyman_id, 'Lawn & Garden Maintenance', 'Caring for yards, lawns, gardens, and outdoor spaces.'),
    (handyman_id, 'Air Conditioning Repair', 'Fixing and maintaining air conditioning units and systems.'),
    (handyman_id, 'Ceiling Fan Installation', 'Installing, replacing, and repairing ceiling fans.'),
    (handyman_id, 'Appliance Repair', 'Fixing and maintaining household appliances like refrigerators, washing machines, etc.'),
    (handyman_id, 'Fence Installation & Repair', 'Building, fixing, and maintaining various types of fences.'),
    (handyman_id, 'Home Security Installation', 'Setting up security systems, cameras, alarms, and related equipment.'),
    (handyman_id, 'Generator Repair & Maintenance', 'Fixing and maintaining power generators, particularly important in Nigeria.'),
    (handyman_id, 'Locksmith Services', 'Installing, repairing, and replacing locks, making duplicate keys.'),
    (handyman_id, 'Pest Control Services', 'Eliminating and preventing pest infestations in homes and businesses.'),
    (handyman_id, 'General Home Repairs', 'Handling various small repairs and maintenance tasks around the house.'),
    (handyman_id, 'Flooring Installation & Repair', 'Installing and fixing various types of flooring including wood, laminate, vinyl.'),
    (handyman_id, 'Bathroom Remodeling', 'Renovating and updating bathrooms, including fixtures, tiles, and plumbing.'),
    (handyman_id, 'Kitchen Remodeling', 'Renovating and upgrading kitchens, including cabinets, countertops, and appliances.'),
    (handyman_id, 'Deck & Patio Construction', 'Building and repairing outdoor living spaces like decks, patios, and verandas.'),
    (handyman_id, 'Gutter Cleaning & Repair', 'Maintaining, cleaning, and fixing gutters and downspouts.'),
    (handyman_id, 'Pressure Washing', 'Cleaning exterior surfaces like buildings, walkways, and driveways with pressure washers.'),
    (handyman_id, 'Solar Panel Installation', 'Installing and maintaining solar power systems for homes and businesses.'),
    (handyman_id, 'Smart Home Installation', 'Setting up and configuring smart home devices and systems.'),
    (handyman_id, 'Soundproofing Services', 'Installing materials and systems to reduce noise transmission.'),
    (handyman_id, 'Welding Services', 'Joining metal parts using heat and pressure, for repairs or fabrication.'),
    (handyman_id, 'Water Tank Installation', 'Setting up and maintaining water storage systems, common in Nigeria.'),
    -- Additional Handyman Specialized Services
    (handyman_id, 'Light Fixture Installation', 'Installing, replacing, and repairing various types of indoor and outdoor lighting fixtures.'),
    (handyman_id, 'Bathroom Fixture Installation', 'Installing sinks, toilets, showers, and other bathroom fixtures.'),
    (handyman_id, 'Kitchen Fixture Installation', 'Installing sinks, faucets, disposal units, and other kitchen fixtures.'),
    (handyman_id, 'Cabinet Installation & Repair', 'Building, installing, and fixing cabinets for kitchens, bathrooms, and other spaces.'),
    (handyman_id, 'Countertop Installation', 'Installing and repairing various types of countertops including marble, granite, and laminate.'),
    (handyman_id, 'Garage Door Repair', 'Fixing and maintaining garage doors and their opening mechanisms.'),
    (handyman_id, 'Weather Stripping', 'Installing materials to seal gaps around doors and windows to prevent air and water infiltration.'),
    (handyman_id, 'Insulation Installation', 'Installing thermal and acoustic insulation in walls, attics, and crawl spaces.'),
    (handyman_id, 'Mold Remediation', 'Identifying, treating, and removing mold from homes and buildings.'),
    (handyman_id, 'Water Damage Repair', 'Repairing and restoring areas damaged by water leaks or flooding.'),
    -- IT Construction & Infrastructure Services
    (handyman_id, 'Structured Cabling Installation', 'Installing organized, standardized cabling systems for data, voice, and video.'),
    (handyman_id, 'Network Closet Setup', 'Creating dedicated spaces for housing network equipment with proper cooling and power.'),
    (handyman_id, 'Server Room Construction', 'Building specialized rooms with controlled environments for server and IT equipment.'),
    (handyman_id, 'Data Center Infrastructure', 'Constructing facilities designed specifically for housing computer systems and components.'),
    (handyman_id, 'Cable Management Systems', 'Installing systems to organize and protect cables in IT environments.'),
    (handyman_id, 'Raised Floor Installation', 'Installing elevated flooring systems for cable management in server rooms.'),
    (handyman_id, 'Network Cabling Repair', 'Diagnosing and fixing issues with network cables and connections.'),
    (handyman_id, 'IT Equipment Rack Installation', 'Assembling and securing racks for servers and networking equipment.'),
    (handyman_id, 'Cable Conduit Installation', 'Installing protective tubing for routing and protecting cabling.'),
    (handyman_id, 'LAN/WAN Infrastructure Setup', 'Creating physical infrastructure for local and wide area networks.'),
    -- Home & Office Network Services
    (handyman_id, 'Home Network Installation', 'Setting up residential internet networks including routers and access points.'),
    (handyman_id, 'WiFi Optimization', 'Improving wireless network coverage and performance in homes and offices.'),
    (handyman_id, 'Wired Network Installation', 'Installing ethernet cabling and wired network infrastructure.'),
    (handyman_id, 'Satellite Dish Installation', 'Installing and aligning satellite dishes for television and internet services.'),
    (handyman_id, 'CCTV Camera Installation', 'Setting up surveillance camera systems for security monitoring.'),
    (handyman_id, 'Intercom System Installation', 'Installing communication systems between rooms or buildings.'),
    (handyman_id, 'Home Theater Setup', 'Installing audio-visual equipment for dedicated entertainment spaces.'),
    (handyman_id, 'TV Mounting', 'Securely attaching televisions to walls with proper brackets.'),
    (handyman_id, 'Sound System Installation', 'Setting up speakers and audio equipment in homes or venues.'),
    (handyman_id, 'Projector Installation', 'Mounting and configuring projectors for home theaters or business presentations.'),
    -- Specialized Technical Handyman Services
    (handyman_id, 'UPS Installation', 'Setting up uninterruptible power supplies for critical equipment.'),
    (handyman_id, 'Electrical Panel Upgrade', 'Enhancing electrical service panels to handle increased power demands.'),
    (handyman_id, 'Inverter Installation', 'Installing devices that convert DC power to AC power for backup power systems.'),
    (handyman_id, 'Battery Backup Systems', 'Installing energy storage systems for power outage protection.'),
    (handyman_id, 'Surge Protection Installation', 'Setting up devices to protect electronics from power surges.'),
    (handyman_id, 'Grounding System Installation', 'Installing proper electrical grounding for safety and equipment protection.'),
    (handyman_id, 'Electric Vehicle Charging Station', 'Installing charging equipment for electric vehicles.'),
    (handyman_id, 'LED Lighting Conversion', 'Upgrading existing lighting systems to energy-efficient LED technology.'),
    (handyman_id, 'Motion Sensor Light Installation', 'Setting up lights that activate when movement is detected.'),
    (handyman_id, 'Automated Lighting Systems', 'Installing programmable and remote-controlled lighting systems.'),
    -- Home Automation & Smart Building Services
    (handyman_id, 'Smart Thermostat Installation', 'Installing programmable temperature control devices.'),
    (handyman_id, 'Smart Doorbell Installation', 'Setting up video doorbells with mobile connectivity.'),
    (handyman_id, 'Smart Lock Installation', 'Installing keyless entry and remotely controlled door locks.'),
    (handyman_id, 'Home Automation Hub Setup', 'Configuring central control systems for smart home devices.'),
    (handyman_id, 'Voice Assistant Integration', 'Connecting various home systems to voice-controlled assistants.'),
    (handyman_id, 'Smart Lighting Control', 'Installing app-controlled or automated lighting systems.'),
    (handyman_id, 'Smart Appliance Integration', 'Connecting kitchen and home appliances to automation systems.'),
    (handyman_id, 'Automated Blinds/Curtains', 'Installing motorized window coverings with remote or scheduled operation.'),
    (handyman_id, 'Smart Irrigation Systems', 'Setting up automated and weather-responsive garden watering systems.'),
    (handyman_id, 'Energy Monitoring Systems', 'Installing devices to track and optimize energy usage.'),
    -- Environmental Control & Sustainability Services
    (handyman_id, 'Rainwater Harvesting System', 'Installing systems to collect and store rainwater for various uses.'),
    (handyman_id, 'Greywater Recycling System', 'Setting up systems to reuse water from sinks, showers, and washing machines.'),
    (handyman_id, 'Solar Water Heater Installation', 'Installing systems that use solar energy to heat water.'),
    (handyman_id, 'Home Ventilation Systems', 'Setting up systems for proper air circulation and indoor air quality.'),
    (handyman_id, 'Heat Recovery Ventilator Installation', 'Installing systems that recover heat from exhaust air.'),
    (handyman_id, 'Attic Ventilation', 'Installing fans and vents to regulate temperature in attic spaces.'),
    (handyman_id, 'Ductwork Installation & Repair', 'Setting up and fixing systems that distribute heated or cooled air.'),
    (handyman_id, 'Whole House Fan Installation', 'Installing fans that cool entire homes by pulling air in and pushing hot air out.'),
    (handyman_id, 'Ceiling Insulation', 'Adding materials to ceilings to improve thermal efficiency.'),
    (handyman_id, 'Wall Insulation', 'Installing materials in walls to improve energy efficiency and sound dampening.'),
    -- Specialty Construction Services
    (handyman_id, 'Workspace Construction', 'Building dedicated areas for home offices or workshops.'),
    (handyman_id, 'Server Room Cooling', 'Installing specialized cooling systems for IT equipment rooms.'),
    (handyman_id, 'Acoustic Treatment Installation', 'Adding materials to reduce echo and control sound in rooms.'),
    (handyman_id, 'Fireproof Construction', 'Using and installing fire-resistant materials and designs.'),
    (handyman_id, 'Basement Finishing', 'Converting unfinished basements into usable living or working spaces.'),
    (handyman_id, 'Load-Bearing Wall Identification', 'Professionally determining which walls are structural before renovation.'),
    (handyman_id, 'Custom Shelving Installation', 'Creating and installing made-to-measure storage solutions.'),
    (handyman_id, 'Child-Proofing Services', 'Making homes safer for young children through various modifications.'),
    (handyman_id, 'Accessibility Modifications', 'Adapting homes for people with disabilities or mobility challenges.'),
    (handyman_id, 'Technical Room Design', 'Planning specialized spaces for IT, media, or technical equipment.');

END $$;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatically updating the timestamp
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sub_service_categories_updated_at
BEFORE UPDATE ON sub_service_categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_service_categories ENABLE ROW LEVEL SECURITY;

-- Row Level Security (RLS) Policies
-- Service Categories: Allow anonymous read access
CREATE POLICY service_categories_anon_read_policy
  ON service_categories FOR SELECT
  USING (true);

-- Service Categories: Allow authenticated users read access
CREATE POLICY service_categories_auth_read_policy
  ON service_categories FOR SELECT
  USING (true);

-- Service Categories: Only admin can insert
CREATE POLICY service_categories_admin_insert_policy
  ON service_categories FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Service Categories: Only admin can update
CREATE POLICY service_categories_admin_update_policy
  ON service_categories FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Service Categories: Only admin can delete
CREATE POLICY service_categories_admin_delete_policy
  ON service_categories FOR DELETE
  USING (auth.role() = 'admin');

-- Sub Service Categories: Allow anonymous read access
CREATE POLICY sub_service_categories_anon_read_policy
  ON sub_service_categories FOR SELECT
  USING (true);

-- Sub Service Categories: Allow authenticated users read access
CREATE POLICY sub_service_categories_auth_read_policy
  ON sub_service_categories FOR SELECT
  USING (true);

-- Sub Service Categories: Only admin can insert
CREATE POLICY sub_service_categories_admin_insert_policy
  ON sub_service_categories FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Sub Service Categories: Only admin can update
CREATE POLICY sub_service_categories_admin_update_policy
  ON sub_service_categories FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Sub Service Categories: Only admin can delete
CREATE POLICY sub_service_categories_admin_delete_policy
  ON sub_service_categories FOR DELETE
  USING (auth.role() = 'admin');

-- Example queries for Supabase client:

-- 1. Get all service categories
-- SELECT id, name, description FROM service_categories ORDER BY name;

-- 2. Get all sub-categories for a specific parent category
-- SELECT sc.name as parent_category, ssc.name as sub_category, ssc.description 
-- FROM sub_service_categories ssc
-- JOIN service_categories sc ON ssc.parent_id = sc.id
-- WHERE sc.name = 'Restaurant'
-- ORDER BY ssc.name;

-- 3. Get all categories with their sub-categories
-- SELECT sc.name as parent_category, ssc.name as sub_category
-- FROM service_categories sc
-- LEFT JOIN sub_service_categories ssc ON sc.id = ssc.parent_id
-- ORDER BY sc.name, ssc.name;

-- Example of fetching with Supabase client:
/*
// Get all service categories
const { data: serviceCategories, error } = await supabase
  .from('service_categories')
  .select('*')
  .order('name');

// Get specific service category with its sub-categories
const { data: categoryWithSubs, error } = await supabase
  .from('service_categories')
  .select(`
    id,
    name,
    description,
    sub_service_categories (
      id,
      name,
      description
    )
  `)
  .eq('name', 'Restaurant')
  .single();
*/