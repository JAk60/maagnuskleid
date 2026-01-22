// app/api/admin/categories/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface CategoryPayload {
  id?: string
  name: string
  slug: string
  gender: "men" | "women" | "unisex"
  description?: string | null
  image_url?: string | null
  display_order?: number
  is_active?: boolean
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected error occurred"
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: categories ?? [],
    })
  } catch (error: unknown) {
    console.error("Admin GET categories error:", error)

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
    const body: CategoryPayload = await request.json()

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name: body.name,
        slug: body.slug,
        gender: body.gender,
        description: body.description ?? null,
        image_url: body.image_url ?? null,
        display_order: body.display_order ?? 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: category })
  } catch (error: unknown) {
    console.error("Admin POST categories error:", error)

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
    const body: CategoryPayload = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      )
    }

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: category })
  } catch (error: unknown) {
    console.error("Admin PUT categories error:", error)

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
        { success: false, error: "Category ID required" },
        { status: 400 }
      )
    }

    const { count, error: countError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${count} products`,
        },
        { status: 409 }
      )
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Admin DELETE categories error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
