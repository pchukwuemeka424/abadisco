-- Add detected_address field to businesses table
-- Run this in Supabase SQL Editor

-- Add detected_address column
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS detected_address TEXT NULL;

-- Add comment
COMMENT ON COLUMN public.businesses.detected_address IS 'Address obtained from reverse geocoding the latitude/longitude coordinates';

-- Create index
CREATE INDEX IF NOT EXISTS idx_businesses_detected_address ON public.businesses USING btree (detected_address);

-- Update the find_businesses_nearby function to include detected_address
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

-- Verify
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name = 'detected_address';
