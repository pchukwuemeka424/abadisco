import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetectedAddress() {
  try {
    console.log('Testing detected_address field in businesses table...\n');

    // 1. Check if the field exists
    console.log('1. Checking if detected_address field exists...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'businesses')
      .eq('column_name', 'detected_address');

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
    } else {
      console.log('Columns found:', columns);
    }

    // 2. Check all geolocation fields
    console.log('\n2. Checking all geolocation fields...');
    const { data: geoColumns, error: geoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'businesses')
      .in('column_name', ['detected_address', 'latitude', 'longitude', 'location_accuracy', 'location_timestamp']);

    if (geoError) {
      console.error('Error checking geo columns:', geoError);
    } else {
      console.log('Geolocation columns found:', geoColumns);
    }

    // 3. Check sample data
    console.log('\n3. Checking sample business data...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, address, detected_address, latitude, longitude, location_accuracy, location_timestamp')
      .limit(5);

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
    } else {
      console.log('Sample businesses:', JSON.stringify(businesses, null, 2));
    }

    // 4. Count businesses with detected addresses
    console.log('\n4. Counting businesses with detected addresses...');
    const { data: countData, error: countError } = await supabase
      .from('businesses')
      .select('detected_address', { count: 'exact', head: true })
      .not('detected_address', 'is', null);

    if (countError) {
      console.error('Error counting detected addresses:', countError);
    } else {
      console.log('Businesses with detected addresses:', countData);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDetectedAddress();
