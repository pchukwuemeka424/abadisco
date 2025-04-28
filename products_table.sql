-- Products Table Definition
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  created_at timestamp WITH TIME ZONE NULL DEFAULT now(),
  image_urls text NULL,
  
  -- Primary key constraint
  CONSTRAINT products_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add comment to table
COMMENT ON TABLE public.products IS 'Stores product information for the marketplace';

-- Add foreign key constraint to link with users table
ALTER TABLE IF EXISTS public.products
  ADD CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users (id) ON DELETE CASCADE;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products (user_id);

-- Grant appropriate permissions
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
CREATE POLICY "Users can view their own products" 
  ON public.products FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" 
  ON public.products FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
  ON public.products FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow admins to view all products
CREATE POLICY "Admins can view all products" 
  ON public.products FOR SELECT 
  USING (
    auth.jwt() ? 'is_admin' 
    OR EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );