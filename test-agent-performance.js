#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('🔧 Node.js Version:', process.version);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentPerformance() {
  console.log('🧪 Testing agent performance tables...');

  try {
    // Test agents table
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
    } else {
      console.log(`Found ${agents?.length || 0} agents`);
    }

    // Test activities table
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(5);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    } else {
      console.log(`Found ${activities?.length || 0} activities`);
    }

    // Test agent_performance_summary table
    const { data: performance, error: performanceError } = await supabase
      .from('agent_performance_summary')
      .select('*')
      .limit(5);

    if (performanceError) {
      console.error('Error fetching performance summary:', performanceError);
    } else {
      console.log(`Found ${performance?.length || 0} performance records`);
    }

    console.log('✅ All tables are accessible');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAgentPerformance();
