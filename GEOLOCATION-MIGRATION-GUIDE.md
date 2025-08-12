# Geolocation Migration Guide

## Manual Migration Steps

Since the automated migration requires the Supabase service role key, you can run the migration manually in the Supabase dashboard.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query

### Step 2: Run the Migration SQL

Copy and paste the following SQL into the editor and run it:

```sql
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
```

### Step 3: Verify the Migration

After running the migration, you can verify it worked by running this query:

```sql
-- Check if the new columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN ('latitude', 'longitude', 'location_accuracy', 'location_timestamp')
ORDER BY column_name;

-- Check if the functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('calculate_distance', 'find_businesses_nearby');
```

### Step 4: Test the Functions

Test the new functions with sample data:

```sql
-- Test distance calculation
SELECT calculate_distance(5.123456, 7.123456, 5.123457, 7.123457) as distance_meters;

-- Test nearby businesses (will return empty if no businesses have coordinates yet)
SELECT * FROM find_businesses_nearby(5.123456, 7.123456, 5000);
```

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed and configured:

1. Get your service role key from Supabase dashboard
2. Set the environment variable:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Run the migration script:
   ```bash
   node run-geolocation-migration.mjs
   ```

## Verification Checklist

After running the migration, verify:

- [ ] `latitude` column exists in `businesses` table
- [ ] `longitude` column exists in `businesses` table  
- [ ] `location_accuracy` column exists in `businesses` table
- [ ] `location_timestamp` column exists in `businesses` table
- [ ] Indexes on `latitude` and `longitude` were created
- [ ] Check constraints for coordinate ranges were added
- [ ] `calculate_distance` function was created
- [ ] `find_businesses_nearby` function was created

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you're using the service role key, not the anon key
2. **Column Already Exists**: If columns already exist, the migration will fail - check first
3. **Function Already Exists**: Functions will be replaced if they already exist

### Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the new columns
ALTER TABLE public.businesses 
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude,
DROP COLUMN IF EXISTS location_accuracy,
DROP COLUMN IF EXISTS location_timestamp;

-- Remove indexes
DROP INDEX IF EXISTS idx_businesses_latitude;
DROP INDEX IF EXISTS idx_businesses_longitude;

-- Remove constraints
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS check_latitude_range,
DROP CONSTRAINT IF EXISTS check_longitude_range;

-- Remove functions
DROP FUNCTION IF EXISTS calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS find_businesses_nearby(DECIMAL, DECIMAL, DECIMAL);
```

## Next Steps

After the migration is complete:

1. The add-listing page will automatically start capturing location data
2. New business listings will include geolocation information
3. You can use the `find_businesses_nearby` function for location-based searches
4. Consider adding location-based features to your search functionality
