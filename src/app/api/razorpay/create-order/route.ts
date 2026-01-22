// ========================================
// app/api/razorpay/create-order/route.ts - WITH RATE LIMITING
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { convertToPaise } from '@/lib/razorpay';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 payment attempts per 15 minutes per IP
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`payment:${identifier}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many payment attempts. Please try again in ${resetIn} minutes.`
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt/order number is required' },
        { status: 400 }
      );
    }

    // Amount sanity check (prevent extremely large orders)
    if (amount > 1000000) { // 10 lakh rupees max
      return NextResponse.json(
        { success: false, error: 'Order amount exceeds maximum limit' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: convertToPaise(amount),
      currency,
      receipt,
      notes,
    });

    return NextResponse.json({
      success: true,
      order,
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      }
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    
    if (error.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment gateway error: ' + (error.error.description || error.error.reason || 'Unknown error')
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}