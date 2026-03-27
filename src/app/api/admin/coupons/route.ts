// src/app/api/admin/coupons/route.ts
// Full CRUD for coupon management

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface CouponPayload {
  id?: string
  code: string
  description?: string
  discount_type: "flat" | "percentage"
  discount_value: number
  min_order_amount?: number
  max_total_uses?: number | null
  max_uses_per_user?: number
  allow_on_cod?: boolean
  is_active?: boolean
  valid_from?: string
  valid_until?: string | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  // Supabase returns plain objects with a message property
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    return (error as Record<string, unknown>).message as string
  }
  console.error("Unhandled error shape:", JSON.stringify(error))
  return "An unexpected error occurred"
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error: unknown) {
    console.error("Admin GET coupons error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CouponPayload

    if (!body.code || !body.discount_type || !body.discount_value) {
      return NextResponse.json(
        { success: false, error: "Code, discount type and value are required" },
        { status: 400 }
      )
    }

    if (!["flat", "percentage"].includes(body.discount_type)) {
      return NextResponse.json(
        { success: false, error: "discount_type must be flat or percentage" },
        { status: 400 }
      )
    }

    if (body.discount_type === "percentage" && body.discount_value > 100) {
      return NextResponse.json(
        { success: false, error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: body.code.trim().toUpperCase(),
        description: body.description ?? null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_order_amount: body.min_order_amount ?? 0,
        max_total_uses: body.max_total_uses ?? null,
        max_uses_per_user: body.max_uses_per_user ?? 1,
        allow_on_cod: body.allow_on_cod ?? true,
        is_active: body.is_active ?? true,
        valid_from: body.valid_from ?? new Date().toISOString(),
        valid_until: body.valid_until ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    console.error("Admin POST coupons error:", error)
    const msg = getErrorMessage(error)
    // Unique constraint violation
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { success: false, error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PUT                                      */
/* -------------------------------------------------------------------------- */

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CouponPayload
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required" },
        { status: 400 }
      )
    }

    // Normalize code to uppercase if being updated
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase()
    }

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error("Admin PUT coupons error:", error)
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID required" },
        { status: 400 }
      )
    }

    // Check if coupon has been used — soft delete instead of hard delete
    const { data: coupon, error: fetchError } = await supabaseAdmin
      .from("coupons")
      .select("used_count, code")
      .eq("id", id)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    if (coupon && coupon.used_count > 0) {
      // Soft delete: just deactivate it so order history is preserved
      const { error } = await supabaseAdmin
        .from("coupons")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw new Error(error.message)

      return NextResponse.json({
        success: true,
        message: `Coupon ${coupon.code} deactivated (has ${coupon.used_count} uses, cannot be permanently deleted)`,
        deactivated: true,
      })
    }

    // Hard delete if never used
    const { error } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, message: "Coupon deleted" })
  } catch (error: unknown) {
    console.error("Admin DELETE coupons error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}