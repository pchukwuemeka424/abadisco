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
    // Test with a simple query that should work on any Supabase instance
    const { data, error } = await supabase.from('markets').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        details: error,
        code: error.code
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

// Export function to check environment setup
export const checkEnvironmentSetup = () => {
  const issues: string[] = [];
  
  // In browser context, environment variables are available via process.env
  const browserSupabaseUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : supabaseUrl;
  const browserSupabaseKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : supabaseAnonKey;
  
  console.log('Environment check:', {
    supabaseUrl: browserSupabaseUrl ? 'Set' : 'Missing',
    supabaseKey: browserSupabaseKey ? 'Set' : 'Missing',
    urlPreview: browserSupabaseUrl ? `${browserSupabaseUrl.substring(0, 30)}...` : 'Not set',
    keyPreview: browserSupabaseKey ? `${browserSupabaseKey.substring(0, 20)}...` : 'Not set'
  });
  
  if (!browserSupabaseUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else if (!browserSupabaseUrl.includes('supabase.co')) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL appears to be invalid');
  }
  
  if (!browserSupabaseKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else if (browserSupabaseKey.length < 100) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    config: {
      hasUrl: !!browserSupabaseUrl,
      hasKey: !!browserSupabaseKey,
      urlPreview: browserSupabaseUrl ? `${browserSupabaseUrl.substring(0, 30)}...` : 'Not set'
    }
  };
};
