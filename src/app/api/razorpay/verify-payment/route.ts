// ========================================
// app/api/razorpay/verify-payment/route.ts
// STRICT + ESLINT CLEAN (NO any, NO unsafe unknown)
// ========================================

import { NextRequest, NextResponse } from "next/server"
import { verifyRazorpaySignature } from "@/lib/razorpay"
import { updateOrderPayment } from "@/lib/supabase-orders"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface VerifyPaymentPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: string
}

interface PaymentUpdatePayload {
  razorpay_payment_id: string
  razorpay_signature: string
  payment_status: "paid"
  paid_at: string
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function isVerifyPaymentPayload(body: unknown): body is VerifyPaymentPayload {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<VerifyPaymentPayload>

  return (
    typeof b.razorpay_order_id === "string" &&
    typeof b.razorpay_payment_id === "string" &&
    typeof b.razorpay_signature === "string" &&
    typeof b.order_id === "string"
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected verification error"
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    /* ----------------------------- RATE LIMIT ----------------------------- */

    const identifier = getClientIdentifier(request)

    const rateLimitResult = rateLimit(`verify:${identifier}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000, // 5 minutes
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many verification attempts. Please wait before trying again.",
        },
        { status: 429 }
      )
    }

    /* ----------------------------- BODY PARSE ----------------------------- */

    const rawBody: unknown = await request.json()

    if (!isVerifyPaymentPayload(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment verification payload" },
        { status: 400 }
      )
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = rawBody

    /* -------------------------- SIGNATURE VERIFY -------------------------- */

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      throw new Error("Razorpay key secret is not configured")
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    )

    if (!isValid) {
      console.error("❌ Invalid payment signature for order:", order_id)

      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed - invalid signature",
        },
        { status: 400 }
      )
    }

    /* --------------------------- UPDATE ORDER ----------------------------- */

    const paymentUpdate: PaymentUpdatePayload = {
      razorpay_payment_id,
      razorpay_signature,
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    }

    try {
      const updatedOrder = await updateOrderPayment(
        order_id,
        paymentUpdate
      )

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        order: updatedOrder,
      })
    } catch (dbError: unknown) {
      console.error("❌ Database update error:", dbError)

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment verified but failed to update order. Please contact support.",
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error("❌ Payment verification error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
