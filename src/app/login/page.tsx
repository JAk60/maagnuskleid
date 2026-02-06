"use client"

import type React from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { adminLogin } from "@/lib/admin-auth"
import toast from "react-hot-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login, signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isAdminEmail =
        email.toLowerCase().includes("@maagnuskleid.com") ||
        email.toLowerCase() === "admin@maagnuskleid.com"

      if (isAdminEmail) {
        try {
          const { admin, token, expiresAt } = await adminLogin(email, password)

          localStorage.setItem("admin_token", token)
          localStorage.setItem("admin_user", JSON.stringify(admin))
          localStorage.setItem("admin_expires", expiresAt.toISOString())

          router.push("/admin/dashboard")
          return
        } catch {
          setError("Invalid admin credentials")
          setIsLoading(false)
          return
        }
      }

      if (isSignup) {
        await signup(email, password, name)
        toast.success("Account created! Please check your email to confirm.")
      } else {
        await login(email, password)
      }

      router.push("/")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {isSignup ? "Join Maagnuskleid today" : "Sign in to your account"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                required
              />
              {email.toLowerCase().includes("@maagnuskleid.com") && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  🔒 Admin account detected
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                required
                minLength={6}
              />
              {isSignup && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Loading..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignup(!isSignup)
                  setEmail("")
                  setPassword("")
                  setName("")
                  setError("")
                }}
                className="text-primary hover:underline font-semibold"
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
