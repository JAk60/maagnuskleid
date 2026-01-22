// app/api/exchanges/route.ts - SIMPLIFIED FOR SIZE/COLOR ONLY

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ==========================================
// TYPES
// ==========================================

interface ExchangeItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  original_price: number;
  current_price?: number;
}

// ==========================================
// ELIGIBILITY CHECK
// ==========================================

async function checkEligibility(orderId: string, userId: string) {
  // Get order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    return { eligible: false, reason: 'Order not found' };
  }

  // ✅ Check for active exchanges
  const { data: activeExchanges } = await supabase
    .from('exchange_requests')
    .select('id, status, created_at')
    .eq('order_id', orderId)
    .in('status', ['pending', 'approved', 'processing', 'shipped']);

  if (activeExchanges && activeExchanges.length > 0) {
    const exchange = activeExchanges[0];
    const statusMessages: Record<string, string> = {
      'pending': 'pending admin review',
      'approved': 'approved and ready to ship',
      'processing': 'being processed',
      'shipped': 'already shipped'
    };
    const statusText = statusMessages[exchange.status] || exchange.status;
    return { 
      eligible: false, 
      reason: `An exchange request for this order is already ${statusText}. You cannot create multiple exchange requests for the same order.`,
      existingExchangeId: exchange.id
    };
  }

  // Check status
  if (order.order_status !== 'delivered') {
    return { eligible: false, reason: 'Only delivered orders can be exchanged' };
  }

  if (order.payment_status !== 'paid') {
    return { eligible: false, reason: 'Order must be fully paid' };
  }

  // Check 30-day window
  if (!order.delivered_at) {
    return { eligible: false, reason: 'Delivery date not recorded' };
  }

  const deliveredDate = new Date(order.delivered_at);
  const now = new Date();
  const daysSinceDelivery = Math.floor(
    (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceDelivery > 30) {
    return { 
      eligible: false, 
      reason: 'Exchange window expired (30 days from delivery)' 
    };
  }

  return { eligible: true, daysRemaining: 30 - daysSinceDelivery };
}

// ==========================================
// VALIDATE SAME PRODUCT
// ==========================================

function validateSameProduct(originalItems: ExchangeItem[], requestedItems: ExchangeItem[]) {
  if (originalItems.length !== requestedItems.length) {
    return { valid: false, error: 'Item count mismatch' };
  }

  for (let i = 0; i < originalItems.length; i++) {
    const orig = originalItems[i];
    const req = requestedItems[i];

    // Must be same product
    if (orig.product_id !== req.product_id) {
      return { 
        valid: false, 
        error: 'Product exchange not allowed. You can only change size or color of the same product.' 
      };
    }

    // Must be same quantity
    if (orig.quantity !== req.quantity) {
      return { 
        valid: false, 
        error: 'Quantity cannot be changed. You can only change size or color.' 
      };
    }

    // At least size OR color must be different
    if (orig.size === req.size && orig.color === req.color) {
      return { 
        valid: false, 
        error: 'Please select a different size or color to exchange.' 
      };
    }
  }

  return { valid: true };
}

// ==========================================
// POST - CREATE EXCHANGE REQUEST
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      order_id,
      user_id,
      original_items,
      requested_items,
      exchange_type,
      reason,
      description
    } = body;

    // 1. Validate required fields
    if (!order_id || !user_id || !original_items || !requested_items) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Validate exchange type
    if (!['size', 'color'].includes(exchange_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid exchange type. Only size and color exchanges are allowed.' },
        { status: 400 }
      );
    }

    console.log('📝 Creating exchange request for user:', user_id);

    // 3. Check eligibility
    const eligibility = await checkEligibility(order_id, user_id);
    if (!eligibility.eligible) {
      console.log('❌ Not eligible:', eligibility.reason);
      return NextResponse.json(
        { 
          success: false, 
          error: eligibility.reason,
          existingExchangeId: eligibility.existingExchangeId
        },
        { status: 400 }
      );
    }

    // 4. Validate same product rule
    const validation = validateSameProduct(original_items, requested_items);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 5. Get order number
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single();

    // 6. Calculate totals (should be same for same product)
    const originalTotal = original_items.reduce(
      (sum: number, item: ExchangeItem) => sum + (item.original_price * item.quantity),
      0
    );

    const requestedTotal = requested_items.reduce(
      (sum: number, item: ExchangeItem) => sum + ((item.current_price || item.original_price) * item.quantity),
      0
    );

    // 7. ✅ DOUBLE-CHECK: No active exchange exists (race condition prevention)
    const { data: doubleCheck } = await supabaseAdmin
      .from('exchange_requests')
      .select('id, status')
      .eq('order_id', order_id)
      .in('status', ['pending', 'approved', 'processing', 'shipped'])
      .maybeSingle();

    if (doubleCheck) {
      console.log('❌ Race condition detected - exchange already exists');
      return NextResponse.json(
        { 
          success: false, 
          error: 'An exchange request for this order already exists. Please refresh and try again.',
          existingExchangeId: doubleCheck.id
        },
        { status: 409 }
      );
    }

    // 8. Create exchange request using ADMIN CLIENT
    const exchangeData = {
      order_id,
      order_number: order?.order_number || '',
      user_id,
      original_items,
      requested_items,
      exchange_type,
      reason,
      description: description || '',
      
      // Pricing (should be zero for same product)
      original_total: originalTotal,
      requested_total: requestedTotal,
      price_difference: 0,
      tax_amount: 0,
      settlement_amount: 0,
      
      // Settlement (always NO_CHARGE for same product)
      settlement_type: 'NO_CHARGE',
      settlement_status: 'COMPLETED',
      
      // Status
      status: 'pending', // Awaiting admin approval
      
      // Same product flag
      is_same_product: true
    };

    console.log('📤 Inserting exchange request...');

    const { data: exchange, error: exchangeError } = await supabaseAdmin
      .from('exchange_requests')
      .insert(exchangeData)
      .select()
      .single();

    if (exchangeError) {
      console.error('Exchange creation error:', exchangeError);
      
      if (exchangeError.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An exchange request for this order already exists.'
          },
          { status: 409 }
        );
      }
      
      throw exchangeError;
    }

    console.log('✅ Exchange created:', exchange.id);

    return NextResponse.json({
      success: true,
      data: exchange,
      message: 'Exchange request submitted successfully! No additional payment required. Our team will review it shortly.',
      nextAction: 'WAIT_APPROVAL'
    });

  } catch (error: any) {
    console.error('❌ Exchange API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create exchange' },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - FETCH EXCHANGE REQUESTS
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('exchange_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data: exchanges, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: exchanges || []
    });

  } catch (error: any) {
    console.error('❌ Get Exchanges Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}