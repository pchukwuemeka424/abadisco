# Geolocation Feature for Business Listings

## Overview

This feature adds geolocation capabilities to the business listing system, allowing agents to automatically capture their current location when adding new business listings. This improves customer discovery and enables location-based search functionality.

## Features

### 🎯 Automatic Location Capture
- Automatically requests location permission when the add-listing page loads
- Captures precise GPS coordinates (latitude/longitude)
- Records location accuracy and timestamp
- Reverse geocodes coordinates to get human-readable addresses

### 📍 Location Management
- Manual location capture with "Get Current Location" button
- Clear location data option
- Real-time location status indicators
- Visual feedback for location permission states

### 🗺️ Database Integration
- Stores coordinates in the businesses table
- Supports location-based queries
- Includes distance calculation functions
- Optimized with spatial indexes

## Database Schema Changes

### New Columns Added to `businesses` Table

```sql
-- Geolocation fields
latitude DECIMAL(10, 8) NULL,           -- Latitude coordinate
longitude DECIMAL(11, 8) NULL,          -- Longitude coordinate  
location_accuracy DECIMAL(10, 2) NULL,  -- Accuracy in meters
location_timestamp TIMESTAMP WITH TIME ZONE NULL  -- When location was captured
```

### New Database Functions

#### `calculate_distance(lat1, lon1, lat2, lon2)`
Calculates the distance between two points using the Haversine formula.

#### `find_businesses_nearby(center_lat, center_lon, radius_meters)`
Finds businesses within a specified radius of given coordinates.

## Installation

### 1. Run Database Migration

```bash
# Make the migration script executable
chmod +x run-geolocation-migration.mjs

# Run the migration
node run-geolocation-migration.mjs
```

### 2. Environment Variables

Ensure your environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### For Agents

1. **Navigate to Add Listing Page**: Go to `/agent/add-listing`
2. **Location Permission**: The page will automatically request location access
3. **Automatic Capture**: Location is captured automatically when permission is granted
4. **Manual Capture**: Use "Get Current Location" button if needed
5. **Review Location**: Check coordinates and detected address
6. **Submit**: Location data is included with the business listing

### For Developers

#### Location State Management

```typescript
const [locationData, setLocationData] = useState({
  latitude: null as number | null,
  longitude: null as number | null,
  accuracy: null as number | null,
  timestamp: null as string | null,
  address: "" as string,
  isLocationLoading: false,
  locationError: "",
  locationPermission: "prompt" as "granted" | "denied" | "prompt"
});
```

#### Location Functions

```typescript
// Get current location
getCurrentLocation()

// Clear location data
clearLocation()

// Reverse geocode coordinates to address
reverseGeocode(latitude, longitude)
```

## API Integration

### Reverse Geocoding

The feature uses OpenStreetMap's Nominatim service for reverse geocoding:

```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
);
```

### Database Queries

#### Find Businesses Near Location

```sql
SELECT * FROM find_businesses_nearby(5.123456, 7.123456, 5000);
```

#### Calculate Distance

```sql
SELECT calculate_distance(5.123456, 7.123456, 5.123457, 7.123457);
```

## UI Components

### Location Status Indicator

Shows real-time status of location capture:
- 🔵 Loading: Getting location
- 🟢 Success: Location captured
- 🔴 Error: Location error
- ⚪ Default: No location

### Location Actions

- **Get Current Location**: Manual location capture
- **Clear Location**: Remove captured location data

### Location Details

Displays captured information:
- Coordinates (latitude/longitude)
- Accuracy in meters
- Timestamp of capture
- Detected address

## Browser Compatibility

### Required Features
- `navigator.geolocation` API
- HTTPS connection (required for geolocation)
- Modern browser with ES6+ support

### Supported Browsers
- Chrome 50+
- Firefox 55+
- Safari 10+
- Edge 12+

## Privacy & Security

### Location Permission
- Explicit user consent required
- Permission can be denied without affecting other features
- Clear indication of permission status

### Data Storage
- Coordinates stored in database
- Address data from reverse geocoding
- No persistent location tracking
- Data can be cleared by user

### API Usage
- Uses free OpenStreetMap Nominatim service
- Respects rate limits
- No API key required

## Error Handling

### Common Error Scenarios

1. **Permission Denied**
   - User denies location access
   - Clear error message displayed
   - Manual capture option available

2. **Location Unavailable**
   - GPS signal issues
   - Indoor location problems
   - Network connectivity issues

3. **Timeout**
   - Location request takes too long
   - Automatic retry option
   - Manual capture fallback

### Error Messages

```typescript
const errorMessages = {
  PERMISSION_DENIED: "Location permission denied. Please enable location access.",
  POSITION_UNAVAILABLE: "Location information is unavailable.",
  TIMEOUT: "Location request timed out.",
  UNKNOWN: "An unknown error occurred while getting location."
};
```

## Future Enhancements

### Planned Features
- [ ] Map integration for location selection
- [ ] Location history for agents
- [ ] Bulk location import
- [ ] Location-based analytics
- [ ] Geofencing capabilities

### Potential Improvements
- [ ] Offline location caching
- [ ] Multiple geocoding providers
- [ ] Location validation
- [ ] Address autocomplete
- [ ] Location clustering for search results

## Troubleshooting

### Common Issues

1. **Location Not Capturing**
   - Check browser permissions
   - Ensure HTTPS connection
   - Verify GPS is enabled on mobile

2. **Address Not Detected**
   - Check internet connection
   - Verify coordinates are valid
   - Try manual address entry

3. **Database Migration Fails**
   - Check database permissions
   - Verify SQL syntax
   - Ensure Supabase connection

### Debug Information

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'geolocation');
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Test with different browsers
4. Check network connectivity
5. Review database permissions
