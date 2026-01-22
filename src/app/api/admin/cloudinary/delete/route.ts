// app/api/admin/cloudinary/delete/route.ts

import { NextResponse } from "next/server"
import crypto from "crypto"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface DeleteRequestBody {
  publicId: string
}

interface CloudinaryDeleteResponse {
  result?: string
  error?: {
    message?: string
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Failed to delete from Cloudinary"
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown

    if (
      typeof body !== "object" ||
      body === null ||
      !("publicId" in body)
    ) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      )
    }

    const { publicId } = body as DeleteRequestBody

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("❌ Cloudinary credentials not configured")
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 }
      )
    }

    /* --------------------------- Generate Signature -------------------------- */

    const timestamp = Math.floor(Date.now() / 1000)

    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex")

    /* ------------------------------ Delete Call ------------------------------ */

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("signature", signature)
    formData.append("api_key", apiKey)
    formData.append("timestamp", String(timestamp))

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    )

    const result = (await response.json()) as CloudinaryDeleteResponse

    if (result.result === "ok") {
      console.log("✅ Deleted from Cloudinary:", publicId)
      return NextResponse.json({ success: true, result })
    }

    console.warn("⚠️ Cloudinary deletion response:", result)

    return NextResponse.json(
      {
        success: false,
        error: result.error?.message ?? "Deletion failed",
        result,
      },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error("❌ Cloudinary delete error:", error)

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
