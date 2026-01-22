// app/api/admin/orders/route.ts
// STRICT + ESLINT CLEAN (WITH DELIVERY DATE FIX)

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

interface UpdateOrderBody {
  id: string
  order_status?: OrderStatus
  shipped_at?: string
  delivered_at?: string
  [key: string]: unknown
}

interface BulkUpdateBody {
  orderIds: string[]
  order_status: OrderStatus
}

function isUpdateOrderBody(value: unknown): value is UpdateOrderBody {
  return typeof value === "object" && value !== null && "id" in value
}

function isBulkUpdateBody(value: unknown): value is BulkUpdateBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "orderIds" in value &&
    "order_status" in value
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    const status = searchParams.get("status")

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("order_status", status)
    }

    if (limit) {
      query = query.limit(Number(limit))
    }

    const { data: orders, error } = await query
    if (error) throw error

    // ✅ WRAP RESPONSE PROPERLY
    return NextResponse.json({
      success: true,
      data: orders ?? []
    }, {
      status: 200,
      headers: { "Cache-Control": "no-store, must-revalidate" },
    })
  } catch (error: unknown) {
    console.error("❌ Admin Orders API Error:", error)

    return NextResponse.json({
      success: false,
      error: getErrorMessage(error),
      data: [] // ✅ Include empty data array on error
    }, { 
      status: 500 
    })
  }
}

/* -------------------------------------------------------------------------- */
/*                                    PUT                                     */
/* -------------------------------------------------------------------------- */

export async function PUT(request: Request) {
  try {
    const rawBody = await request.json()

    if (!isUpdateOrderBody(rawBody)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { id, order_status, ...rest } = rawBody

    const updates: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    }

    if (order_status) {
      updates.order_status = order_status

      if (order_status === "shipped" && !updates.shipped_at) {
        updates.shipped_at = new Date().toISOString()
      }

      if (order_status === "delivered" && !updates.delivered_at) {
        updates.delivered_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { success: true, order: data },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("❌ Update order error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PATCH                                    */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: Request) {
  try {
    const rawBody = await request.json()

    if (!isBulkUpdateBody(rawBody)) {
      return NextResponse.json(
        { error: "Invalid bulk update payload" },
        { status: 400 }
      )
    }

    const { orderIds, order_status } = rawBody

    const updates: Record<string, unknown> = {
      order_status,
      updated_at: new Date().toISOString(),
    }

    if (order_status === "shipped") {
      updates.shipped_at = new Date().toISOString()
    }

    if (order_status === "delivered") {
      updates.delivered_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .in("id", orderIds)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      updated: data.length,
      orders: data,
    })
  } catch (error: unknown) {
    console.error("❌ Bulk update error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}