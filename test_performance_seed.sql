-- Test seed data for agent performance
-- First, let's create some test agents and users

-- Insert a test user (this would normally be done through Supabase Auth)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'agent1@test.com', NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'agent2@test.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test agents
INSERT INTO public.agents (id, user_id, email, full_name, role, status, weekly_target)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'agent1@test.com', 'John Doe', 'agent', 'active', 40),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'agent2@test.com', 'Jane Smith', 'agent', 'active', 45)
ON CONFLICT (id) DO NOTHING;

-- Insert test activities for the agents
INSERT INTO public.activities (agent_id, action_type, description, resource_type, created_at, completed_at, status)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'registration', 'Registered new business', 'business', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440001', 'verification', 'Completed KYC verification', 'kyc', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440001', 'support', 'Provided customer support', 'user', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440002', 'registration', 'Registered new business', 'business', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440002', 'outreach', 'Conducted business outreach', 'business', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440002', 'support', 'Provided customer support', 'user', NOW() - INTERVAL '2 hours', NULL, 'pending');

-- Test the get_agent_performance function
SELECT * FROM get_agent_performance(
  '550e8400-e29b-41d4-a716-446655440001',
  'week',
  DATE_TRUNC('week', NOW()),
  DATE_TRUNC('week', NOW()) + INTERVAL '6 days 23 hours 59 minutes'
);
