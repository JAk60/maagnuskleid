// ========================================
// app/api/webhooks/razorpay/route.ts
// PRODUCTION READY - Webhook with Better Logging
// ========================================

import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createShipRocketOrder } from "@/lib/shiprocket/orderService"

/* -------------------------------------------------------------------------- */
/*                               SUPABASE CLIENT                               */
/* -------------------------------------------------------------------------- */

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface RazorpayPaymentEntity {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  method: string
}

interface RazorpayWebhookPayload {
  payment: {
    entity: RazorpayPaymentEntity
  }
}

interface RazorpayWebhookEvent {
  event: "payment.captured" | "payment.failed" | string
  payload: RazorpayWebhookPayload
}

interface WebhookResult {
  success: boolean
  error?: string
  order_id?: string
}

/* -------------------------------------------------------------------------- */
/*                                TYPE GUARDS                                 */
/* -------------------------------------------------------------------------- */

function isRazorpayWebhookEvent(data: unknown): data is RazorpayWebhookEvent {
  if (!data || typeof data !== "object") return false

  const e = data as Partial<RazorpayWebhookEvent>

  return (
    typeof e.event === "string" &&
    typeof e.payload === "object" &&
    typeof e.payload?.payment === "object" &&
    typeof e.payload?.payment?.entity?.id === "string"
  )
}

/* -------------------------------------------------------------------------- */
/*                           SIGNATURE VERIFICATION                            */
/* -------------------------------------------------------------------------- */

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  return expectedSignature === signature
}

/* -------------------------------------------------------------------------- */
/*                         PAYMENT.CAPTURED HANDLER                            */
/* -------------------------------------------------------------------------- */

async function handlePaymentCaptured(
  payment: RazorpayPaymentEntity
): Promise<WebhookResult> {
  console.log("🔔 WEBHOOK: payment.captured received")
  console.log("   Payment ID:", payment.id)
  console.log("   Order ID:", payment.order_id)
  console.log("   Amount:", payment.amount / 100, payment.currency)

  const supabase = getSupabaseClient()

  try {
    // Find order by razorpay_order_id
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, order_number, shiprocket_order_id, payment_status")
      .eq("razorpay_order_id", payment.order_id)
      .single()

    if (findError || !order) {
      console.error("❌ Order not found for razorpay_order_id:", payment.order_id)
      return { success: false, error: "Order not found" }
    }

    console.log("📦 Found order:", order.order_number)

    // Check if already paid (via verify-payment route)
    if (order.payment_status === "paid") {
      console.log("ℹ️ Order already marked as paid (likely via verify-payment)")

      // Check if ShipRocket order exists
      if (order.shiprocket_order_id) {
        console.log("✅ ShipRocket order already exists:", order.shiprocket_order_id)
        return { success: true, order_id: order.id }
      } else {
        console.log("⚠️ Creating missing ShipRocket order...")
      }
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id: payment.id,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        order_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (updateError) {
      console.error("❌ Failed to update order:", updateError.message)
      return { success: false, error: updateError.message }
    }

    console.log("💰 Order marked as PAID")

    // Create ShipRocket order if not exists
    if (!order.shiprocket_order_id) {
      try {
        console.log("🚀 Creating ShipRocket order...")
        
        const shipRocketResult = await createShipRocketOrder(order.id)

        if (shipRocketResult.success) {
          console.log("✅ ShipRocket order created:", shipRocketResult.shiprocket_order_id)
        } else {
          console.warn("⚠️ ShipRocket creation returned false")
        }
      } catch (shipRocketError: unknown) {
        const message =
          shipRocketError instanceof Error
            ? shipRocketError.message
            : "Unknown ShipRocket error"

        console.error("❌ ShipRocket creation failed:", message)

        // Log error but don't fail webhook
        await supabase.from("shiprocket_logs").insert({
          order_id: order.id,
          action: "webhook_auto_create",
          status: "error",
          error_message: message,
          request_payload: { payment_id: payment.id },
        })
      }
    }

    return { success: true, order_id: order.id }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unhandled error"
    console.error("❌ Webhook processing error:", message)
    return { success: false, error: message }
  }
}

/* -------------------------------------------------------------------------- */
/*                          PAYMENT.FAILED HANDLER                             */
/* -------------------------------------------------------------------------- */

async function handlePaymentFailed(
  payment: RazorpayPaymentEntity
): Promise<WebhookResult> {
  console.log("🔔 WEBHOOK: payment.failed received")
  console.log("   Payment ID:", payment.id)
  console.log("   Order ID:", payment.order_id)

  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        order_status: "payment_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", payment.order_id)

    if (error) {
      console.error("❌ Failed to update order:", error.message)
      return { success: false, error: error.message }
    }

    console.log("✅ Order marked as payment_failed")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unhandled error"
    console.error("❌ Error handling failed payment:", message)
    return { success: false, error: message }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   WEBHOOK                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  console.log("\n=== RAZORPAY WEBHOOK RECEIVED ===")
  console.log("Timestamp:", new Date().toISOString())

  try {
    const rawBody = await req.text()
    const headerList = headers()
    const signature = (await headerList).get("x-razorpay-signature")

    if (!signature) {
      console.error("❌ Missing Razorpay signature")
      return NextResponse.json(
        { error: "Missing Razorpay signature" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("❌ Webhook secret not configured")
      throw new Error("Razorpay webhook secret not configured")
    }

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)

    if (!isValid) {
      console.error("❌ Invalid webhook signature")
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    console.log("✅ Webhook signature verified")

    const parsed: unknown = JSON.parse(rawBody)

    if (!isRazorpayWebhookEvent(parsed)) {
      console.error("❌ Invalid webhook payload structure")
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    console.log("📥 Event type:", parsed.event)

    let result: WebhookResult

    switch (parsed.event) {
      case "payment.captured":
        result = await handlePaymentCaptured(parsed.payload.payment.entity)
        break

      case "payment.failed":
        result = await handlePaymentFailed(parsed.payload.payment.entity)
        break

      default:
        console.log("ℹ️ Unhandled event type:", parsed.event)
        return NextResponse.json({ received: true })
    }

    if (!result.success) {
      console.error("❌ Webhook handler failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("✅ Webhook processed successfully")
    console.log("=== END WEBHOOK ===\n")

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook failure"

    console.error("❌ Critical webhook error:", message)
    console.log("=== END WEBHOOK (ERROR) ===\n")

    return NextResponse.json({ error: message }, { status: 500 })
  }
}