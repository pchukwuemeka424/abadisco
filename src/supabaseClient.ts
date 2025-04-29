import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // In development, show a helpful warning
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Warning: Missing Supabase environment variables. Please check your .env file.',
      { 
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓' : '✗', 
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓' : '✗' 
      }
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
