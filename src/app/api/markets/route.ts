import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET() {
  try {
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