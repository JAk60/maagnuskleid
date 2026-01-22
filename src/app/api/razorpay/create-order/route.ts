// ========================================
// app/api/razorpay/create-order/route.ts
// STRICT + ESLINT CLEAN (NO any, NO unsafe access)
// ========================================

import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { convertToPaise } from "@/lib/razorpay"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface RazorpayOrderPayload {
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

interface RazorpayErrorShape {
  error?: {
    description?: string
    reason?: string
  }
}

/* -------------------------------------------------------------------------- */
/*                              RAZORPAY CLIENT                               */
/* -------------------------------------------------------------------------- */

let razorpayInstance: Razorpay | null = null

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured")
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayInstance
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function isRazorpayOrderPayload(body: unknown): body is RazorpayOrderPayload {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<RazorpayOrderPayload>

  return (
    typeof b.amount === "number" &&
    typeof b.receipt === "string"
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected Razorpay error"
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    /* ----------------------------- RATE LIMIT ----------------------------- */

    const identifier = getClientIdentifier(request)

    const rateLimitResult = rateLimit(`payment:${identifier}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!rateLimitResult.success) {
      const resetInMinutes = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000 / 60
      )

      return NextResponse.json(
        {
          success: false,
          error: `Too many payment attempts. Please try again in ${resetInMinutes} minutes.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      )
    }

    /* ----------------------------- BODY PARSE ----------------------------- */

    const rawBody: unknown = await request.json()

    if (!isRazorpayOrderPayload(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      )
    }

    const {
      amount,
      currency = "INR",
      receipt,
      notes,
    } = rawBody

    /* ----------------------------- VALIDATION ----------------------------- */

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      )
    }

    if (amount > 1_000_000) {
      return NextResponse.json(
        { success: false, error: "Order amount exceeds maximum limit" },
        { status: 400 }
      )
    }

    /* -------------------------- CREATE ORDER ----------------------------- */

    const razorpay = getRazorpay()

    const order = await razorpay.orders.create({
      amount: convertToPaise(amount),
      currency,
      receipt,
      notes,
    })

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    )
  } catch (error: unknown) {
    console.error("Razorpay order creation error:", error)

    const maybeRazorpayError = error as RazorpayErrorShape

    if (maybeRazorpayError.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment gateway error: " +
            (maybeRazorpayError.error.description ??
              maybeRazorpayError.error.reason ??
              "Unknown error"),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
