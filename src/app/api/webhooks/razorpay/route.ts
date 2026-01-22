// app/api/webhooks/razorpay/route.ts - FIXED FOR BUILD
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createShipRocketOrder } from '@/lib/shiprocket/orderService';

// ✅ FIX: Lazy initialization - don't create client at module level
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any) {
  console.log('Processing payment.captured event:', payment.id);

  const { order_id, id: payment_id } = payment;
  const supabase = getSupabaseClient(); // ✅ Create client here

  try {
    // Find order by razorpay_order_id
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', order_id)
      .single();

    if (findError || !order) {
      console.error('Order not found for razorpay_order_id:', order_id);
      return { success: false, error: 'Order not found' };
    }

    // Update order with payment details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id: payment_id,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        order_status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Order ${order.order_number} marked as paid`);

    // *** AUTO-CREATE SHIPROCKET ORDER ***
    try {
      const shipRocketResult = await createShipRocketOrder(order.id);
      console.log('ShipRocket order created:', shipRocketResult);
    } catch (shipRocketError: any) {
      console.error('ShipRocket order creation failed:', shipRocketError.message);
      
      await supabase.from('shiprocket_logs').insert({
        order_id: order.id,
        action: 'auto_create_order',
        status: 'error',
        error_message: shipRocketError.message,
      });
    }

    return { success: true, order_id: order.id };
  } catch (error: any) {
    console.error('Error in handlePaymentCaptured:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any) {
  console.log('Processing payment.failed event:', payment.id);

  const { order_id } = payment;
  const supabase = getSupabaseClient(); // ✅ Create client here

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        order_status: 'payment_failed',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', order_id);

    if (error) {
      console.error('Failed to update order:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in handlePaymentFailed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = (await headersList).get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    let result;

    switch (event.event) {
      case 'payment.captured':
        result = await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'payment.failed':
        result = await handlePaymentFailed(event.payload.payment.entity);
        break;

      default:
        console.log('Unhandled event type:', event.event);
        return NextResponse.json({ received: true });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}