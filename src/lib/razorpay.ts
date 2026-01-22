// lib/razorpay.ts

import crypto from 'crypto';

// Add these to your .env.local file:
// NEXT_PUBLIC_RAZORPAY_KEY_ID=your_test_key_id
// RAZORPAY_KEY_SECRET=your_test_key_secret

export interface RazorpayOrderOptions {
  amount: number; // Amount in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

// Client-side: Initialize Razorpay checkout
export function initializeRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Client-side: Open Razorpay checkout
export function openRazorpayCheckout(
  options: {
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    notes?: Record<string, string>;
  },
  onSuccess: (response: any) => void,
  onError: (error: any) => void
) {
  const razorpayOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    image: options.image,
    order_id: options.orderId,
    prefill: options.prefill,
    notes: options.notes,
    theme: {
      color: '#000000', // Your brand color
    },
    handler: onSuccess,
    modal: {
      ondismiss: () => {
        onError({ reason: 'Payment cancelled by user' });
      },
    },
  };

  // @ts-ignore
  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.on('payment.failed', onError);
  razorpay.open();
}

// Server-side: Verify payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

// Convert amount to paise (for INR)
export function convertToPaise(amount: number): number {
  return Math.round(amount * 100);
}

// Convert paise to rupees
export function convertToRupees(paise: number): number {
  return paise / 100;
}