// app/api/admin/customers/[userId]/orders/route.ts
// FIXED: Strict typing, no `any`, ESLint clean

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch customer orders"
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Next.js 15+ requires awaiting params
    const { userId } = await context.params

    console.log(`📦 Fetching orders for user: ${userId}`)

    /* ---------------------------- Pagination ---------------------------- */

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10))
    const offset = (page - 1) * limit

    /* --------------------------- Total Count ---------------------------- */

    const { count: totalCount, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) throw countError

    /* --------------------------- Orders Page ---------------------------- */

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = totalCount ?? 0

    return NextResponse.json(
      {
        orders: orders ?? [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    )
  } catch (error: unknown) {
    console.error("❌ Customer Orders API Error:", error)

    return NextResponse.json(
      {
        orders: [],
        error: getErrorMessage(error),
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      },
      { status: 500 }
    )
  }
}
