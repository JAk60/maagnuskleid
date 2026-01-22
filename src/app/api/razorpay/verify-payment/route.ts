// ========================================
// app/api/razorpay/verify-payment/route.ts - WITH RATE LIMITING
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { updateOrderPayment } from '@/lib/supabase-orders';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 verification attempts per 5 minutes per IP
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`verify:${identifier}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many verification attempts. Please wait before trying again.'
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      console.error('Invalid payment signature for order:', order_id);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    // Update order in database
    try {
      const updatedOrder = await updateOrderPayment(order_id, {
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        order: updatedOrder,
      });
    } catch (dbError: any) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment verified but failed to update order. Please contact support.'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

