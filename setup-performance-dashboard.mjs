#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPerformanceDashboard() {
  console.log('🚀 Setting up Agent Performance Dashboard...\n');

  try {
    // 1. Create performance tables
    console.log('📋 Creating performance tables...');
    const performanceTablesSQL = fs.readFileSync(
      path.join(process.cwd(), 'agent_performance_tables.sql'), 
      'utf8'
    );

    // Execute the SQL (note: this requires database admin privileges)
    console.log('⚠️  Note: The SQL tables need to be created with database admin privileges');
    console.log('   Please run the agent_performance_tables.sql file in your Supabase SQL editor\n');

    // 2. Check if agents table exists and has data
    console.log('👥 Checking agents table...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, full_name, email, status')
      .limit(5);

    if (agentsError) {
      console.error('❌ Error checking agents table:', agentsError.message);
      console.log('   Make sure the agents table exists and is properly configured\n');
    } else if (!agents || agents.length === 0) {
      console.log('📝 No agents found. Creating test agents...');
      await createTestAgents();
    } else {
      console.log(`✅ Found ${agents.length} agents in database`);
      agents.forEach(agent => {
        console.log(`   - ${agent.full_name} (${agent.email}) - ${agent.status}`);
      });
      console.log('');
    }

    // 3. Check activities table
    console.log('📊 Checking activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1);

    if (activitiesError) {
      console.error('❌ Activities table not found:', activitiesError.message);
      console.log('   Please create the activities table using agent_performance_tables.sql\n');
    } else {
      console.log('✅ Activities table exists\n');
    }

    // 4. Create some test data if tables exist
    if (!agentsError && !activitiesError) {
      await seedTestData();
    }

    console.log('🎉 Performance Dashboard setup complete!');
    console.log('\n📍 Next steps:');
    console.log('   1. Run the agent_performance_tables.sql in Supabase SQL editor');
    console.log('   2. Visit /admin/agents/performance to view the dashboard');
    console.log('   3. Use the "Seed Test Data" button to create sample data');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function createTestAgents() {
  const testAgents = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'john.doe@abadisco.com',
      full_name: 'John Doe',
      phone: '+2348123456789',
      role: 'agent',
      status: 'active',
      weekly_target: 40,
      weekly_target_met: true,
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
      weekly_target_met: false,
      current_week_registrations: 28,
      total_registrations: 203,
      total_businesses: 67
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'mike.johnson@abadisco.com',
      full_name: 'Mike Johnson',
      phone: '+2348123456791',
      role: 'agent',
      status: 'active',
      weekly_target: 35,
      weekly_target_met: true,
      current_week_registrations: 40,
      total_registrations: 89,
      total_businesses: 25
    }
  ];

  const { error } = await supabase
    .from('agents')
    .upsert(testAgents, { onConflict: 'id' });

  if (error) {
    console.error('❌ Failed to create test agents:', error.message);
  } else {
    console.log('✅ Created test agents successfully');
  }
}

async function seedTestData() {
  console.log('🌱 Seeding test performance data...');

  // Get existing agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id')
    .eq('status', 'active')
    .limit(10);

  if (agentsError || !agents || agents.length === 0) {
    console.log('⚠️  No active agents found for seeding data');
    return;
  }

  const activities = [];
  const actionTypes = ['registration', 'verification', 'support', 'outreach'];
  const resourceTypes = ['business', 'user', 'kyc'];

  // Create activities for each agent
  for (const agent of agents) {
    // Create 20-50 activities per agent over the last 30 days
    const activityCount = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 0; i < activityCount; i++) {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const completedAt = Math.random() > 0.1 ? 
        new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;
      
      activities.push({
        agent_id: agent.id,
        action_type: actionType,
        description: `Completed ${actionType} task for ${resourceType}`,
        resource_type: resourceType,
        created_at: createdAt.toISOString(),
        completed_at: completedAt?.toISOString(),
        status: completedAt ? 'completed' : 'pending'
      });
    }
  }

  // Insert activities in batches
  const batchSize = 100;
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize);
    const { error } = await supabase
      .from('activities')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Failed to insert activity batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`✅ Inserted activity batch ${i / batchSize + 1}/${Math.ceil(activities.length / batchSize)}`);
    }
  }

  console.log(`🎯 Created ${activities.length} test activities for ${agents.length} agents\n`);
}

// Run the setup
setupPerformanceDashboard();
