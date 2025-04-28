-- Activities Table for tracking admin and user actions
-- Create the activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action_type VARCHAR(50) NOT NULL,  -- login, logout, create, update, delete, settings, kyc, etc.
    user_type VARCHAR(20) NOT NULL,    -- admin, agent, user
    description TEXT NOT NULL,         -- detailed description of the action
    metadata JSONB DEFAULT NULL,       -- additional information in JSON format
    severity VARCHAR(20) DEFAULT 'info', -- high, medium, low, info
    ip_address VARCHAR(50),            -- user's IP address
    resource_id UUID DEFAULT NULL,     -- optional reference to affected resource
    resource_type VARCHAR(50) DEFAULT NULL -- type of resource (product, user, etc.)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS activities_action_type_idx ON public.activities(action_type);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS activities_user_type_idx ON public.activities(user_type);
CREATE INDEX IF NOT EXISTS activities_resource_id_idx ON public.activities(resource_id);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policy for admins (full access)
CREATE POLICY admin_all_access ON public.activities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Create policy for users to view their own activities
CREATE POLICY user_read_own ON public.activities
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create policy for agents to view their own activities
CREATE POLICY agent_read_own ON public.activities
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'agent'
        )
    );

-- Create a trigger function to log activities on various tables
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    action_description TEXT;
    resource_type TEXT;
BEGIN
    -- Get current user ID and role from auth.uid() or session variables
    current_user_id := auth.uid();
    
    -- Get user role from users table
    SELECT role INTO current_user_role FROM public.users WHERE id = current_user_id;
    
    -- Determine which table was affected
    CASE TG_TABLE_NAME
        WHEN 'products' THEN
            resource_type := 'product';
            
            -- Create appropriate description based on operation
            IF (TG_OP = 'INSERT') THEN
                action_description := 'Product created: ' || NEW.title;
            ELSIF (TG_OP = 'UPDATE') THEN
                action_description := 'Product updated: ' || NEW.title;
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'Product deleted: ' || OLD.title;
            END IF;
            
        WHEN 'users' THEN
            resource_type := 'user';
            
            -- Create appropriate description based on operation
            IF (TG_OP = 'INSERT') THEN
                action_description := 'User created: ' || NEW.email;
            ELSIF (TG_OP = 'UPDATE') THEN
                action_description := 'User updated: ' || NEW.email;
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'User deleted: ' || OLD.email;
            END IF;
            
        WHEN 'kyc_verifications' THEN
            resource_type := 'kyc';
            
            -- Create appropriate description based on operation
            IF (TG_OP = 'INSERT') THEN
                action_description := 'KYC verification submitted';
            ELSIF (TG_OP = 'UPDATE') THEN
                IF NEW.status != OLD.status THEN
                    action_description := 'KYC status changed from ' || OLD.status || ' to ' || NEW.status;
                ELSE
                    action_description := 'KYC verification updated';
                END IF;
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'KYC verification deleted';
            END IF;
            
        ELSE
            resource_type := TG_TABLE_NAME;
            action_description := TG_OP || ' operation on ' || TG_TABLE_NAME;
    END CASE;
    
    -- Insert the activity log
    INSERT INTO public.activities (
        user_id,
        action_type,
        user_type,
        description,
        metadata,
        resource_id,
        resource_type,
        severity
    ) VALUES (
        current_user_id,
        LOWER(TG_OP),  -- INSERT, UPDATE, DELETE -> insert, update, delete
        current_user_role,
        action_description,
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old_data', row_to_json(OLD)::jsonb)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_data', row_to_json(OLD)::jsonb, 'new_data', row_to_json(NEW)::jsonb)
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new_data', row_to_json(NEW)::jsonb)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        resource_type,
        CASE
            WHEN TG_OP = 'DELETE' THEN 'high'
            WHEN TG_OP = 'INSERT' THEN 'medium'
            ELSE 'low'
        END
    );
    
    -- Return the appropriate record based on operation type
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to various tables
-- Products table
DROP TRIGGER IF EXISTS log_product_activity ON public.products;
CREATE TRIGGER log_product_activity
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Users table
DROP TRIGGER IF EXISTS log_user_activity ON public.users;
CREATE TRIGGER log_user_activity
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- KYC verifications table (assuming it exists)
DROP TRIGGER IF EXISTS log_kyc_activity ON public.kyc_verifications;
CREATE TRIGGER log_kyc_activity
AFTER INSERT OR UPDATE OR DELETE ON public.kyc_verifications
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Create a function to log authentication events (login/logout)
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
    action_desc TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.auth_user_id;
    
    -- Get user role
    SELECT role INTO user_role FROM public.users WHERE id = NEW.auth_user_id;
    
    -- Determine action type and description
    IF NEW.event = 'login' THEN
        action_desc := user_email || ' logged in';
    ELSIF NEW.event = 'logout' THEN
        action_desc := user_email || ' logged out';
    ELSE
        action_desc := user_email || ' performed ' || NEW.event;
    END IF;
    
    -- Insert the activity
    INSERT INTO public.activities (
        user_id,
        action_type,
        user_type,
        description,
        ip_address,
        metadata,
        severity
    ) VALUES (
        NEW.auth_user_id,
        NEW.event, -- login, logout, etc.
        user_role,
        action_desc,
        NEW.ip::TEXT,
        row_to_json(NEW)::jsonb,
        'info'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add sample data for testing
INSERT INTO public.activities (
    user_id, 
    action_type, 
    user_type, 
    description, 
    severity, 
    ip_address
) VALUES 
(
    -- Replace with actual admin user ID from your database
    (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), 
    'login', 
    'admin', 
    'Admin user logged in', 
    'info', 
    '192.168.1.1'
),
(
    -- Replace with actual admin user ID from your database
    (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), 
    'update', 
    'admin', 
    'Updated system settings', 
    'medium', 
    '192.168.1.1'
),
(
    -- Replace with actual agent user ID from your database
    (SELECT id FROM auth.users WHERE email = 'agent@example.com' LIMIT 1), 
    'create', 
    'agent', 
    'Created new product listing', 
    'low', 
    '192.168.1.2'
),
(
    -- Replace with actual user ID from your database
    (SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1), 
    'kyc', 
    'user', 
    'Submitted KYC documents for verification', 
    'medium', 
    '192.168.1.3'
);

-- NOTE: You may need to adjust the sample data above to match your actual users in the database
-- If the INSERT fails because the user IDs don't exist, you can comment out the sample data section