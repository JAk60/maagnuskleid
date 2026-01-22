// ========================================
// app/api/webhooks/shiprocket/route.ts
// STRICT + ESLINT CLEAN (NO any, NO unsafe unknown)
// ========================================

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

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

interface ShiprocketWebhookPayload {
  order_id?: string
  awb?: string
  courier_name?: string
  current_status?: string
  shipment_status?: string
  edd?: string
  scans?: unknown[]
}

interface OrderRow {
  id: string
  order_number: string
  shipped_at: string | null
  delivered_at: string | null
  awb_number: string | null
  courier_name: string | null
}

/* -------------------------------------------------------------------------- */
/*                                TYPE GUARDS                                 */
/* -------------------------------------------------------------------------- */

function isShiprocketPayload(data: unknown): data is ShiprocketWebhookPayload {
  return typeof data === "object" && data !== null
}

/* -------------------------------------------------------------------------- */
/*                          STATUS MAPPING FUNCTION                            */
/* -------------------------------------------------------------------------- */

function mapShipRocketStatus(shipRocketStatus: string): string {
  const statusMap: Record<string, string> = {
    "PICKUP SCHEDULED": "ready_to_ship",
    "PICKED UP": "shipped",
    "IN TRANSIT": "shipped",
    "OUT FOR DELIVERY": "out_for_delivery",
    "DELIVERED": "delivered",
    "RTO IN TRANSIT": "return_in_transit",
    "RTO DELIVERED": "returned",
    "CANCELLED": "cancelled",
    "LOST": "lost",
    "DAMAGED": "damaged",
  }

  return statusMap[shipRocketStatus.toUpperCase()] ?? "processing"
}

/* -------------------------------------------------------------------------- */
/*                                   WEBHOOK                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient()

  try {
    const body: unknown = await req.json()

    if (!isShiprocketPayload(body)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    const {
      order_id,
      awb,
      courier_name,
      current_status,
      shipment_status,
      edd,
    } = body

    console.log("📦 Shiprocket webhook received:", {
      order_id,
      awb,
      current_status,
      shipment_status,
    })

    /* ---------------------------------------------------------------------- */
    /*                            FIND ORDER                                   */
    /* ---------------------------------------------------------------------- */

    let order: OrderRow | null = null

    if (order_id) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", order_id)
        .single()

      order = data as OrderRow | null
    }

    if (!order && awb) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("awb_number", awb)
        .single()

      order = data as OrderRow | null
    }

    if (!order) {
      console.error("❌ Order not found:", { order_id, awb })
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    /* ---------------------------------------------------------------------- */
    /*                            STATUS UPDATE                                */
    /* ---------------------------------------------------------------------- */

    const rawStatus = current_status ?? shipment_status ?? ""
    const newStatus = mapShipRocketStatus(rawStatus)

    const updateData: Record<string, unknown> = {
      shiprocket_status: rawStatus,
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === "shipped" && !order.shipped_at) {
      updateData.shipped_at = new Date().toISOString()
    }

    if (newStatus === "delivered" && !order.delivered_at) {
      updateData.delivered_at = new Date().toISOString()
    }

    if (edd) {
      updateData.expected_delivery_date = new Date(edd).toISOString()
    }

    if (awb && !order.awb_number) {
      updateData.awb_number = awb
    }

    if (courier_name && !order.courier_name) {
      updateData.courier_name = courier_name
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id)

    if (updateError) {
      console.error("❌ Order update failed:", updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    /* ---------------------------------------------------------------------- */
    /*                             LOG WEBHOOK                                 */
    /* ---------------------------------------------------------------------- */

    await supabase.from("shiprocket_logs").insert({
      order_id: order.id,
      action: "webhook_received",
      request_payload: body,
      status: "success",
    })

    console.log(
      `✅ Order ${order.order_number} updated → ${newStatus}`
    )

    return NextResponse.json({
      success: true,
      order_id: order.id,
      new_status: newStatus,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Shiprocket webhook error"

    console.error("❌ Shiprocket webhook error:", message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
