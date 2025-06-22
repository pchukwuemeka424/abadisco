// Test script to check market permissions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('- Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');
console.log('- Service Key:', supabaseServiceKey ? 'Set' : 'Missing');

async function testMarketPermissions() {
  // Test with anon key (what the frontend uses)
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('\n=== Testing with Anon Key ===');
  
  try {
    console.log('1. Testing SELECT...');
    const { data: selectData, error: selectError } = await supabaseAnon
      .from('markets')
      .select('*');
    
    if (selectError) {
      console.log('SELECT Error:', selectError);
    } else {
      console.log('SELECT Success:', selectData?.length, 'records found');
    }
  } catch (err) {
    console.log('SELECT Exception:', err.message);
  }

  try {
    console.log('2. Testing INSERT...');
    const { data: insertData, error: insertError } = await supabaseAnon
      .from('markets')
      .insert({
        name: 'Test Market',
        location: 'Test Location',
        description: 'Test Description'
      })
      .select();
    
    if (insertError) {
      console.log('INSERT Error:', insertError);
    } else {
      console.log('INSERT Success:', insertData);
      
      // Clean up - delete the test record
      if (insertData && insertData[0]) {
        const { error: deleteError } = await supabaseAnon
          .from('markets')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.log('DELETE Error (cleanup):', deleteError);
        } else {
          console.log('Test record cleaned up successfully');
        }
      }
    }
  } catch (err) {
    console.log('INSERT Exception:', err.message);
  }

  // Test with service role key if available
  if (supabaseServiceKey) {
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n=== Testing with Service Role Key ===');
    
    try {
      console.log('1. Testing INSERT with service role...');
      const { data: serviceInsertData, error: serviceInsertError } = await supabaseService
        .from('markets')
        .insert({
          name: 'Test Market Service',
          location: 'Test Location Service',
          description: 'Test Description Service'
        })
        .select();
      
      if (serviceInsertError) {
        console.log('Service INSERT Error:', serviceInsertError);
      } else {
        console.log('Service INSERT Success:', serviceInsertData);
        
        // Clean up
        if (serviceInsertData && serviceInsertData[0]) {
          const { error: serviceDeleteError } = await supabaseService
            .from('markets')
            .delete()
            .eq('id', serviceInsertData[0].id);
          
          if (serviceDeleteError) {
            console.log('Service DELETE Error (cleanup):', serviceDeleteError);
          } else {
            console.log('Service test record cleaned up successfully');
          }
        }
      }
    } catch (err) {
      console.log('Service INSERT Exception:', err.message);
    }
  }

  // Check RLS status
  console.log('\n=== Checking RLS Status ===');
  try {
    const { data: rlsData, error: rlsError } = await supabaseAnon
      .rpc('sql', { 
        query: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'markets';" 
      });
    
    if (rlsError) {
      console.log('RLS Check Error:', rlsError);
    } else {
      console.log('RLS Status:', rlsData);
    }
  } catch (err) {
    console.log('RLS Check Exception:', err.message);
  }
}

testMarketPermissions().catch(console.error);
