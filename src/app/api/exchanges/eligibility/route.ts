// app/api/exchanges/eligibility/route.ts - FIXED DUPLICATE DETECTION

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking eligibility for order:', orderId);

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        eligible: false,
        reason: 'Order not found or does not belong to you'
      });
    }

    // ✅ CRITICAL: Check for ANY active exchange FIRST
    const { data: activeExchanges, error: exchangeError } = await supabase
      .from('exchange_requests')
      .select('id, status, created_at')
      .eq('order_id', orderId)
      .in('status', ['pending', 'awaiting_payment', 'approved', 'processing', 'shipped']);

    if (exchangeError) {
      console.error('Error checking exchanges:', exchangeError);
    }

    // If there's ANY active exchange, block immediately
    if (activeExchanges && activeExchanges.length > 0) {
      const exchange = activeExchanges[0];
      
      const statusMessages: Record<string, string> = {
        'pending': 'pending admin review',
        'awaiting_payment': 'awaiting your payment',
        'approved': 'approved and ready to ship',
        'processing': 'being processed',
        'shipped': 'already shipped'
      };

      const statusText = statusMessages[exchange.status] || exchange.status;

      console.log('❌ Active exchange found:', exchange.id, exchange.status);

      return NextResponse.json({
        success: true,
        eligible: false,
        reason: `An exchange request for this order is already ${statusText}. You cannot create multiple exchange requests for the same order.`,
        existingExchange: {
          id: exchange.id,
          status: exchange.status,
          created_at: exchange.created_at
        },
        daysRemaining: null
      });
    }

    // Check order status
    if (order.order_status !== 'delivered') {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: `Only delivered orders can be exchanged. Current status: ${order.order_status}`
      });
    }

    // Check payment status
    if (order.payment_status !== 'paid') {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'Order must be fully paid to request exchange'
      });
    }

    // Check delivery date and 30-day window
    if (!order.delivered_at) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'Delivery date not recorded. Please contact support.'
      });
    }

    const deliveredDate = new Date(order.delivered_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const EXCHANGE_WINDOW_DAYS = 30;

    if (daysSinceDelivery > EXCHANGE_WINDOW_DAYS) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: `Exchange window has expired. Items must be exchanged within ${EXCHANGE_WINDOW_DAYS} days of delivery. Your order was delivered ${daysSinceDelivery} days ago.`
      });
    }

    const daysRemaining = EXCHANGE_WINDOW_DAYS - daysSinceDelivery;
    const warnings: string[] = [];

    if (daysRemaining <= 5) {
      warnings.push(`Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining to exchange this order`);
    }

    // Check if all items have been fully exchanged (completed exchanges only)
    const { data: completedExchanges } = await supabase
      .from('exchange_requests')
      .select('original_items')
      .eq('order_id', orderId)
      .eq('status', 'completed');

    if (completedExchanges && completedExchanges.length > 0) {
      const exchangedItemsMap = new Map<string, number>();
      
      completedExchanges.forEach(exchange => {
        exchange.original_items.forEach((item: any) => {
          const key = `${item.product_id}-${item.size}-${item.color}`;
          const current = exchangedItemsMap.get(key) || 0;
          exchangedItemsMap.set(key, current + item.quantity);
        });
      });

      // Check if ALL items have been fully exchanged
      let allItemsExchanged = true;
      for (const orderItem of order.items) {
        const key = `${orderItem.product_id}-${orderItem.size}-${orderItem.color}`;
        const exchangedQty = exchangedItemsMap.get(key) || 0;
        if (exchangedQty < orderItem.quantity) {
          allItemsExchanged = false;
          break;
        }
      }

      if (allItemsExchanged) {
        return NextResponse.json({
          success: true,
          eligible: false,
          reason: 'All items from this order have already been exchanged. You cannot exchange the same items multiple times.'
        });
      }
    }

    console.log('✅ Order is eligible for exchange');

    return NextResponse.json({
      success: true,
      eligible: true,
      reason: null,
      warnings: warnings.length > 0 ? warnings : undefined,
      daysRemaining
    });

  } catch (error: any) {
    console.error('❌ Eligibility check API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        eligible: false,
        error: error.message || 'Failed to check eligibility' 
      },
      { status: 500 }
    );
  }
}