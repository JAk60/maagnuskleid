// app/api/admin/exchanges/route.ts
// STRICT + ESLINT CLEAN VERSION

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ExchangeStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "shipped"
  | "completed"
  | "cancelled"

interface ExchangeUpdateBody {
  id: string
  status?: ExchangeStatus
  admin_notes?: string
  tracking_number?: string
  rejection_reason?: string
}

function isExchangeUpdateBody(value: unknown): value is ExchangeUpdateBody {
  return typeof value === "object" && value !== null && "id" in value
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected server error"
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const orderId = searchParams.get("orderId")
    const limit = searchParams.get("limit")

    let query = supabaseAdmin
      .from("exchange_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") query = query.eq("status", status)
    if (userId) query = query.eq("user_id", userId)
    if (orderId) query = query.eq("order_id", orderId)
    if (limit) query = query.limit(Number(limit))

    const { data: exchanges, error } = await query
    if (error) throw error

    if (!exchanges || exchanges.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const enriched = await Promise.all(
      exchanges.map(async exchange => {
        try {
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("order_number, shipping_address")
            .eq("id", exchange.order_id)
            .single()

          const address = order?.shipping_address ?? {}
          const customerName =
            `${address.first_name ?? ""} ${address.last_name ?? ""}`.trim() ||
            "N/A"

          return {
            ...exchange,
            order_number:
              order?.order_number ?? exchange.order_number ?? "N/A",
            customer_name: customerName,
            customer_email: address.email ?? "N/A",
          }
        } catch (err: unknown) {
          console.error(
            `❌ Error enriching exchange ${exchange.id}:`,
            err
          )

          return {
            ...exchange,
            order_number: exchange.order_number ?? "N/A",
            customer_name: "N/A",
            customer_email: "N/A",
          }
        }
      })
    )

    return NextResponse.json({ success: true, data: enriched })
  } catch (error: unknown) {
    console.error("❌ Admin Get Exchanges Error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PUT                                      */
/* -------------------------------------------------------------------------- */

export async function PUT(request: Request) {
  try {
    const rawBody = await request.json()

    if (!isExchangeUpdateBody(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const {
      id,
      status,
      admin_notes,
      tracking_number,
      rejection_reason,
    } = rawBody

    const { data: current, error: fetchError } = await supabaseAdmin
      .from("exchange_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, error: "Exchange not found" },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updates.status = status

      switch (status) {
        case "approved":
          updates.approved_at = new Date().toISOString()
          break
        case "rejected":
          if (!rejection_reason && !admin_notes) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Rejection reason or admin notes required when rejecting",
              },
              { status: 400 }
            )
          }
          updates.rejected_at = new Date().toISOString()
          updates.rejection_reason = rejection_reason
          break
        case "shipped":
          if (!tracking_number && !current.tracking_number) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Tracking number required when marking as shipped",
              },
              { status: 400 }
            )
          }
          updates.shipped_at = new Date().toISOString()
          updates.tracking_number =
            tracking_number ?? current.tracking_number
          break
        case "completed":
          updates.completed_at = new Date().toISOString()
          break
      }
    }

    if (admin_notes) updates.admin_notes = admin_notes
    if (tracking_number) updates.tracking_number = tracking_number

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("exchange_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      data: updated,
      message: getSuccessMessage(status),
    })
  } catch (error: unknown) {
    console.error("❌ Admin Update Exchange Error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const reason = searchParams.get("reason")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exchange ID required" },
        { status: 400 }
      )
    }

    const { data: exchange } = await supabaseAdmin
      .from("exchange_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (!exchange) {
      return NextResponse.json(
        { success: false, error: "Exchange not found" },
        { status: 404 }
      )
    }

    if (!["pending", "approved"].includes(exchange.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel exchange with status: ${exchange.status}`,
        },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from("exchange_requests")
      .update({
        status: "cancelled",
        admin_notes: reason ?? "Cancelled by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      message: "Exchange cancelled successfully",
    })
  } catch (error: unknown) {
    console.error("❌ Admin Cancel Exchange Error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function getSuccessMessage(status?: ExchangeStatus): string {
  switch (status) {
    case "approved":
      return "Exchange approved successfully. Ready to ship."
    case "rejected":
      return "Exchange rejected. Customer will be notified."
    case "shipped":
      return "Exchange marked as shipped. Tracking sent."
    case "completed":
      return "Exchange completed successfully."
    default:
      return "Exchange updated successfully"
  }
}
