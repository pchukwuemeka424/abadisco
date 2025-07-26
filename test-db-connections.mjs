#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnections() {
  console.log('🧪 Testing database connections...');
  
  // Test agents table
  console.log('1. Testing agents table...');
  try {
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, full_name, email, status')
      .limit(3);
    
    if (agentsError) {
      console.error('❌ Agents error:', agentsError.message);
    } else {
      console.log(`✅ Agents: Found ${agents?.length || 0} records`);
      if (agents && agents.length > 0) {
        console.log('   Sample:', agents[0]);
      }
    }
  } catch (e) {
    console.error('❌ Agents exception:', e.message);
  }
  
  // Test activities table
  console.log('2. Testing activities table...');
  try {
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(3);
    
    if (activitiesError) {
      console.error('❌ Activities error:', activitiesError.message);
      console.error('   Full error:', JSON.stringify(activitiesError, null, 2));
    } else {
      console.log(`✅ Activities: Found ${activities?.length || 0} records`);
      if (activities && activities.length > 0) {
        console.log('   Sample:', activities[0]);
      }
    }
  } catch (e) {
    console.error('❌ Activities exception:', e.message);
  }
  
  // Test businesses table
  console.log('3. Testing businesses table...');
  try {
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, created_by')
      .limit(3);
    
    if (businessesError) {
      console.error('❌ Businesses error:', businessesError.message);
    } else {
      console.log(`✅ Businesses: Found ${businesses?.length || 0} records`);
    }
  } catch (e) {
    console.error('❌ Businesses exception:', e.message);
  }
  
  console.log('');
  console.log('🔧 If activities table has errors, you need to create it manually in Supabase SQL editor:');
  console.log('🔗 https://supabase.com/dashboard/project/wfhjcblhlsdtxpwuxvgm/sql/new');
}

testConnections();
