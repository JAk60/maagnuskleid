// app/api/products/route.ts
// STRICT + ESLINT CLEAN (NO any, NO unsafe casts)

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ProductPayload {
  id?: string
  name: string
  description?: string
  price: number
  image_url?: string
  category: string
  sizes?: string[]
  colors?: string[]
  stock: number
  gender: string
}

interface ProductUpdatePayload extends Partial<ProductPayload> {
  id: string
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected products API error"
}

function isProductPayload(body: unknown): body is ProductPayload {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<ProductPayload>

  return (
    typeof b.name === "string" &&
    typeof b.price === "number" &&
    typeof b.category === "string" &&
    typeof b.gender === "string" &&
    typeof b.stock === "number"
  )
}

function isProductUpdatePayload(body: unknown): body is ProductUpdatePayload {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<ProductUpdatePayload>

  return typeof b.id === "string"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  try {
    console.log("📦 Public Products API called")

    const { searchParams } = new URL(request.url)

    const limit = searchParams.get("limit")
    const gender = searchParams.get("gender")
    const category = searchParams.get("category")
    const inStock = searchParams.get("inStock")

    let query = supabase.from("products").select("*")

    if (gender) query = query.eq("gender", gender)
    if (category) query = query.eq("category", category)
    if (inStock === "true") query = query.gt("stock", 0)
    if (limit) query = query.limit(Number(limit))

    query = query.order("created_at", { ascending: false })

    const { data: products, error } = await query

    if (error) throw error

    const productsWithDetails = await Promise.all(
      (products ?? []).map(async (product) => {
        const { data: images } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", product.id)
          .order("display_order", { ascending: true })

        let sizeChart: unknown[] = []

        if (product.has_size_chart) {
          const { data: chart } = await supabase
            .from("size_charts")
            .select("*")
            .eq("product_id", product.id)
            .order("size", { ascending: true })

          sizeChart = chart ?? []
        }

        return {
          ...product,
          images: images ?? [],
          size_chart: sizeChart,
        }
      })
    )

    return NextResponse.json(productsWithDetails, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    })
  } catch (error: unknown) {
    console.error("❌ Public Products API Error:", error)

    return NextResponse.json(
      {
        error: getErrorMessage(error),
        products: [],
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new product...")

    const rawBody: unknown = await request.json()

    if (!isProductPayload(rawBody)) {
      return NextResponse.json(
        { error: "Invalid product payload" },
        { status: 400 }
      )
    }

    const body = rawBody

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: body.name,
        description: body.description ?? "",
        price: body.price,
        image_url: body.image_url ?? "",
        category: body.category,
        sizes: body.sizes ?? ["S", "M", "L", "XL"],
        colors: body.colors ?? ["Black"],
        stock: body.stock,
        gender: body.gender,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { success: true, product: data },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("❌ Create product error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                     PUT                                    */
/* -------------------------------------------------------------------------- */

export async function PUT(request: Request) {
  try {
    console.log("✏️ Updating product...")

    const rawBody: unknown = await request.json()

    if (!isProductUpdatePayload(rawBody)) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const { id, ...updates } = rawBody

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { success: true, product: data },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("❌ Update product error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

export async function DELETE(request: Request) {
  try {
    console.log("🗑️ Deleting product...")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("❌ Delete product error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
