import { Suspense } from "react"
import OrderSuccessClient from "./OrderSuccessClient"

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  )
}
