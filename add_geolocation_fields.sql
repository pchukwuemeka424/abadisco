-- Add geolocation fields to businesses table
-- This migration adds latitude, longitude, and location_accuracy fields to track business locations

-- Add geolocation columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL,
ADD COLUMN location_accuracy DECIMAL(10, 2) NULL,
ADD COLUMN location_timestamp TIMESTAMP WITH TIME ZONE NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN public.businesses.latitude IS 'Latitude coordinate of the business location (decimal degrees)';
COMMENT ON COLUMN public.businesses.longitude IS 'Longitude coordinate of the business location (decimal degrees)';
COMMENT ON COLUMN public.businesses.location_accuracy IS 'Accuracy of the location in meters';
COMMENT ON COLUMN public.businesses.location_timestamp IS 'Timestamp when the location was captured';

-- Create a spatial index for location-based queries (requires PostGIS extension)
-- Note: This will only work if PostGIS is installed
-- CREATE INDEX idx_businesses_location ON public.businesses USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Create regular indexes for latitude and longitude for basic queries
CREATE INDEX idx_businesses_latitude ON public.businesses USING btree (latitude);
CREATE INDEX idx_businesses_longitude ON public.businesses USING btree (longitude);

-- Add a check constraint to ensure valid latitude and longitude values
ALTER TABLE public.businesses 
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- Create a function to calculate distance between two points (Haversine formula)
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

-- Create a function to find businesses within a certain radius
CREATE OR REPLACE FUNCTION find_businesses_nearby(
    center_lat DECIMAL, 
    center_lon DECIMAL, 
    radius_meters DECIMAL DEFAULT 5000
) RETURNS TABLE (
    id UUID,
    name TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        calculate_distance(center_lat, center_lon, b.latitude, b.longitude) as distance_meters
    FROM businesses b
    WHERE b.latitude IS NOT NULL 
      AND b.longitude IS NOT NULL
      AND calculate_distance(center_lat, center_lon, b.latitude, b.longitude) <= radius_meters
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
