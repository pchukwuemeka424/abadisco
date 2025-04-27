-- Settings Database Schema

-- Create settings table to store platform configuration
CREATE TABLE platform_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES auth.users(id)
);

-- Create notification_preferences table to store user role-based notification settings
CREATE TABLE notification_preferences (
    role INT PRIMARY KEY,
    system_updates BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    new_features BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial settings data
INSERT INTO platform_settings (key, value, description) VALUES
('platform_name', 'Aba Markets', 'Name of the platform'),
('platform_description', 'Your gateway to Aba''s vibrant markets and businesses.', 'Short description of the platform'),
('contact_email', 'contact@abamarkets.com', 'Primary contact email for the platform'),
('allow_registration', 'true', 'Whether new user registrations are allowed'),
('require_email_verification', 'true', 'Whether email verification is required for new accounts'),
('require_admin_approval', 'false', 'Whether admin approval is required for new accounts'),
('default_user_role', '1', 'Default role assigned to new users (1=Regular User)'),
('data_retention', 'never', 'Policy for deleting inactive user accounts');

-- Insert default notification preferences for each role
INSERT INTO notification_preferences (role, system_updates, marketing, security_alerts, new_features) VALUES
(0, true, true, true, true),    -- Administrators
(1, true, false, true, true),   -- Regular Users
(2, true, true, true, true);    -- Business Owners

-- Queries for the settings management functionality

-- Fetch all settings
-- Used when loading the settings page
SELECT * FROM platform_settings;

-- Update a specific setting
-- For direct SQL execution, use concrete values
-- Note: Don't execute this directly - this is a template
/*
UPDATE platform_settings 
SET value = 'New Value', 
    updated_at = CURRENT_TIMESTAMP, 
    updated_by = '00000000-0000-0000-0000-000000000000' 
WHERE key = 'platform_name';
*/

-- Bulk update example
-- Note: Don't execute this directly - this is a template
/*
INSERT INTO platform_settings (key, value, description, updated_at, updated_by)
VALUES 
    ('platform_name', 'New Aba Markets', 'Name of the platform', CURRENT_TIMESTAMP, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = EXCLUDED.updated_by;
*/

-- Fetch notification preferences for all roles
SELECT * FROM notification_preferences;

-- Update notification preferences example
-- Note: Don't execute this directly - this is a template
/*
UPDATE notification_preferences
SET 
    system_updates = true,
    marketing = false,
    security_alerts = true,
    new_features = true,
    updated_at = CURRENT_TIMESTAMP
WHERE role = 1;
*/

-- Data Retention Query - IMPROVED VERSION
-- This query would be run by a scheduled function to delete inactive users
-- based on the data retention setting
-- Note: Make sure column names match your actual users table
-- For Supabase Auth, use the auth.users table instead of a custom users table

-- Note: Don't execute this directly - this is a template
/*
WITH retention_setting AS (
    SELECT value FROM platform_settings WHERE key = 'data_retention'
),
retention_months AS (
    SELECT
        CASE
            WHEN (SELECT value FROM retention_setting) = '6' THEN 6
            WHEN (SELECT value FROM retention_setting) = '12' THEN 12
            WHEN (SELECT value FROM retention_setting) = '24' THEN 24
            ELSE NULL -- 'never' or any other value won't delete users
        END as months
)
DELETE FROM users
WHERE
    -- Make sure this column exists and is a timestamp type
    -- Replace last_active_at with the actual column name from your users table
    last_active_at < NOW() - (INTERVAL '1 MONTH' * (SELECT months FROM retention_months))
    AND (SELECT value FROM retention_setting) != 'never'
    AND (SELECT months FROM retention_months) IS NOT NULL;
*/

-- Helper Functions

-- Function to get a setting value
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT value FROM platform_settings WHERE key = setting_key);
END;
$$ LANGUAGE plpgsql;

-- Function to check if a feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(feature_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT value::boolean FROM platform_settings WHERE key = feature_key);
END;
$$ LANGUAGE plpgsql;