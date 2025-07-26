#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking activities table schema...');
    
    // Try to get the schema by doing a select with limit 0
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Error accessing activities table:', error);
      console.log('');
      console.log('📝 The activities table needs to be created. Please run this SQL in your Supabase dashboard:');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/wfhjcblhlsdtxpwuxvgm/sql/new');
      console.log('');
      console.log('--- COPY THE SQL BELOW ---');
      
      const sqlCommands = `
-- Drop existing activities table if it exists with wrong schema
DROP TABLE IF EXISTS public.activities CASCADE;

-- Create activities table with correct schema
CREATE TABLE public.activities (
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
    CONSTRAINT activities_pkey PRIMARY KEY (id),
    CONSTRAINT activities_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_activities_agent_id ON public.activities(agent_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at);
CREATE INDEX idx_activities_agent_date ON public.activities(agent_id, created_at);
CREATE INDEX idx_activities_action_type ON public.activities(action_type);
CREATE INDEX idx_activities_status ON public.activities(status);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Agents can read their own activities" ON public.activities
    FOR SELECT
    USING (auth.uid()::text IN (
        SELECT user_id::text FROM agents WHERE id = activities.agent_id
    ));

CREATE POLICY "Admins can read all activities" ON public.activities
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Agents can insert their own activities" ON public.activities
    FOR INSERT
    WITH CHECK (auth.uid()::text IN (
        SELECT user_id::text FROM agents WHERE id = activities.agent_id
    ));
`;
      
      console.log(sqlCommands);
      console.log('--- END OF SQL ---');
      return;
    }

    console.log('✅ Activities table is accessible');
    
    // Try to insert a test record to check the schema
    const testActivity = {
      agent_id: '550e8400-e29b-41d4-a716-446655440001',
      action_type: 'test',
      description: 'Test activity',
      resource_type: 'test',
      status: 'completed'
    };

    const { error: insertError } = await supabase
      .from('activities')
      .insert(testActivity);

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError);
      console.log('This indicates a schema mismatch. Please run the SQL above to fix the table structure.');
    } else {
      console.log('✅ Test insert successful - schema is correct');
      
      // Clean up test data
      await supabase
        .from('activities')
        .delete()
        .eq('action_type', 'test');
    }

  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

checkSchema();
