// ========================================
// app/api/razorpay/verify-payment/route.ts
// PRODUCTION READY - ShipRocket + Meta CAPI
// ========================================

import { NextRequest, NextResponse } from "next/server"
import { verifyRazorpaySignature } from "@/lib/razorpay"
import { updateOrderPayment } from "@/lib/supabase-orders"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createShipRocketOrder } from "@/lib/shiprocket/orderService"
import { supabaseAdmin } from "@/lib/supabase-admin"
import crypto from "crypto"

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

interface OrderItem {
  product_id: number
  quantity: number
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

function hashValue(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
}

/* -------------------------------------------------------------------------- */
/*                         GET USER EMAIL FROM AUTH                            */
/* -------------------------------------------------------------------------- */

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error || !data?.user?.email) return null
    return data.user.email
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                            META CAPI PURCHASE                               */
/* -------------------------------------------------------------------------- */

async function sendMetaCAPIPurchase(
  orderId: string,
  order: {
    total: number
    order_number: string
    items: OrderItem[]
    user_id?: string | null
    shipping_address?: {
      phone?: string | null
    } | null
  }
): Promise<void> {
  const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  if (!metaAccessToken || !metaPixelId) {
    console.warn("⚠️ Meta CAPI credentials not configured, skipping")
    return
  }

  const eventId = `purchase_${orderId}`

  // Build user_data with whatever we have
  const userData: Record<string, string> = {}

  // Get email from auth
  if (order.user_id) {
    const email = await getUserEmail(order.user_id)
    if (email) {
      userData.em = hashValue(email)
    }
  }

  // Get phone from shipping address — use as-is, already formatted by PhoneInput
  if (order.shipping_address?.phone) {
    const rawPhone = order.shipping_address.phone.replace(/\D/g, "")
    userData.ph = hashValue(rawPhone)
  }
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${metaPixelId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: "https://maagnuskleid.com/order-success",
            action_source: "website",
            user_data: userData,
            custom_data: {
              value: order.total,
              currency: "INR",
              content_ids: order.items.map(i => String(i.product_id)),
              content_type: "product",
              num_items: order.items.reduce(
                (sum, i) => sum + i.quantity,
                0
              ),
              order_id: order.order_number,
            },
          },
        ],
        access_token: metaAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Meta CAPI responded ${response.status}: ${err}`)
  }

  console.log("✅ Meta CAPI Purchase sent:", eventId)
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
          error: "Too many verification attempts. Please wait before trying again.",
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

      /* ----------------------- META CAPI PURCHASE ------------------------- */

      try {
        await sendMetaCAPIPurchase(order_id, {
          total: updatedOrder.total,
          order_number: updatedOrder.order_number ?? order_id,
          items: updatedOrder.items as OrderItem[],
          user_id: updatedOrder.user_id ?? null,
          shipping_address: updatedOrder.shipping_address as {
            phone?: string | null
          } | null,
        })
      } catch (capiError: unknown) {
        // Non-critical — payment succeeded, just log it
        console.error(
          "⚠️ Meta CAPI error (non-critical):",
          capiError instanceof Error ? capiError.message : capiError
        )
      }

      /* ----------------------- CREATE SHIPROCKET ORDER -------------------- */

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