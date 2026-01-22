// app/api/admin/fix-delivery-dates/route.ts
// Admin utility to fix missing delivery dates (STRICT TS)

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type FixAction = "fix_single" | "fix_all"

interface FixDeliveryBody {
  action: FixAction
  orderId?: string
  deliveryDate?: string
}

function isFixDeliveryBody(value: unknown): value is FixDeliveryBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "action" in value
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected server error"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    console.log("🔍 Checking for orders with missing delivery dates...")

    const { data: missingDates, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_status, created_at, updated_at, delivered_at, shipped_at"
      )
      .eq("order_status", "delivered")
      .is("delivered_at", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: missingDates?.length ?? 0,
      orders: missingDates ?? [],
    })
  } catch (error: unknown) {
    console.error("❌ Error checking delivery dates:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()

    if (!isFixDeliveryBody(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { action, orderId, deliveryDate } = rawBody

    /* -------------------------- FIX SINGLE ORDER -------------------------- */

    if (action === "fix_single") {
      if (!orderId) {
        return NextResponse.json(
          { success: false, error: "orderId is required" },
          { status: 400 }
        )
      }

      const timestamp = deliveryDate ?? new Date().toISOString()

      const { data: order } = await supabase
        .from("orders")
        .select("order_number, shipped_at")
        .eq("id", orderId)
        .single()

      const updates: Record<string, string> = {
        delivered_at: timestamp,
        updated_at: new Date().toISOString(),
      }

      if (order && !order.shipped_at) {
        updates.shipped_at = timestamp
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Fixed delivery date for order ${data.order_number}`)

      return NextResponse.json({
        success: true,
        message: "Delivery date updated successfully",
        order: data,
      })
    }

    /* --------------------------- FIX ALL ORDERS --------------------------- */

    if (action === "fix_all") {
      const { data: orders, error: fetchError } = await supabase
        .from("orders")
        .select("id, updated_at, created_at, shipped_at")
        .eq("order_status", "delivered")
        .is("delivered_at", null)

      if (fetchError) throw fetchError

      if (!orders || orders.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No orders need fixing",
          fixed: 0,
        })
      }

      let fixed = 0

      for (const order of orders) {
        const fallbackDate =
          order.updated_at ?? order.created_at ?? new Date().toISOString()

        const updates: Record<string, string> = {
          delivered_at: fallbackDate,
          updated_at: new Date().toISOString(),
        }

        if (!order.shipped_at) {
          updates.shipped_at = fallbackDate
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update(updates)
          .eq("id", order.id)

        if (!updateError) fixed++
        else console.error(`Failed to fix order ${order.id}`, updateError)
      }

      return NextResponse.json({
        success: true,
        message: `Fixed ${fixed} orders`,
        fixed,
        total: orders.length,
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error("❌ Error fixing delivery dates:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
