// app/api/admin/stats/route.ts

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ShippingAddress {
  first_name?: string
  last_name?: string
}

interface RecentOrderRow {
  id: string
  order_number: string | null
  total: number | null
  order_status: string
  payment_status: string
  created_at: string
  shipping_address: ShippingAddress | null
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  amount: number
  status: string
  paymentStatus: string
  date: string
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
  image_url: string
  price: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch statistics"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    console.log("📊 Stats API called")

    /* ----------------------------- PRODUCTS -------------------------------- */

    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    /* ------------------------------ ORDERS --------------------------------- */

    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    /* ----------------------------- REVENUE --------------------------------- */

    let totalRevenue = 0

    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")

    if (paidOrders) {
      totalRevenue = paidOrders.reduce(
        (sum, order) => sum + (order.total ?? 0),
        0
      )
    }

    /* --------------------------- LOW STOCK --------------------------------- */

    let lowStockProducts: LowStockProduct[] = []

    const { data: lowStock } = await supabase
      .from("products")
      .select("id, name, stock, image_url, price")
      .lte("stock", 5)
      .gt("stock", 0)
      .order("stock", { ascending: true })
      .limit(10)

    if (lowStock) {
      lowStockProducts = lowStock
    }

    /* --------------------------- RECENT ORDERS ----------------------------- */

    let recentOrders: RecentOrder[] = []

    const { data: orders } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, order_status, payment_status, created_at, shipping_address"
      )
      .order("created_at", { ascending: false })
      .limit(5)

    if (orders) {
      recentOrders = (orders as RecentOrderRow[]).map((order) => ({
        id: order.id,
        orderNumber: order.order_number ?? order.id,
        customer:
          `${order.shipping_address?.first_name ?? ""} ${
            order.shipping_address?.last_name ?? ""
          }`.trim() || "N/A",
        amount: order.total ?? 0,
        status: order.order_status,
        paymentStatus: order.payment_status,
        date: order.created_at,
      }))
    }

    /* -------------------------- CUSTOMERS ---------------------------------- */

    let totalCustomers = 0

    const { data, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (!usersError && data?.users) {
      totalCustomers = data.users.length
    }

    /* ----------------------------- RESPONSE -------------------------------- */

    const stats = {
      totalProducts: totalProducts ?? 0,
      totalOrders: totalOrders ?? 0,
      totalCustomers,
      totalRevenue: Math.round(totalRevenue),
      lowStockProducts,
      recentOrders,
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error: unknown) {
    console.error("❌ Stats API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        data: {
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          lowStockProducts: [],
          recentOrders: [],
        },
      },
      { status: 500 }
    )
  }
}
