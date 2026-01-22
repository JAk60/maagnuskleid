// app/api/admin/analytics/route.ts

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface OrderItem {
  product_id: number
  quantity: number
  subtotal: number
  product_name?: string
  product_image?: string
}

interface Order {
  order_number: string
  total: number
  created_at: string
  payment_status: string
  items?: OrderItem[]
  shipping_address?: {
    first_name?: string
    last_name?: string
  }
}

interface ProductSales {
  count: number
  revenue: number
  product: OrderItem
}

interface TopProduct {
  product_id: number
  sales_count: number
  revenue: number
  name?: string
  image_url?: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch analytics"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number(searchParams.get("days") ?? 30)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    /* ----------------------------- Total Products ---------------------------- */

    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    /* ------------------------------- Orders ---------------------------------- */

    const { data: orders, count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .gte("created_at", startDate.toISOString())

    const typedOrders = (orders ?? []) as Order[]

    /* ------------------------------ Revenue ---------------------------------- */

    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", startDate.toISOString())

    const totalRevenue =
      paidOrders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

    /* ---------------------------- Total Customers ---------------------------- */

    let totalCustomers = 0
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) throw error
      totalCustomers = data.users.length
    } catch (err: unknown) {
      console.error("❌ Error fetching users:", err)
    }

    /* --------------------------- Revenue Growth ------------------------------ */

    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    const { data: previousPaidOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", previousStartDate.toISOString())
      .lt("created_at", startDate.toISOString())

    const previousRevenue =
      previousPaidOrders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    /* ----------------------------- Top Products ------------------------------ */

    const productSales: Record<number, ProductSales> = {}

    for (const order of typedOrders) {
      for (const item of order.items ?? []) {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            count: 0,
            revenue: 0,
            product: item,
          }
        }

        productSales[item.product_id].count += item.quantity
        productSales[item.product_id].revenue += item.subtotal
      }
    }

    const topProducts: TopProduct[] = Object.entries(productSales)
      .map(([id, data]) => ({
        product_id: Number(id),
        sales_count: data.count,
        revenue: data.revenue,
        name: data.product.product_name,
        image_url: data.product.product_image,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    /* ----------------------------- Recent Sales ------------------------------ */

    const recentSales = typedOrders.slice(0, 5).map(order => ({
      order_number: order.order_number,
      customer_name:
        `${order.shipping_address?.first_name ?? ""} ${
          order.shipping_address?.last_name ?? ""
        }`.trim() || "N/A",
      total: order.total,
      items_count: order.items?.length ?? 0,
      created_at: order.created_at,
    }))

    /* --------------------------- Monthly Revenue ----------------------------- */

    const monthlyRevenue: {
      month: string
      revenue: number
      orders: number
    }[] = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i, 1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const { data: monthOrders } = await supabase
        .from("orders")
        .select("total")
        .eq("payment_status", "paid")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", monthEnd.toISOString())

      const monthRevenue =
        monthOrders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0

      monthlyRevenue.push({
        month: monthStart.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        revenue: monthRevenue,
        orders: monthOrders?.length ?? 0,
      })
    }

    /* ------------------------------ Response -------------------------------- */

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: totalOrders ?? 0,
        totalCustomers,
        totalProducts: totalProducts ?? 0,
        revenueGrowth: Math.round(revenueGrowth),
        ordersGrowth: 0,
        customersGrowth: 0,
        topProducts,
        recentSales,
        monthlyRevenue,
      },
    })
  } catch (error: unknown) {
    console.error("❌ Analytics API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        data: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          customersGrowth: 0,
          topProducts: [],
          recentSales: [],
          monthlyRevenue: [],
        },
      },
      { status: 500 }
    )
  }
}
