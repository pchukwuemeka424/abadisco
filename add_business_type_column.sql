ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS business_type text NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS services jsonb NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp text NULL;

-- Make sure all other columns exist and match the expected data types
DO $$
BEGIN
    -- Check if columns exist before altering
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'website') THEN
        ALTER TABLE public.businesses ADD COLUMN website text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'facebook') THEN
        ALTER TABLE public.businesses ADD COLUMN facebook text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'instagram') THEN
        ALTER TABLE public.businesses ADD COLUMN instagram text NULL;
    END IF;
    
    -- Ensure the proper data types for JSON handling
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'services' AND data_type != 'jsonb') THEN
        ALTER TABLE public.businesses ALTER COLUMN services TYPE jsonb USING services::jsonb;
    END IF;
END
$$;
