// components/AdminProtectedRoute.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { verifyAdminToken } from "@/lib/admin-auth"

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAuth()
  }, [pathname])

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const expiresStr = localStorage.getItem("admin_expires")

      if (!token || !expiresStr) {
        // No token, redirect to login
        router.push("/login")
        return
      }

      // Check if token is expired
      const expires = new Date(expiresStr)
      if (expires < new Date()) {
        // Token expired, clear and redirect
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        localStorage.removeItem("admin_expires")
        router.push("/login")
        return
      }

      // Verify token with server
      const adminData = await verifyAdminToken(token)
      
      if (!adminData) {
        // Token invalid, clear and redirect
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        localStorage.removeItem("admin_expires")
        router.push("/login")
        return
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}