import { createClient } from '@supabase/supabase-js';

// Use empty strings as fallbacks during build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if we have valid credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
