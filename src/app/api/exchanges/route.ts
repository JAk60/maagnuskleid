// app/api/exchanges/route.ts - SIMPLIFIED FOR SIZE/COLOR ONLY (STRICT)

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ExchangeItem {
  order_item_id: string
  product_id: number
  product_name: string
  product_image: string
  size: string
  color: string
  quantity: number
  original_price: number
  current_price?: number
}

interface CreateExchangeBody {
  order_id: string
  user_id: string
  original_items: ExchangeItem[]
  requested_items: ExchangeItem[]
  exchange_type: "size" | "color"
  reason?: string
  description?: string
}

interface EligibilityResult {
  eligible: boolean
  reason?: string
  daysRemaining?: number
  existingExchangeId?: string
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected error"
}

function isCreateExchangeBody(body: unknown): body is CreateExchangeBody {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<CreateExchangeBody>

  return (
    typeof b.order_id === "string" &&
    typeof b.user_id === "string" &&
    Array.isArray(b.original_items) &&
    Array.isArray(b.requested_items) &&
    (b.exchange_type === "size" || b.exchange_type === "color")
  )
}

/* -------------------------------------------------------------------------- */
/*                             ELIGIBILITY CHECK                               */
/* -------------------------------------------------------------------------- */

async function checkEligibility(
  orderId: string,
  userId: string
): Promise<EligibilityResult> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single()

  if (error || !order) {
    return { eligible: false, reason: "Order not found" }
  }

  const { data: activeExchanges } = await supabase
    .from("exchange_requests")
    .select("id, status, created_at")
    .eq("order_id", orderId)
    .in("status", ["pending", "approved", "processing", "shipped"])

  if (activeExchanges && activeExchanges.length > 0) {
    const exchange = activeExchanges[0]

    const statusMessages: Record<string, string> = {
      pending: "pending admin review",
      approved: "approved and ready to ship",
      processing: "being processed",
      shipped: "already shipped",
    }

    return {
      eligible: false,
      reason: `An exchange request for this order is already ${
        statusMessages[exchange.status] ?? exchange.status
      }.`,
      existingExchangeId: exchange.id,
    }
  }

  if (order.order_status !== "delivered") {
    return { eligible: false, reason: "Only delivered orders can be exchanged" }
  }

  if (order.payment_status !== "paid") {
    return { eligible: false, reason: "Order must be fully paid" }
  }

  if (!order.delivered_at) {
    return { eligible: false, reason: "Delivery date not recorded" }
  }

  const deliveredDate = new Date(order.delivered_at)
  const daysSinceDelivery = Math.floor(
    (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceDelivery > 30) {
    return {
      eligible: false,
      reason: "Exchange window expired (30 days from delivery)",
    }
  }

  return { eligible: true, daysRemaining: 30 - daysSinceDelivery }
}

/* -------------------------------------------------------------------------- */
/*                          SAME PRODUCT VALIDATION                             */
/* -------------------------------------------------------------------------- */

function validateSameProduct(
  originalItems: ExchangeItem[],
  requestedItems: ExchangeItem[]
): { valid: boolean; error?: string } {
  if (originalItems.length !== requestedItems.length) {
    return { valid: false, error: "Item count mismatch" }
  }

  for (let i = 0; i < originalItems.length; i++) {
    const orig = originalItems[i]
    const req = requestedItems[i]

    if (orig.product_id !== req.product_id) {
      return {
        valid: false,
        error:
          "Product exchange not allowed. Only size or color can be changed.",
      }
    }

    if (orig.quantity !== req.quantity) {
      return {
        valid: false,
        error: "Quantity cannot be changed.",
      }
    }

    if (orig.size === req.size && orig.color === req.color) {
      return {
        valid: false,
        error: "Please select a different size or color.",
      }
    }
  }

  return { valid: true }
}

/* -------------------------------------------------------------------------- */
/*                           POST – CREATE EXCHANGE                             */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json()

    if (!isCreateExchangeBody(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const {
      order_id,
      user_id,
      original_items,
      requested_items,
      exchange_type,
      reason,
      description,
    } = rawBody

    const eligibility = await checkEligibility(order_id, user_id)
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          existingExchangeId: eligibility.existingExchangeId,
        },
        { status: 400 }
      )
    }

    const validation = validateSameProduct(
      original_items,
      requested_items
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const originalTotal = original_items.reduce(
      (sum, item) => sum + item.original_price * item.quantity,
      0
    )

    const requestedTotal = requested_items.reduce(
      (sum, item) =>
        sum + (item.current_price ?? item.original_price) * item.quantity,
      0
    )

    const { data: exchange, error } = await supabaseAdmin
      .from("exchange_requests")
      .insert({
        order_id,
        user_id,
        original_items,
        requested_items,
        exchange_type,
        reason,
        description: description ?? "",
        original_total: originalTotal,
        requested_total: requestedTotal,
        price_difference: 0,
        settlement_type: "NO_CHARGE",
        settlement_status: "COMPLETED",
        status: "pending",
        is_same_product: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: exchange,
      message:
        "Exchange request submitted successfully. No payment required.",
      nextAction: "WAIT_APPROVAL",
    })
  } catch (error: unknown) {
    console.error("❌ Exchange API Error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                           GET – FETCH EXCHANGES                              */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const orderId = searchParams.get("orderId")

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("exchange_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error: unknown) {
    console.error("❌ Get Exchanges Error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
