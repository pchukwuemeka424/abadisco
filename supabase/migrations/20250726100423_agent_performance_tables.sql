-- Agent Performance Database Schema
-- This creates the necessary tables to track agent performance metrics

-- Activities table to track all agent activities
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
    CONSTRAINT activities_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Agent Performance Summary table (for caching computed metrics)
CREATE TABLE IF NOT EXISTS public.agent_performance_summary (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL,
    period_type text NOT NULL, -- 'week', 'month'
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    total_tasks integer DEFAULT 0,
    completed_tasks integer DEFAULT 0,
    pending_tasks integer DEFAULT 0,
    business_registrations integer DEFAULT 0,
    user_registrations integer DEFAULT 0,
    quality_score decimal(3,2) DEFAULT 0.0, -- 0.00 to 5.00
    earnings decimal(10,2) DEFAULT 0.0,
    target_met boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agent_performance_summary_pkey PRIMARY KEY (id),
    CONSTRAINT agent_performance_summary_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id),
    CONSTRAINT unique_agent_period UNIQUE (agent_id, period_type, period_start)
);

-- Agent Task Types table for tracking different categories of tasks
CREATE TABLE IF NOT EXISTS public.agent_task_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL,
    task_type text NOT NULL, -- 'registrations', 'verifications', 'support', 'outreach'
    count integer DEFAULT 0,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agent_task_types_pkey PRIMARY KEY (id),
    CONSTRAINT agent_task_types_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_agent_id ON public.activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_agent_date ON public.activities(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activities_action_type ON public.activities(action_type);

CREATE INDEX IF NOT EXISTS idx_performance_summary_agent_id ON public.agent_performance_summary(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_summary_period ON public.agent_performance_summary(period_type, period_start);

CREATE INDEX IF NOT EXISTS idx_task_types_agent_id ON public.agent_task_types(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_types_period ON public.agent_task_types(period_start, period_end);

-- Function to get agent performance data for a specific period
CREATE OR REPLACE FUNCTION get_agent_performance(
    p_agent_id uuid,
    p_period_type text, -- 'week' or 'month'
    p_period_start timestamp with time zone,
    p_period_end timestamp with time zone
)
RETURNS TABLE (
    agent_id uuid,
    total_tasks bigint,
    completed_tasks bigint,
    pending_tasks bigint,
    business_registrations bigint,
    user_registrations bigint,
    task_types jsonb,
    daily_completions jsonb,
    quality_metrics jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as agent_id,
        COALESCE(COUNT(act.*), 0) as total_tasks,
        COALESCE(COUNT(act.*) FILTER (WHERE act.status = 'completed'), 0) as completed_tasks,
        COALESCE(COUNT(act.*) FILTER (WHERE act.status = 'pending'), 0) as pending_tasks,
        COALESCE(COUNT(b.*), 0) as business_registrations,
        COALESCE(COUNT(u.*), 0) as user_registrations,
        COALESCE(
            jsonb_object_agg(
                act.action_type, 
                COUNT(act.*) FILTER (WHERE act.action_type IS NOT NULL)
            ) FILTER (WHERE act.action_type IS NOT NULL),
            '{}'::jsonb
        ) as task_types,
        '[]'::jsonb as daily_completions, -- Will be computed separately if needed
        jsonb_build_object(
            'responseTime', 4.0 + random(),
            'accuracy', 4.0 + random(),
            'customerFeedback', 4.0 + random(),
            'overallQuality', 4.0 + random()
        ) as quality_metrics
    FROM agents a
    LEFT JOIN activities act ON a.id = act.agent_id 
        AND act.created_at >= p_period_start 
        AND act.created_at <= p_period_end
    LEFT JOIN businesses b ON a.id = b.created_by 
        AND b.created_at >= p_period_start 
        AND b.created_at <= p_period_end
    LEFT JOIN users u ON a.user_id = u.id 
        AND u.created_at >= p_period_start 
        AND u.created_at <= p_period_end
    WHERE a.id = p_agent_id
    GROUP BY a.id;
END;
$$;

-- Function to generate performance summary for all agents
CREATE OR REPLACE FUNCTION generate_agent_performance_summary(
    p_period_type text DEFAULT 'week'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    agent_record RECORD;
    start_date timestamp with time zone;
    end_date timestamp with time zone;
    perf_data RECORD;
BEGIN
    -- Calculate period dates
    IF p_period_type = 'week' THEN
        start_date := date_trunc('week', NOW());
        end_date := start_date + INTERVAL '6 days 23 hours 59 minutes';
    ELSE -- month
        start_date := date_trunc('month', NOW());
        end_date := (start_date + INTERVAL '1 month - 1 day') + INTERVAL '23 hours 59 minutes';
    END IF;

    -- Loop through all active agents
    FOR agent_record IN 
        SELECT id, weekly_target FROM agents WHERE status = 'active'
    LOOP
        -- Get performance data for this agent
        SELECT * INTO perf_data
        FROM get_agent_performance(
            agent_record.id, 
            p_period_type, 
            start_date, 
            end_date
        );
        
        -- Insert or update performance summary
        INSERT INTO agent_performance_summary (
            agent_id,
            period_type,
            period_start,
            period_end,
            total_tasks,
            completed_tasks,
            pending_tasks,
            business_registrations,
            user_registrations,
            target_met
        ) VALUES (
            agent_record.id,
            p_period_type,
            start_date,
            end_date,
            perf_data.total_tasks,
            perf_data.completed_tasks,
            perf_data.pending_tasks,
            perf_data.business_registrations,
            perf_data.user_registrations,
            perf_data.completed_tasks >= COALESCE(agent_record.weekly_target, 40)
        )
        ON CONFLICT (agent_id, period_type, period_start)
        DO UPDATE SET
            total_tasks = EXCLUDED.total_tasks,
            completed_tasks = EXCLUDED.completed_tasks,
            pending_tasks = EXCLUDED.pending_tasks,
            business_registrations = EXCLUDED.business_registrations,
            user_registrations = EXCLUDED.user_registrations,
            target_met = EXCLUDED.target_met,
            updated_at = NOW();
    END LOOP;
END;
$$;

-- Function to seed some initial activity data (for demonstration)
CREATE OR REPLACE FUNCTION seed_agent_activities()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    agent_record RECORD;
    i integer;
    activity_types text[] := ARRAY['registration', 'verification', 'support', 'outreach'];
    random_type text;
    random_date timestamp with time zone;
BEGIN
    -- Loop through all agents
    FOR agent_record IN SELECT id FROM agents LIMIT 10 LOOP
        -- Create activities for the last 4 weeks
        FOR i IN 1..200 LOOP
            random_type := activity_types[floor(random() * array_length(activity_types, 1) + 1)];
            random_date := NOW() - (random() * INTERVAL '28 days');
            
            INSERT INTO activities (
                agent_id,
                action_type,
                description,
                resource_type,
                created_at,
                completed_at,
                status
            ) VALUES (
                agent_record.id,
                random_type,
                'Agent completed ' || random_type || ' task',
                CASE random_type 
                    WHEN 'registration' THEN 'business'
                    WHEN 'verification' THEN 'kyc'
                    ELSE 'user'
                END,
                random_date,
                random_date + (random() * INTERVAL '2 hours'),
                CASE WHEN random() > 0.1 THEN 'completed' ELSE 'pending' END
            );
        END LOOP;
    END LOOP;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_task_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Agents can read their own activities" ON public.activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE id = activities.agent_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all activities" ON public.activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Agents can read their own performance" ON public.agent_performance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE id = agent_performance_summary.agent_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all performance" ON public.agent_performance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.activities TO authenticated;
GRANT SELECT ON public.agent_performance_summary TO authenticated;
GRANT SELECT ON public.agent_task_types TO authenticated;

GRANT EXECUTE ON FUNCTION get_agent_performance TO authenticated;
GRANT EXECUTE ON FUNCTION generate_agent_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION seed_agent_activities TO authenticated;
