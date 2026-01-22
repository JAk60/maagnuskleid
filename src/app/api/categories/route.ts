// app/api/categories/route.ts - PUBLIC API for frontend

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch categories"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

// GET - Fetch active categories only (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gender = searchParams.get("gender") as "Male" | "Female" | null

    let query = supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    // Filter by gender if provided
    if (gender) {
      query = query.eq("gender", gender)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error("Public categories fetch error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: categories ?? [],
    })
  } catch (error: unknown) {
    console.error("Categories API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
