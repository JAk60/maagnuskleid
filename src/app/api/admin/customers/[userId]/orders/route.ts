// app/api/admin/customers/[userId]/orders/route.ts
// FIXED: Proper parameter handling and pagination

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params in Next.js 15+
    const params = await context.params;
    const userId = params.userId;
    
    console.log(`📦 Fetching orders for user: ${userId}`);

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get total count
    const { count: totalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log(`📊 Total orders for user: ${totalCount}`);

    // Get paginated orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Orders query error:', error);
      throw error;
    }

    console.log(`✅ Found ${orders?.length || 0} orders for page ${page}`);

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasMore: (offset + limit) < (totalCount || 0)
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Customer Orders API Error:', error);
    
    return NextResponse.json({
      orders: [],
      error: error.message || 'Failed to fetch customer orders',
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    }, { status: 500 });
  }
}