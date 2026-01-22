// app/api/admin/stats/route.ts - FIXED VERSION

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Import admin client

export async function GET() {
  try {
    console.log('📊 Stats API called');

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) {
      console.error('Products count error:', productsError);
    }

    // Get total orders count
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) {
      console.error('Orders count error:', ordersError);
    }

    // Get total revenue from paid orders
    let totalRevenue = 0;
    try {
      const { data: paidOrders, error: revenueError } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid');

      if (!revenueError && paidOrders) {
        totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      }
    } catch (err) {
      console.error('Revenue calculation error:', err);
    }

    // Get low stock products (stock <= 5)
    let lowStockProducts: Array<{ id: string; name: string; stock: number; image_url: string; price: number }> = [];
    try {
      const { data: lowStock, error: lowStockError } = await supabase
        .from('products')
        .select('id, name, stock, image_url, price')
        .lte('stock', 5)
        .gt('stock', 0)
        .order('stock', { ascending: true })
        .limit(10);

      if (!lowStockError && lowStock) {
        lowStockProducts = lowStock;
      }
    } catch (err) {
      console.error('Low stock error:', err);
    }

    // Get recent orders
    let recentOrders: { id: any; orderNumber: any; customer: string; amount: any; status: any; paymentStatus: any; date: any; }[] = [];
    try {
      const { data: orders, error: recentError } = await supabase
        .from('orders')
        .select('id, order_number, total, order_status, payment_status, created_at, shipping_address')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && orders) {
        recentOrders = orders.map(order => ({
          id: order.id,
          orderNumber: order.order_number || order.id,
          customer: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'N/A',
          amount: order.total || 0,
          status: order.order_status,
          paymentStatus: order.payment_status,
          date: order.created_at
        }));
      }
    } catch (err) {
      console.error('Recent orders error:', err);
    }

    // ✅ FIX: Use supabaseAdmin to get users count
    let totalCustomers = 0;
    try {
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (!usersError && users) {
        totalCustomers = users.length;
        console.log(`✅ Found ${totalCustomers} customers`);
      } else {
        console.error('❌ Users count error:', usersError);
      }
    } catch (err) {
      console.error('❌ Users count error:', err);
    }

    const stats = {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalCustomers,
      totalRevenue: Math.round(totalRevenue),
      lowStockProducts,
      recentOrders
    };

    console.log('✅ Stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Stats API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          lowStockProducts: [],
          recentOrders: []
        }
      },
      { status: 500 }
    );
  }
}