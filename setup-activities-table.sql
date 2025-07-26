-- Setup activities table for agent performance tracking
-- This script creates the activities table and related performance tracking tables

-- First, check if activities table exists and create it
CREATE TABLE IF NOT EXISTS public.activities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL,
    action_type text NOT NULL, -- 'registration', 'verification', 'support', 'outreach'
    description text NOT NULL,
    resource_type text NULL, -- 'business', 'user', 'kyc'
    resource_id uuid NULL,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone NULL,
    status text DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    metadata jsonb NULL, -- Additional data like quality metrics
    CONSTRAINT activities_pkey PRIMARY KEY (id),
    CONSTRAINT activities_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_agent_id ON public.activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_agent_date ON public.activities(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activities_action_type ON public.activities(action_type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- Enable RLS on activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities table
DROP POLICY IF EXISTS "Agents can read their own activities" ON public.activities;
CREATE POLICY "Agents can read their own activities" ON public.activities
    FOR SELECT
    USING (auth.uid()::text IN (
        SELECT user_id::text FROM agents WHERE id = activities.agent_id
    ));

DROP POLICY IF EXISTS "Admins can read all activities" ON public.activities;
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

-- Agents can insert their own activities
DROP POLICY IF EXISTS "Agents can insert their own activities" ON public.activities;
CREATE POLICY "Agents can insert their own activities" ON public.activities
    FOR INSERT
    WITH CHECK (auth.uid()::text IN (
        SELECT user_id::text FROM agents WHERE id = activities.agent_id
    ));

-- Insert some sample data for testing
INSERT INTO public.activities (agent_id, action_type, description, resource_type, status, created_at, completed_at)
SELECT 
    a.id,
    (ARRAY['registration', 'verification', 'support', 'outreach'])[floor(random() * 4 + 1)],
    'Sample activity - ' || (ARRAY['Business registration', 'KYC verification', 'Customer support', 'Market outreach'])[floor(random() * 4 + 1)],
    (ARRAY['business', 'user', 'kyc'])[floor(random() * 3 + 1)],
    (ARRAY['completed', 'pending', 'failed'])[floor(random() * 3 + 1)],
    NOW() - (random() * INTERVAL '7 days'),
    CASE 
        WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '7 days')
        ELSE NULL 
    END
FROM agents a
WHERE NOT EXISTS (
    SELECT 1 FROM activities WHERE agent_id = a.id
)
LIMIT 50
ON CONFLICT DO NOTHING;

-- Show the results
SELECT 
    'Activities table setup completed' as message,
    COUNT(*) as total_activities,
    COUNT(DISTINCT agent_id) as agents_with_activities
FROM activities;
