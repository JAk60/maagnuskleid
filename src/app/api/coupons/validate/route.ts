// src/app/api/coupons/validate/route.ts
// Validates a coupon code for a given user + cart total + payment method

import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ValidateBody {
  code: string
  user_id: string
  cart_total: number        // total BEFORE discount
  payment_method: "razorpay" | "cod"
}

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: "flat" | "percentage"
  discount_value: number
  min_order_amount: number
  max_total_uses: number | null
  max_uses_per_user: number
  used_count: number
  allow_on_cod: boolean
  is_active: boolean
  valid_from: string
  valid_until: string | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Validation failed"
}

function isValidateBody(body: unknown): body is ValidateBody {
  if (!body || typeof body !== "object") return false
  const b = body as Partial<ValidateBody>
  return (
    typeof b.code === "string" &&
    typeof b.user_id === "string" &&
    typeof b.cart_total === "number" &&
    (b.payment_method === "razorpay" || b.payment_method === "cod")
  )
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()

    if (!isValidateBody(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { code, user_id, cart_total, payment_method } = rawBody
    const upperCode = code.trim().toUpperCase()

    /* ------------------------- FETCH COUPON ----------------------------- */

    const { data: coupon, error: couponError } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", upperCode)
      .single<Coupon>()

    if (couponError || !coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon code" },
        { status: 400 }
      )
    }

    /* ------------------------- ACTIVE CHECK ------------------------------ */

    if (!coupon.is_active) {
      return NextResponse.json(
        { success: false, error: "This coupon is no longer active" },
        { status: 400 }
      )
    }

    /* ------------------------- DATE VALIDITY ----------------------------- */

    const now = new Date()

    if (new Date(coupon.valid_from) > now) {
      return NextResponse.json(
        { success: false, error: "This coupon is not valid yet" },
        { status: 400 }
      )
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json(
        { success: false, error: "This coupon has expired" },
        { status: 400 }
      )
    }

    /* ------------------------- COD CHECK --------------------------------- */

    if (payment_method === "cod" && !coupon.allow_on_cod) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon is not valid for Cash on Delivery orders. Please pay online to use it.",
        },
        { status: 400 }
      )
    }

    /* ------------------------- MIN ORDER --------------------------------- */

    if (cart_total < coupon.min_order_amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order of ₹${coupon.min_order_amount.toLocaleString()} required for this coupon`,
        },
        { status: 400 }
      )
    }

    /* ------------------------- TOTAL USES -------------------------------- */

    if (
      coupon.max_total_uses !== null &&
      coupon.used_count >= coupon.max_total_uses
    ) {
      return NextResponse.json(
        { success: false, error: "This coupon has reached its usage limit" },
        { status: 400 }
      )
    }

    /* ------------------------- PER-USER USES ----------------------------- */

    const { count: userUsageCount, error: usageError } = await supabaseAdmin
      .from("coupon_usages")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", user_id)

    if (usageError) throw usageError

    if (
      coupon.max_uses_per_user !== null &&
      (userUsageCount ?? 0) >= coupon.max_uses_per_user
    ) {
      return NextResponse.json(
        { success: false, error: "You have already used this coupon" },
        { status: 400 }
      )
    }

    /* ------------------------- CALCULATE DISCOUNT ----------------------- */

    let discountAmount = 0

    if (coupon.discount_type === "flat") {
      discountAmount = Math.min(coupon.discount_value, cart_total)
    } else {
      // percentage
      discountAmount = Math.round((cart_total * coupon.discount_value) / 100)
      discountAmount = Math.min(discountAmount, cart_total) // never exceed cart total
    }

    const finalTotal = cart_total - discountAmount

    /* ------------------------- SUCCESS ---------------------------------- */

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discount_amount: discountAmount,
      final_total: finalTotal,
      message:
        coupon.discount_type === "flat"
          ? `₹${discountAmount} discount applied!`
          : `${coupon.discount_value}% discount applied! You save ₹${discountAmount}`,
    })
  } catch (error: unknown) {
    console.error("❌ Coupon validate error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}