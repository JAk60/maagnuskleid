// ========================================
// app/api/inventory/route.ts
// STRICT + ESLINT CLEAN
// ========================================

import { NextResponse } from "next/server"
import {
  getLowStockProducts,
  getOutOfStockProducts,
  updateProductStock,
  restoreProductStock,
  validateStock,
} from "@/lib/inventory"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InventoryItem {
  product_id: number
  quantity: number
  size?: string
  color?: string
}

type InventoryAction = "validate" | "update" | "restore"

interface InventoryRequestBody {
  action: InventoryAction
  items: InventoryItem[]
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unexpected inventory error"
}

function isInventoryRequestBody(
  body: unknown
): body is InventoryRequestBody {
  if (!body || typeof body !== "object") return false

  const b = body as Partial<InventoryRequestBody>

  return (
    (b.action === "validate" ||
      b.action === "update" ||
      b.action === "restore") &&
    Array.isArray(b.items)
  )
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

// GET - Get inventory status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'low-stock' | 'out-of-stock'

    if (type === "low-stock") {
      const products = await getLowStockProducts(5)
      return NextResponse.json({ success: true, data: products })
    }

    if (type === "out-of-stock") {
      const products = await getOutOfStockProducts()
      return NextResponse.json({ success: true, data: products })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid type parameter. Use "low-stock" or "out-of-stock"',
      },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error("❌ Inventory API Error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

// POST - Validate / Update / Restore stock
export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json()

    if (!isInventoryRequestBody(rawBody)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { action, items } = rawBody

    if (action === "validate") {
      const result = await validateStock(items)
      return NextResponse.json({
        success: true,
        valid: result.valid,
        errors: result.errors,
      })
    }

    if (action === "update") {
      const result = await updateProductStock(items)
      return NextResponse.json({
        success: result.success,
        errors: result.errors,
      })
    }

    if (action === "restore") {
      const result = await restoreProductStock(items)
      return NextResponse.json({
        success: result.success,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use "validate", "update", or "restore"',
      },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error("❌ Inventory Action Error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
