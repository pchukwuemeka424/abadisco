#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env.local for development
config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Node.js Version:', process.version);
console.log('🔧 Environment Setup Check...');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    console.log('\n💡 Make sure you have these variables in your .env.local file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupActivitiesTable() {
    try {
        console.log('🔧 Setting up activities table...');

        // Read the SQL file
        const sqlContent = fs.readFileSync('./setup-activities-table.sql', 'utf8');
        
        // Split into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
            if (statement.includes('SELECT')) {
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: statement + ';' 
                });
                if (error) {
                    console.log('Executing query with direct RPC...');
                    // Try direct query
                    const { data: directData, error: directError } = await supabase
                        .from('activities')
                        .select('*', { count: 'exact' })
                        .limit(1);
                    
                    if (directError) {
                        console.error('Query error:', directError);
                    } else {
                        console.log('✅ Activities table is accessible');
                    }
                } else {
                    console.log('Query result:', data);
                }
            } else {
                const { error } = await supabase.rpc('exec_sql', { 
                    sql_query: statement + ';' 
                });
                if (error) {
                    console.log(`Statement: ${statement.substring(0, 50)}...`);
                    console.log('Error:', error.message);
                }
            }
        }

        console.log('✅ Activities table setup completed');

    } catch (error) {
        console.error('❌ Error setting up activities table:', error);
    }
}

async function testPerformanceQueries() {
    try {
        console.log('\n🧪 Testing performance queries...');

        // Test agents query
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .limit(5);

        if (agentsError) {
            console.error('❌ Agents query error:', agentsError);
            return;
        }

        console.log(`✅ Found ${agents?.length || 0} agents`);

        if (agents && agents.length > 0) {
            console.log('Sample agent:', {
                id: agents[0].id,
                name: agents[0].full_name,
                email: agents[0].email,
                status: agents[0].status
            });

            // Test activities query for this agent
            const agentIds = agents.map(a => a.id);
            const { data: activities, error: activitiesError } = await supabase
                .from('activities')
                .select('*')
                .in('agent_id', agentIds)
                .limit(10);

            if (activitiesError) {
                console.error('❌ Activities query error:', activitiesError);
                
                // Try to create the table manually
                console.log('🔧 Creating activities table...');
                const { error: createError } = await supabase.rpc('exec_sql', {
                    sql_query: `
                        CREATE TABLE IF NOT EXISTS public.activities (
                            id uuid NOT NULL DEFAULT gen_random_uuid(),
                            agent_id uuid NOT NULL,
                            action_type text NOT NULL,
                            description text NOT NULL,
                            resource_type text NULL,
                            resource_id uuid NULL,
                            created_at timestamp with time zone DEFAULT now(),
                            completed_at timestamp with time zone NULL,
                            status text DEFAULT 'completed',
                            metadata jsonb NULL,
                            CONSTRAINT activities_pkey PRIMARY KEY (id)
                        );
                    `
                });

                if (createError) {
                    console.error('❌ Failed to create activities table:', createError);
                } else {
                    console.log('✅ Activities table created successfully');
                }
            } else {
                console.log(`✅ Found ${activities?.length || 0} activities`);
                if (activities && activities.length > 0) {
                    console.log('Sample activity:', {
                        id: activities[0].id,
                        agent_id: activities[0].agent_id,
                        action_type: activities[0].action_type,
                        status: activities[0].status
                    });
                }
            }

            // Test businesses query
            const { data: businesses, error: businessesError } = await supabase
                .from('businesses')
                .select('*')
                .in('created_by', agentIds)
                .limit(5);

            if (businessesError) {
                console.log('⚠️ Businesses query warning:', businessesError.message);
            } else {
                console.log(`✅ Found ${businesses?.length || 0} businesses created by agents`);
            }
        }

    } catch (error) {
        console.error('❌ Error testing queries:', error);
    }
}

async function createSampleData() {
    try {
        console.log('\n📝 Creating sample performance data...');

        // Get existing agents
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .limit(3);

        if (agentsError || !agents || agents.length === 0) {
            console.log('⚠️ No agents found, creating sample agents...');
            
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

            const { error: insertAgentsError } = await supabase
                .from('agents')
                .upsert(sampleAgents, { onConflict: 'id' });

            if (insertAgentsError) {
                console.error('❌ Error inserting sample agents:', insertAgentsError);
                return;
            }

            console.log('✅ Sample agents created');
        }

        // Create sample activities
        const sampleActivities = [
            {
                agent_id: agents?.[0]?.id || '550e8400-e29b-41d4-a716-446655440001',
                action_type: 'registration',
                description: 'Registered new business - Ace Electronics',
                resource_type: 'business',
                status: 'completed',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                agent_id: agents?.[0]?.id || '550e8400-e29b-41d4-a716-446655440001',
                action_type: 'verification',
                description: 'Completed KYC verification for business owner',
                resource_type: 'kyc',
                status: 'completed',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        const { error: activitiesInsertError } = await supabase
            .from('activities')
            .upsert(sampleActivities, { onConflict: 'id' });

        if (activitiesInsertError) {
            console.error('❌ Error inserting sample activities:', activitiesInsertError);
        } else {
            console.log('✅ Sample activities created');
        }

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    }
}

async function main() {
    console.log('🚀 Setting up Agent Performance Dashboard...\n');
    
    await setupActivitiesTable();
    await testPerformanceQueries();
    await createSampleData();
    
    console.log('\n🎉 Setup completed! You can now use the performance dashboard.');
    console.log('💡 If you still see errors, try refreshing the page.');
}

main().catch(console.error);
