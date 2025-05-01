import { createClient } from '@supabase/supabase-js';

// Get environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log warning if credentials are missing - helps with debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.',
    { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey 
    }
  );
}

// Create client with available credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a function to test if the connection is working
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count(*)');
    
    if (error) {
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        details: error
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || 'Exception occurred', 
      details: err 
    };
  }
};
