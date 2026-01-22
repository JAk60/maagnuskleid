// app/api/admin/analytics/route.ts - FIXED VERSION

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Import admin client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    console.log(`📊 Analytics API called for last ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get orders in time range
    const { data: orders, count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    // Get paid orders for revenue
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString());

    const totalRevenue = paidOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // ✅ FIX: Use supabaseAdmin to get total customers
    let totalCustomers = 0;
    try {
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      totalCustomers = users?.length || 0;
      console.log(`✅ Found ${totalCustomers} customers`);
      
      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
    }

    // Calculate growth (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const { data: previousPaidOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousRevenue = previousPaidOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Get top products (based on order items)
    const topProducts: any[] = [];
    if (orders && orders.length > 0) {
      const productSales: Record<number, { count: number; revenue: number; product: any }> = {};
      
      for (const order of orders) {
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = {
                count: 0,
                revenue: 0,
                product: item
              };
            }
            productSales[item.product_id].count += item.quantity;
            productSales[item.product_id].revenue += item.subtotal;
          }
        }
      }

      // Convert to array and get product details
      const salesArray = Object.entries(productSales).map(([id, data]) => ({
        product_id: parseInt(id),
        sales_count: data.count,
        revenue: data.revenue,
        name: data.product.product_name,
        image_url: data.product.product_image
      }));

      topProducts.push(...salesArray.sort((a, b) => b.revenue - a.revenue).slice(0, 5));
    }

    // Get recent sales
    const recentSales = orders?.slice(0, 5).map(order => ({
      order_number: order.order_number,
      customer_name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'N/A',
      total: order.total,
      items_count: order.items?.length || 0,
      created_at: order.created_at
    })) || [];

    // Get monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString());

      const monthRevenue = monthOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrders?.length || 0
      });
    }

    const analyticsData = {
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalCustomers,
      totalProducts: totalProducts || 0,
      revenueGrowth: Math.round(revenueGrowth),
      ordersGrowth: 0, // Can calculate if needed
      customersGrowth: 0, // Can calculate if needed
      topProducts,
      recentSales,
      monthlyRevenue
    };

    console.log('✅ Analytics calculated');

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error: any) {
    console.error('❌ Analytics API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch analytics',
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0,
        topProducts: [],
        recentSales: [],
        monthlyRevenue: []
      }
    }, { status: 500 });
  }
}