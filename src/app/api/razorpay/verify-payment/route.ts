// ========================================
// app/api/razorpay/verify-payment/route.ts
// PRODUCTION READY - ShipRocket Auto-Creation
// ========================================

import { NextRequest, NextResponse } from "next/server"
import { verifyRazorpaySignature } from "@/lib/razorpay"
import { updateOrderPayment } from "@/lib/supabase-orders"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createShipRocketOrder } from "@/lib/shiprocket/orderService"

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
      windowMs: 5 * 60 * 1000,
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

    console.log("✅ Payment signature verified for order:", order_id)

    /* --------------------------- UPDATE ORDER ----------------------------- */

    const paymentUpdate: PaymentUpdatePayload = {
      razorpay_payment_id,
      razorpay_signature,
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    }

    try {
      const updatedOrder = await updateOrderPayment(order_id, paymentUpdate)

      console.log("💰 Order marked as PAID:", order_id)

      /* ----------------------- CREATE SHIPROCKET ORDER ---------------------- */

      try {
        console.log("🚀 Attempting ShipRocket order creation...")
        
        const shipRocketResult = await createShipRocketOrder(order_id)

        if (shipRocketResult.success) {
          console.log(
            "✅ ShipRocket order created:",
            shipRocketResult.shiprocket_order_id
          )

          return NextResponse.json({
            success: true,
            message: "Payment verified and shipping order created successfully",
            order: updatedOrder,
            shiprocket: {
              order_id: shipRocketResult.shiprocket_order_id,
              shipment_id: shipRocketResult.shiprocket_shipment_id,
            },
          })
        } else {
          console.warn("⚠️ ShipRocket order already exists or failed")

          return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            order: updatedOrder,
            shiprocket: {
              note: "ShipRocket order will be created shortly or already exists",
            },
          })
        }
      } catch (shipRocketError: unknown) {
        const errorMsg =
          shipRocketError instanceof Error
            ? shipRocketError.message
            : "ShipRocket creation failed"

        console.error("❌ ShipRocket error:", errorMsg)

        // Payment succeeded, so we still return success
        // Admin can manually create shipping order later
        return NextResponse.json({
          success: true,
          message:
            "Payment verified successfully. Shipping order will be created shortly.",
          order: updatedOrder,
          warning: "ShipRocket order creation pending - check admin panel",
        })
      }
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