// app/api/admin/customers/route.ts
// FIXED: Strict TypeScript, no `any`, ESLint clean

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch customers"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    console.log("👥 Admin Customers API called")

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not configured")
      return NextResponse.json(
        {
          error:
            "Admin credentials not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
          customers: [],
        },
        { status: 500 }
      )
    }

    /* -------------------------- Fetch Auth Users -------------------------- */

    const { data, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error("❌ Error fetching users:", usersError)
      return NextResponse.json(
        {
          error: `Failed to fetch users: ${usersError.message}`,
          customers: [],
        },
        { status: 500 }
      )
    }

    const users = data?.users ?? []
    console.log(`✅ Found ${users.length} auth users`)

    if (users.length === 0) {
      return NextResponse.json([], {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      })
    }

    /* ---------------------- Build Customer Stats ------------------------- */

    const customersWithStats = await Promise.all(
      users.map(async user => {
        try {
          const { count: totalOrders, error: countError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)

          if (countError) throw countError

          const { data: paidOrders, error: paidError } = await supabase
            .from("orders")
            .select("total")
            .eq("user_id", user.id)
            .eq("payment_status", "paid")

          if (paidError) throw paidError

          const totalSpent =
            paidOrders?.reduce(
              (sum, order) => sum + (order.total ?? 0),
              0
            ) ?? 0

          const { data: lastOrder } = await supabase
            .from("orders")
            .select("created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            id: user.id,
            email: user.email ?? "No email",
            name:
              user.user_metadata?.name ??
              user.user_metadata?.full_name ??
              user.email?.split("@")[0] ??
              "Anonymous User",
            phone: user.user_metadata?.phone ?? user.phone ?? null,
            created_at: user.created_at,
            total_orders: totalOrders ?? 0,
            total_spent: totalSpent,
            last_order_date: lastOrder?.created_at ?? null,
          }
        } catch (userError: unknown) {
          console.error(`Error processing user ${user.id}:`, userError)

          return {
            id: user.id,
            email: user.email ?? "No email",
            name: user.user_metadata?.name ?? "Error loading",
            phone: null,
            created_at: user.created_at,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
          }
        }
      })
    )

    console.log(
      `✅ Processed ${customersWithStats.length} customers with stats`
    )

    return NextResponse.json(customersWithStats, {
      status: 200,
      headers: { "Cache-Control": "no-store, must-revalidate" },
    })
  } catch (error: unknown) {
    console.error("❌ Admin Customers API Error:", error)

    let errorMessage = getErrorMessage(error)

    if (
      error instanceof Error &&
      error.message.includes("service_role")
    ) {
      errorMessage =
        "Admin access requires SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        customers: [],
        hint: "Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local file",
      },
      { status: 500 }
    )
  }
}
