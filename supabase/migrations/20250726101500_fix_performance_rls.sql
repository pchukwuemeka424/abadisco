-- Fix RLS policies for admin access to performance data
-- This allows admins to read all performance-related data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can read their own activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can read all activities" ON public.activities;
DROP POLICY IF EXISTS "Agents can read their own performance" ON public.agent_performance_summary;
DROP POLICY IF EXISTS "Admins can read all performance" ON public.agent_performance_summary;

-- Create new, more permissive policies
CREATE POLICY "Authenticated users can read activities" ON public.activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read performance summary" ON public.agent_performance_summary
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert activities (for seeding and normal operations)
CREATE POLICY "Authenticated users can insert activities" ON public.activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert performance summaries
CREATE POLICY "Authenticated users can insert performance summary" ON public.agent_performance_summary
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Also allow read access to agent_task_types
CREATE POLICY "Authenticated users can read task types" ON public.agent_task_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert task types" ON public.agent_task_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
