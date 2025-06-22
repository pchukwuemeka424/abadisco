// Simple connection test
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key preview:', supabaseKey.substring(0, 20) + '...')
  
  try {
    // Test 1: Check if markets table exists
    console.log('\n1. Checking if markets table exists...')
    const { data: tableData, error: tableError } = await supabase
      .rpc('sql', { 
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'markets';" 
      })
    
    if (tableError) {
      console.log('Table check failed, trying direct query instead...')
      
      // Test 2: Try direct query
      console.log('2. Testing direct markets query...')
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Direct query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        if (error.code === '42P01') {
          console.log('\n📋 SOLUTION: The markets table does not exist.')
          console.log('Please run this SQL in your Supabase dashboard:')
          console.log('---')
          console.log(`CREATE TABLE public.markets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NULL,
  description text NULL,
  image_url text NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  is_active boolean NULL DEFAULT true,
  CONSTRAINT markets_pkey PRIMARY KEY (id)
);`)
          console.log('---')
        }
        return
      }
      
      console.log('✅ Direct query successful!')
      console.log('Markets data:', data)
    } else {
      console.log('✅ Table exists:', tableData)
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err)
  }
}

testConnection()
