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

// Function to reverse geocode coordinates to address
async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AbadiscoApp/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

async function populateDetectedAddresses() {
  try {
    console.log('Starting to populate detected addresses...\n');

    // 1. Find businesses with coordinates but no detected address
    console.log('1. Finding businesses with coordinates but no detected address...');
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, latitude, longitude, detected_address')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .is('detected_address', null);

    if (error) {
      console.error('Error fetching businesses:', error);
      return;
    }

    console.log(`Found ${businesses.length} businesses with coordinates but no detected address`);

    if (businesses.length === 0) {
      console.log('No businesses need detected addresses populated.');
      return;
    }

    // 2. Process each business
    let successCount = 0;
    let errorCount = 0;

    for (const business of businesses) {
      try {
        console.log(`Processing: ${business.name} (${business.latitude}, ${business.longitude})`);
        
        const detectedAddress = await reverseGeocode(business.latitude, business.longitude);
        
        if (detectedAddress) {
          // Update the business with the detected address
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ 
              detected_address: detectedAddress,
              updated_at: new Date().toISOString()
            })
            .eq('id', business.id);

          if (updateError) {
            console.error(`Error updating ${business.name}:`, updateError);
            errorCount++;
          } else {
            console.log(`✓ Updated ${business.name}: ${detectedAddress}`);
            successCount++;
          }
        } else {
          console.log(`✗ Could not get address for ${business.name}`);
          errorCount++;
        }

        // Add a small delay to be respectful to the geocoding service
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (businessError) {
        console.error(`Error processing ${business.name}:`, businessError);
        errorCount++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Successfully updated: ${successCount} businesses`);
    console.log(`Errors: ${errorCount} businesses`);
    console.log(`Total processed: ${businesses.length} businesses`);

  } catch (error) {
    console.error('Script failed:', error);
  }
}

populateDetectedAddresses();
