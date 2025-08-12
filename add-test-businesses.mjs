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

// Test businesses with coordinates in different locations
const testBusinesses = [
  {
    name: "London Coffee Shop",
    description: "Premium coffee and pastries in central London",
    contact_phone: "+44 20 7123 4567",
    contact_email: "info@londoncoffee.com",
    address: "123 Oxford Street, London",
    latitude: 51.5074,
    longitude: -0.1278,
    location_accuracy: 25,
    status: "active"
  },
  {
    name: "Manchester Tech Hub",
    description: "Innovative technology solutions and consulting",
    contact_phone: "+44 161 123 4567",
    contact_email: "hello@manchestertech.com",
    address: "456 Deansgate, Manchester",
    latitude: 53.4808,
    longitude: -2.2426,
    location_accuracy: 30,
    status: "active"
  },
  {
    name: "Birmingham Design Studio",
    description: "Creative design and branding services",
    contact_phone: "+44 121 123 4567",
    contact_email: "studio@birminghamdesign.com",
    address: "789 New Street, Birmingham",
    latitude: 52.4862,
    longitude: -1.8904,
    location_accuracy: 20,
    status: "active"
  },
  {
    name: "Liverpool Music Store",
    description: "Instruments, lessons, and music equipment",
    contact_phone: "+44 151 123 4567",
    contact_email: "music@liverpoolstore.com",
    address: "321 Bold Street, Liverpool",
    latitude: 53.4084,
    longitude: -2.9916,
    location_accuracy: 35,
    status: "active"
  },
  {
    name: "Edinburgh Bookshop",
    description: "Independent bookstore with rare and new titles",
    contact_phone: "+44 131 123 4567",
    contact_email: "books@edinburghshop.com",
    address: "654 Royal Mile, Edinburgh",
    latitude: 55.9533,
    longitude: -3.1883,
    location_accuracy: 15,
    status: "active"
  }
];

async function addTestBusinesses() {
  try {
    console.log('Adding test businesses with coordinates...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const business of testBusinesses) {
      try {
        console.log(`Adding: ${business.name}`);
        
        const { data, error } = await supabase
          .from('businesses')
          .insert([{
            name: business.name,
            description: business.description,
            contact_phone: business.contact_phone,
            contact_email: business.contact_email,
            address: business.address,
            latitude: business.latitude,
            longitude: business.longitude,
            location_accuracy: business.location_accuracy,
            location_timestamp: new Date().toISOString(),
            status: business.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.error(`Error adding ${business.name}:`, error);
          errorCount++;
        } else {
          console.log(`✓ Added ${business.name} (ID: ${data[0].id})`);
          successCount++;
        }

        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (businessError) {
        console.error(`Error processing ${business.name}:`, businessError);
        errorCount++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Successfully added: ${successCount} businesses`);
    console.log(`Errors: ${errorCount} businesses`);
    console.log(`Total processed: ${testBusinesses.length} businesses`);

    if (successCount > 0) {
      console.log('\nNow run the populate-detected-addresses.mjs script to populate detected addresses for these new businesses.');
    }

  } catch (error) {
    console.error('Script failed:', error);
  }
}

addTestBusinesses();
