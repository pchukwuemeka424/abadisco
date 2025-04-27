-- Create agents table
CREATE TABLE public.agents (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'agent',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended'
  avatar_url text,
  weekly_target integer NOT NULL DEFAULT 40,
  weekly_target_met boolean NOT NULL DEFAULT false,
  current_week_registrations integer NOT NULL DEFAULT 0,
  total_registrations integer NOT NULL DEFAULT 0,
  total_businesses integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create RLS policies for the agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Allow agents to read their own information
CREATE POLICY "Agents can read their own information" ON public.agents
  FOR SELECT
  USING (auth.uid() = id);

-- Allow agents to update their own information except status/role fields
CREATE POLICY "Agents can update their own information" ON public.agents
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = 'agent' AND 
    status IN ('active', 'pending', 'suspended')
  );

-- Allow admins to read all agents
CREATE POLICY "Admins can read all agents" ON public.agents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to update all agents
CREATE POLICY "Admins can update all agents" ON public.agents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to insert new agents
CREATE POLICY "Admins can insert new agents" ON public.agents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    ) OR
    auth.uid() = id -- Allow self-registration
  );

-- Function to update agent statistics
CREATE OR REPLACE FUNCTION update_agent_statistics()
RETURNS TRIGGER AS $$
DECLARE
  start_of_week TIMESTAMP;
  end_of_week TIMESTAMP;
  agent_id UUID;
  registrations_count INTEGER;
  businesses_count INTEGER;
BEGIN
  -- Extract agent_user_id from the inserted/updated record
  agent_id := NEW.agent_user_id;
  
  -- Skip if not linked to an agent
  IF agent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate current week boundaries (Monday to Sunday)
  start_of_week := date_trunc('week', NOW());
  end_of_week := start_of_week + INTERVAL '6 days 23 hours 59 minutes 59 seconds';
  
  -- Count registrations for current week
  SELECT COUNT(*) INTO registrations_count
  FROM public.users
  WHERE agent_user_id = agent_id
    AND created_at >= start_of_week
    AND created_at <= end_of_week;
  
  -- Count total business listings
  SELECT COUNT(*) INTO businesses_count
  FROM public.users
  WHERE agent_user_id = agent_id
    AND business_name IS NOT NULL;
    
  -- Update agent statistics
  UPDATE public.agents
  SET 
    current_week_registrations = registrations_count,
    weekly_target_met = (registrations_count >= weekly_target),
    total_registrations = (
      SELECT COUNT(*) FROM public.users WHERE agent_user_id = agent_id
    ),
    total_businesses = businesses_count,
    updated_at = NOW()
  WHERE id = agent_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update agent statistics when a new user is registered
CREATE TRIGGER update_agent_stats_on_user_change
AFTER INSERT OR UPDATE OF agent_user_id ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_agent_statistics();

-- Create function to reset weekly targets on Monday
CREATE OR REPLACE FUNCTION reset_weekly_targets()
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents
  SET current_week_registrations = 0,
      weekly_target_met = false,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create index for performance
CREATE INDEX idx_users_agent_user_id ON public.users(agent_user_id);
CREATE INDEX idx_users_agent_created_at ON public.users(agent_user_id, created_at);

COMMENT ON TABLE public.agents IS 'Store agent information for those registering users and businesses';