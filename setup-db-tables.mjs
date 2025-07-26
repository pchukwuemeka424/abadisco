#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  try {
    console.log('🚀 Setting up database tables...');

    // First, check if agents table exists
    console.log('📋 Checking agents table...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .limit(1);

    if (agentsError) {
      console.error('❌ Agents table error:', agentsError.message);
      return;
    }

    console.log('✅ Agents table exists');

    // Check if activities table exists
    console.log('📋 Checking activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1);

    if (activitiesError) {
      console.log('⚠️  Activities table does not exist or has issues:', activitiesError.message);
      console.log('📝 The activities table needs to be created via SQL editor in Supabase dashboard');
      console.log('📋 Please copy and paste the following SQL into your Supabase SQL editor:');
      console.log('');
      console.log('--- COPY THE SQL BELOW ---');
      
      // Read and display the SQL file content
      const sqlContent = readFileSync('./setup-activities-table.sql', 'utf8');
      console.log(sqlContent);
      
      console.log('--- END OF SQL ---');
      console.log('');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/wfhjcblhlsdtxpwuxvgm/sql/new');
      
      return;
    }

    console.log('✅ Activities table exists');

    // Test inserting sample data
    console.log('🧪 Testing sample data insertion...');
    
    // Check if we have any agents to work with
    const { data: allAgents, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching agents:', fetchError);
      return;
    }

    if (!allAgents || allAgents.length === 0) {
      console.log('⚠️  No agents found. Creating sample agents...');
      
      // Create sample agents
      const sampleAgents = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'john.doe@abadisco.com',
          full_name: 'John Doe',
          phone: '+2348123456789',
          role: 'agent',
          status: 'active',
          weekly_target: 40,
          current_week_registrations: 35,
          total_registrations: 156,
          total_businesses: 42
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'jane.smith@abadisco.com',
          full_name: 'Jane Smith',
          phone: '+2348123456790',
          role: 'senior_agent',
          status: 'active',
          weekly_target: 50,
          current_week_registrations: 28,
          total_registrations: 203,
          total_businesses: 67
        }
      ];

      const { error: agentInsertError } = await supabase
        .from('agents')
        .upsert(sampleAgents);

      if (agentInsertError) {
        console.error('❌ Error creating sample agents:', agentInsertError);
        return;
      }

      console.log('✅ Sample agents created');
    } else {
      console.log(`✅ Found ${allAgents.length} existing agents`);
    }

    // Create sample activities
    console.log('📝 Creating sample activities...');
    
    const sampleActivities = [
      {
        agent_id: allAgents[0]?.id || '550e8400-e29b-41d4-a716-446655440001',
        action_type: 'registration',
        description: 'Registered new business - Ace Electronics',
        resource_type: 'business',
        status: 'completed',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        agent_id: allAgents[0]?.id || '550e8400-e29b-41d4-a716-446655440001',
        action_type: 'verification',
        description: 'Completed KYC verification for business owner',
        resource_type: 'kyc',
        status: 'completed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        agent_id: allAgents[1]?.id || '550e8400-e29b-41d4-a716-446655440002',
        action_type: 'support',
        description: 'Provided customer support for market listing',
        resource_type: 'user',
        status: 'completed',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        agent_id: allAgents[1]?.id || '550e8400-e29b-41d4-a716-446655440002',
        action_type: 'outreach',
        description: 'Conducted business outreach in Ariaria Market',
        resource_type: 'business',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error: activityInsertError } = await supabase
      .from('activities')
      .upsert(sampleActivities);

    if (activityInsertError) {
      console.error('❌ Error creating sample activities:', activityInsertError);
      return;
    }

    console.log('✅ Sample activities created');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('📊 You can now use the agent performance dashboard');

  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

setupTables();
