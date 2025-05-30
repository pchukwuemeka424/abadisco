-- Add metadata and tags columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT NULL;

-- Add comment to explain the purpose of the metadata column
COMMENT ON COLUMN public.products.metadata IS 'Stores AI-generated product analysis and additional product information in JSON format';
COMMENT ON COLUMN public.products.tags IS 'Array of product tags for search and categorization';

-- Create an index on tags for faster search performance
CREATE INDEX IF NOT EXISTS products_tags_idx ON public.products USING gin (tags);

-- Update RLS policies to include the new columns
ALTER POLICY "Enable read access for all users" ON public.products
    USING (true);

ALTER POLICY "Enable insert for authenticated users only" ON public.products
    WITH CHECK (auth.uid() = owner_id::uuid);

ALTER POLICY "Enable update for product owners" ON public.products
    USING (auth.uid() = owner_id::uuid)
    WITH CHECK (auth.uid() = owner_id::uuid);