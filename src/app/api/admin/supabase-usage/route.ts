// app/api/admin/supabase-usage/route.ts
// Uses Supabase client directly to calculate usage

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to fetch Supabase usage"
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    // Free tier limits
    const FREE_TIER_LIMITS = {
      storage: 500, // MB
      rows: 500_000,
      bandwidth: 5, // GB
      databaseSize: 500, // MB
    }

    const tables = [
      "products",
      "orders",
      "addresses",
      "admin_users",
      "admin_sessions",
    ]

    let totalRows = 0
    const tableCounts: Record<string, number> = {}

    // Fetch row counts
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })

        tableCounts[table] = count ?? 0
        totalRows += count ?? 0
      } catch (err) {
        console.warn(`Could not fetch count for ${table}:`, err)
        tableCounts[table] = 0
      }
    }

    // Auth users count (admin API)
    let usersCount = 0
    try {
      const { data } = await supabase.auth.admin.listUsers()
      usersCount = data?.users?.length ?? 0
      totalRows += usersCount
    } catch (err) {
      console.warn("Could not fetch users count:", err)
    }

    // Estimate storage: ~1KB per row
    const estimatedStorageMB = Number(
      ((totalRows * 1) / 1024).toFixed(2)
    )

    const data = {
      rows: {
        used: totalRows,
        limit: FREE_TIER_LIMITS.rows,
        percentage: (totalRows / FREE_TIER_LIMITS.rows) * 100,
      },
      storage: {
        used: estimatedStorageMB,
        limit: FREE_TIER_LIMITS.storage,
        percentage:
          (estimatedStorageMB / FREE_TIER_LIMITS.storage) * 100,
        unit: "MB",
        note: "Estimated based on row count (1KB/row avg)",
      },
      bandwidth: {
        used: 0,
        limit: FREE_TIER_LIMITS.bandwidth,
        percentage: 0,
        unit: "GB",
        note:
          "Bandwidth usage not available via API. Check Supabase dashboard.",
      },
      tables: {
        ...tableCounts,
        auth_users: usersCount,
      },
      breakdown: {
        products: tableCounts.products ?? 0,
        orders: tableCounts.orders ?? 0,
        addresses: tableCounts.addresses ?? 0,
        admins: tableCounts.admin_users ?? 0,
        users: usersCount,
      },
      plan: "free",
      lastUpdated: new Date().toISOString(),
      recommendations: [] as string[],
    }

    // Recommendations
    if (data.rows.percentage > 80) {
      data.recommendations.push(
        "⚠️ Database rows exceeding 80% - consider archiving old data"
      )
    }

    if (data.storage.percentage > 80) {
      data.recommendations.push(
        "⚠️ Storage usage high - optimize data storage"
      )
    }

    if (totalRows > 100_000) {
      data.recommendations.push(
        "💡 Consider implementing data archival strategy"
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error("Supabase Usage Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        data: {
          rows: { used: 0, limit: 500_000 },
          storage: { used: 0, limit: 500 },
          bandwidth: { used: 0, limit: 5 },
          tables: {},
        },
      },
      { status: 500 }
    )
  }
}
