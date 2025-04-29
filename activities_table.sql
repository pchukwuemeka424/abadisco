-- Activities Table for tracking admin and user actions
-- Create the activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
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

-- Add foreign key with ON DELETE SET NULL for safer handling
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS fk_activities_users;

ALTER TABLE public.activities
ADD CONSTRAINT fk_activities_users 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

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
    -- Get current user ID from auth.uid() or session variables
    current_user_id := auth.uid();
    
    -- Get user role from users table
    SELECT role INTO current_user_role FROM public.users WHERE id = current_user_id;
    
    -- Set default user_type if NULL (this fixes the not-null constraint issue)
    IF current_user_role IS NULL THEN
        current_user_role := 'system';
    END IF;
    
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
                action_description := 'User created: ' || COALESCE(NEW.email, 'Unknown');
            ELSIF (TG_OP = 'UPDATE') THEN
                action_description := 'User updated: ' || COALESCE(NEW.email, 'Unknown');
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'User deleted: ' || COALESCE(OLD.email, 'Unknown');
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
        
        WHEN 'markets' THEN
            resource_type := 'markets';
            
            -- Create appropriate description based on operation
            IF (TG_OP = 'INSERT') THEN
                action_description := 'Market created: ' || COALESCE(NEW.name, 'Unknown');
            ELSIF (TG_OP = 'UPDATE') THEN
                action_description := 'Market updated: ' || COALESCE(NEW.name, 'Unknown');
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'Market deleted: ' || COALESCE(OLD.name, 'Unknown');
            END IF;
            
        WHEN 'businesses' THEN
            resource_type := 'businesses';
            
            -- Create appropriate description based on operation
            IF (TG_OP = 'INSERT') THEN
                action_description := 'Business created: ' || COALESCE(NEW.name, 'Unknown');
            ELSIF (TG_OP = 'UPDATE') THEN
                action_description := 'Business updated: ' || COALESCE(NEW.name, 'Unknown');
            ELSIF (TG_OP = 'DELETE') THEN
                action_description := 'Business deleted: ' || COALESCE(OLD.name, 'Unknown');
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

-- KYC verifications table
DROP TRIGGER IF EXISTS log_kyc_activity ON public.kyc_verifications;
CREATE TRIGGER log_kyc_activity
AFTER INSERT OR UPDATE OR DELETE ON public.kyc_verifications
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Markets table
DROP TRIGGER IF EXISTS log_market_activity ON public.markets;
CREATE TRIGGER log_market_activity
AFTER INSERT OR UPDATE OR DELETE ON public.markets
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Businesses table
DROP TRIGGER IF EXISTS log_business_activity ON public.businesses;
CREATE TRIGGER log_business_activity
AFTER INSERT OR UPDATE OR DELETE ON public.businesses
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
    
    -- Set default user_type if NULL
    IF user_role IS NULL THEN
        user_role := 'user';
    END IF;
    
    -- Determine action type and description
    IF NEW.event = 'login' THEN
        action_desc := COALESCE(user_email, 'Unknown user') || ' logged in';
    ELSIF NEW.event = 'logout' THEN
        action_desc := COALESCE(user_email, 'Unknown user') || ' logged out';
    ELSE
        action_desc := COALESCE(user_email, 'Unknown user') || ' performed ' || NEW.event;
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