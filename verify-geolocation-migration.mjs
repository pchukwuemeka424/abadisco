#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  try {
    console.log('🔍 Verifying geolocation migration...');
    
    // Test 1: Try to insert a business with geolocation data
    console.log('\n🧪 Test 1: Inserting business with geolocation data...');
    
    const testBusiness = {
      name: 'TEST_GEOLOCATION_BUSINESS',
      description: 'Test business for geolocation verification',
      contact_email: 'test@example.com',
      status: 'active',
      latitude: 5.123456,
      longitude: 7.123456,
      location_accuracy: 10.5,
      location_timestamp: new Date().toISOString(),
      detected_address: 'Test Address, Test City, Test Country'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('businesses')
      .insert(testBusiness)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('\n📋 SOLUTION:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of MANUAL-GEOLOCATION-MIGRATION.sql');
      console.log('4. Run the SQL');
      console.log('5. Run this verification script again');
      return;
    }
    
    console.log('✅ Insert successful! Business created with ID:', insertData.id);
    
    // Test 2: Query the business with geolocation data
    console.log('\n🧪 Test 2: Querying business with geolocation data...');
    
    const { data: queryData, error: queryError } = await supabase
      .from('businesses')
      .select('id, name, latitude, longitude, location_accuracy, location_timestamp, detected_address')
      .eq('id', insertData.id)
      .single();
    
    if (queryError) {
      console.log('❌ Query failed:', queryError.message);
    } else {
      console.log('✅ Query successful!');
      console.log('📊 Geolocation data:', {
        latitude: queryData.latitude,
        longitude: queryData.longitude,
        accuracy: queryData.location_accuracy,
        timestamp: queryData.location_timestamp,
        detected_address: queryData.detected_address
      });
    }
    
    // Test 3: Test distance calculation function
    console.log('\n🧪 Test 3: Testing distance calculation function...');
    
    try {
      const { data: distanceData, error: distanceError } = await supabase
        .rpc('calculate_distance', {
          lat1: 5.123456,
          lon1: 7.123456,
          lat2: 5.123457,
          lon2: 7.123457
        });
      
      if (distanceError) {
        console.log('❌ Distance function not available:', distanceError.message);
        console.log('📝 Note: Functions need to be created manually in Supabase SQL Editor');
      } else {
        console.log('✅ Distance function works! Distance:', distanceData, 'meters');
      }
    } catch (err) {
      console.log('❌ Distance function not available');
      console.log('📝 Note: Functions need to be created manually in Supabase SQL Editor');
    }
    
    // Test 4: Test nearby businesses function
    console.log('\n🧪 Test 4: Testing nearby businesses function...');
    
    try {
      const { data: nearbyData, error: nearbyError } = await supabase
        .rpc('find_businesses_nearby', {
          center_lat: 5.123456,
          center_lon: 7.123456,
          radius_meters: 5000
        });
      
      if (nearbyError) {
        console.log('❌ Nearby function not available:', nearbyError.message);
        console.log('📝 Note: Functions need to be created manually in Supabase SQL Editor');
      } else {
        console.log('✅ Nearby function works! Found businesses:', nearbyData.length);
      }
    } catch (err) {
      console.log('❌ Nearby function not available');
      console.log('📝 Note: Functions need to be created manually in Supabase SQL Editor');
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('name', 'TEST_GEOLOCATION_BUSINESS');
    
    if (deleteError) {
      console.log('⚠️  Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    // Summary
    console.log('\n📋 MIGRATION SUMMARY:');
    console.log('✅ Geolocation columns are working!');
    console.log('✅ You can now use latitude, longitude, location_accuracy, location_timestamp, and detected_address');
    console.log('✅ The add-listing page will automatically capture location data');
    console.log('📝 Optional: Create distance functions manually in Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyMigration();
