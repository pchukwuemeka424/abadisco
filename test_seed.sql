-- Test seeding and querying the agent performance data
-- First, let's check if we have any agents in the system
SELECT count(*) as agent_count FROM agents;

-- If we have agents, let's seed some activity data
SELECT seed_agent_activities();

-- Check the seeded activities
SELECT 
    a.full_name,
    count(*) as activity_count,
    act.action_type
FROM agents a
JOIN activities act ON a.id = act.agent_id
GROUP BY a.id, a.full_name, act.action_type
ORDER BY a.full_name, act.action_type;
