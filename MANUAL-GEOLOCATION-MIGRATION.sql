-- MANUAL GEOLOCATION MIGRATION
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Add geolocation columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2) NULL;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS detected_address TEXT NULL;

-- Step 2: Add comments to document the new fields
COMMENT ON COLUMN public.businesses.latitude IS 'Latitude coordinate of the business location (decimal degrees)';
COMMENT ON COLUMN public.businesses.longitude IS 'Longitude coordinate of the business location (decimal degrees)';
COMMENT ON COLUMN public.businesses.location_accuracy IS 'Accuracy of the location in meters';
COMMENT ON COLUMN public.businesses.location_timestamp IS 'Timestamp when the location was captured';
COMMENT ON COLUMN public.businesses.detected_address IS 'Address obtained from reverse geocoding the latitude/longitude coordinates';

-- Step 3: Create indexes for latitude and longitude
CREATE INDEX IF NOT EXISTS idx_businesses_latitude ON public.businesses USING btree (latitude);
CREATE INDEX IF NOT EXISTS idx_businesses_longitude ON public.businesses USING btree (longitude);
CREATE INDEX IF NOT EXISTS idx_businesses_detected_address ON public.businesses USING btree (detected_address);

-- Step 4: Add check constraints to ensure valid latitude and longitude values
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS check_latitude_range;

ALTER TABLE public.businesses 
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS check_longitude_range;

ALTER TABLE public.businesses 
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- Step 5: Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371000; -- Earth's radius in meters
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to find businesses within a certain radius
CREATE OR REPLACE FUNCTION find_businesses_nearby(
    center_lat DECIMAL, 
    center_lon DECIMAL, 
    radius_meters DECIMAL DEFAULT 5000
) RETURNS TABLE (
    id UUID,
    name TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    address TEXT,
    detected_address TEXT,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        b.address,
        b.detected_address,
        calculate_distance(center_lat, center_lon, b.latitude, b.longitude) as distance_meters
    FROM businesses b
    WHERE b.latitude IS NOT NULL 
      AND b.longitude IS NOT NULL
      AND calculate_distance(center_lat, center_lon, b.latitude, b.longitude) <= radius_meters
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Verify the migration
-- Check if the new columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN ('latitude', 'longitude', 'location_accuracy', 'location_timestamp', 'detected_address')
ORDER BY column_name;

-- Check if the functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('calculate_distance', 'find_businesses_nearby');

-- Step 8: Test the functions
-- Test distance calculation
SELECT calculate_distance(5.123456, 7.123456, 5.123457, 7.123457) as distance_meters;

-- Test nearby businesses (will return empty if no businesses have coordinates yet)
SELECT * FROM find_businesses_nearby(5.123456, 7.123456, 5000);
