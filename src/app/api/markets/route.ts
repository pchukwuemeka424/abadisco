import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET() {
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('markets')
      .select('id')
      .limit(1);
      
    if (tableError) {
      if (tableError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({ 
          error: 'Markets table not found in database. Please run the SQL setup script.' 
        }, { status: 404 });
      }
      throw tableError;
    }

    // Get all active markets
    const { data: markets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json(markets);
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}