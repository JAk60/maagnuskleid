// app/api/admin/orders/route.ts - FIXED WITH DELIVERY DATE

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('📦 Admin Orders API called');

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('order_status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ Orders query error:', error);
      throw error;
    }

    console.log(`✅ Found ${orders?.length || 0} orders`);

    return NextResponse.json(orders || [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Admin Orders API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch orders',
        orders: []
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating order...');

    const body = await request.json();
    const { id, order_status, ...otherUpdates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updates: any = {
      ...otherUpdates,
      updated_at: new Date().toISOString()
    };

    // If order_status is provided, add it
    if (order_status) {
      updates.order_status = order_status;
    }

    // ✅ FIX: Automatically set timestamp fields based on status
    if (order_status === 'shipped' && !updates.shipped_at) {
      updates.shipped_at = new Date().toISOString();
      console.log('✅ Set shipped_at timestamp');
    }

    if (order_status === 'delivered' && !updates.delivered_at) {
      updates.delivered_at = new Date().toISOString();
      console.log('✅ Set delivered_at timestamp');
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update order error:', error);
      throw error;
    }

    console.log('✅ Order updated:', data.id);
    console.log('Status:', data.order_status);
    console.log('Delivered at:', data.delivered_at);

    return NextResponse.json(
      { success: true, order: data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Update order error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update order' 
      },
      { status: 500 }
    );
  }
}

// ========================================
// BULK UPDATE STATUS (Optional - for admin efficiency)
// ========================================

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderIds, order_status } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    if (!order_status) {
      return NextResponse.json(
        { error: 'Order status is required' },
        { status: 400 }
      );
    }

    const updates: any = {
      order_status,
      updated_at: new Date().toISOString()
    };

    // Set timestamp based on status
    if (order_status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    }

    if (order_status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }

    // Update all orders
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .in('id', orderIds)
      .select();

    if (error) throw error;

    console.log(`✅ Bulk updated ${data.length} orders to ${order_status}`);

    return NextResponse.json({
      success: true,
      updated: data.length,
      orders: data
    });

  } catch (error: any) {
    console.error('❌ Bulk update error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to bulk update orders' 
      },
      { status: 500 }
    );
  }
}