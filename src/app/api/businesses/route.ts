import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET(request: Request) {
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials. Please check your environment variables.' 
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const marketId = url.searchParams.get('marketId');
    const categoryId = url.searchParams.get('categoryId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
      
    if (tableError) {
      if (tableError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({ 
          error: 'Businesses table not found in database. Please run the SQL setup script.' 
        }, { status: 404 });
      }
      throw tableError;
    }

    // Start building query
    let query = supabase
      .from('businesses')
      .select(`
        *,
        market:markets(name, location),
        category:business_categories(title, icon_type),
        owner:users(full_name, phone, email)
      `)
      .eq('status', 'active');

    // Apply filters if provided
    if (marketId) {
      query = query.eq('market_id', marketId);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply pagination
    const { data: businesses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ businesses, count });
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}