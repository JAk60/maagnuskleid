// ========================================
// app/api/webhooks/razorpay/route.ts
// STRICT + ESLINT CLEAN (NO any, NO unsafe unknown)
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
  console.log("✅ payment.captured:", payment.id)

  const supabase = getSupabaseClient()

  try {
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", payment.order_id)
      .single()

    if (findError || !order) {
      return { success: false, error: "Order not found" }
    }

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
      return { success: false, error: updateError.message }
    }

    console.log(`💰 Order ${order.order_number} marked as PAID`)

    try {
      await createShipRocketOrder(order.id)
      console.log("🚚 ShipRocket order created")
    } catch (shipRocketError: unknown) {
      const message =
        shipRocketError instanceof Error
          ? shipRocketError.message
          : "Unknown ShipRocket error"

      console.error("❌ ShipRocket error:", message)

      await supabase.from("shiprocket_logs").insert({
        order_id: order.id,
        action: "auto_create_order",
        status: "error",
        error_message: message,
      })
    }

    return { success: true, order_id: order.id }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unhandled error"
    return { success: false, error: message }
  }
}

/* -------------------------------------------------------------------------- */
/*                          PAYMENT.FAILED HANDLER                             */
/* -------------------------------------------------------------------------- */

async function handlePaymentFailed(
  payment: RazorpayPaymentEntity
): Promise<WebhookResult> {
  console.log("❌ payment.failed:", payment.id)

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
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unhandled error"
    return { success: false, error: message }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   WEBHOOK                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const headerList = headers()
    const signature = (await headerList).get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Razorpay signature" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error("Razorpay webhook secret not configured")
    }

    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    )

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const parsed: unknown = JSON.parse(rawBody)

    if (!isRazorpayWebhookEvent(parsed)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    let result: WebhookResult

    switch (parsed.event) {
      case "payment.captured":
        result = await handlePaymentCaptured(
          parsed.payload.payment.entity
        )
        break

      case "payment.failed":
        result = await handlePaymentFailed(
          parsed.payload.payment.entity
        )
        break

      default:
        console.log("ℹ️ Unhandled event:", parsed.event)
        return NextResponse.json({ received: true })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook failure"

    console.error("❌ Razorpay webhook error:", message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
