// app/api/admin/logout/route.ts

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminLogout } from "@/lib/admin-auth"

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Logout failed"
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST() {
  try {
    // Get token from cookie
    const cookieStore = cookies()
    const token = (await cookieStore).get("admin_token")?.value

    if (token) {
      // Clean up server-side session
      await adminLogout(token)
    }

    // Clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error: unknown) {
    console.error("Logout error:", error)

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
