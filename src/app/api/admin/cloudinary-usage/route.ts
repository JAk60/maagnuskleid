// app/api/admin/cloudinary-usage/route.ts

import { NextResponse } from "next/server"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface CloudinaryUsage {
  resources?: number
  plan?: string
  storage?: {
    usage?: number
  }
  bandwidth?: {
    usage?: number
  }
  transformations?: {
    usage?: number
  }
}

function isCloudinaryUsage(data: unknown): data is CloudinaryUsage {
  return typeof data === "object" && data !== null
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    console.log("📊 Cloudinary Usage API called")

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        success: true,
        message: "Cloudinary not configured",
        data: {
          images: { used: 0, limit: 25000 },
          storage: { used: 0, limit: 25 },
          bandwidth: { used: 0, limit: 25 },
          transformations: { used: 0, limit: 25000 },
        },
      })
    }

    /* ----------------------------- API Request ------------------------------ */

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Cloudinary API ${response.status}: ${text}`)
    }

    const rawUsage = await response.json()

    if (!isCloudinaryUsage(rawUsage)) {
      throw new Error("Invalid Cloudinary usage response")
    }

    const usage = rawUsage

    /* ------------------------------ Constants ------------------------------- */

    const FREE_TIER_LIMITS = {
      images: 25000,
      storage: 25, // GB
      bandwidth: 25, // GB
      transformations: 25000,
    }

    /* ---------------------------- Calculations ------------------------------ */

    const storageUsedGB =
      (usage.storage?.usage ?? 0) / (1024 * 1024 * 1024)

    const bandwidthUsedGB =
      (usage.bandwidth?.usage ?? 0) / (1024 * 1024 * 1024)

    const data = {
      images: {
        used: usage.resources ?? 0,
        limit: FREE_TIER_LIMITS.images,
        percentage:
          ((usage.resources ?? 0) / FREE_TIER_LIMITS.images) * 100,
      },
      storage: {
        used: Number(storageUsedGB.toFixed(2)),
        limit: FREE_TIER_LIMITS.storage,
        percentage:
          (storageUsedGB / FREE_TIER_LIMITS.storage) * 100,
      },
      bandwidth: {
        used: Number(bandwidthUsedGB.toFixed(2)),
        limit: FREE_TIER_LIMITS.bandwidth,
        percentage:
          (bandwidthUsedGB / FREE_TIER_LIMITS.bandwidth) * 100,
      },
      transformations: {
        used: usage.transformations?.usage ?? 0,
        limit: FREE_TIER_LIMITS.transformations,
        percentage:
          ((usage.transformations?.usage ?? 0) /
            FREE_TIER_LIMITS.transformations) *
          100,
      },
      plan: usage.plan ?? "free",
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: unknown) {
    console.error("❌ Cloudinary Usage API Error:", error)

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch Cloudinary usage"

    return NextResponse.json(
      {
        success: false,
        error: message,
        data: {
          images: { used: 0, limit: 25000 },
          storage: { used: 0, limit: 25 },
          bandwidth: { used: 0, limit: 25 },
          transformations: { used: 0, limit: 25000 },
        },
      },
      { status: 200 } // keep dashboard safe
    )
  }
}
