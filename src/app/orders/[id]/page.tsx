"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getOrderById, type Order } from "@/lib/supabase-orders"
import Link from "next/link"
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowLeftRight,
} from "lucide-react"
import ExchangeRequestForm from "@/components/ExchangeRequestForm"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoggedIn, user } = useAuth()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showExchangeForm, setShowExchangeForm] = useState(false) // ✅ NEW

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    loadOrder()
  }, [isLoggedIn, orderId])

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId)

      if (orderData.user_id !== user?.id) {
        setError("You don't have permission to view this order")
        return
      }

      setOrder(orderData)
    } catch (err) {
      console.error(err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-500" />
      case "confirmed":
      case "processing":
        return <Package className="w-6 h-6 text-blue-500" />
      case "shipped":
        return <Truck className="w-6 h-6 text-purple-500" />
      case "delivered":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      default:
        return <Clock className="w-6 h-6 text-gray-500" />
    }
  }

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getOrderTimeline = () => {
    if (!order) return []

    const timeline = [
      {
        status: "Order Placed",
        description: "Your order has been placed successfully",
        timestamp: order.created_at,
        completed: true,
      },
    ]

    if (order.paid_at) {
      timeline.push({
        status: "Payment Confirmed",
        description: "Payment received and verified",
        timestamp: order.paid_at,
        completed: true,
      })
    }

    if (["confirmed", "processing", "shipped", "delivered"].includes(order.order_status)) {
      timeline.push({
        status: "Order Confirmed",
        description: "Your order has been confirmed",
        timestamp: order.updated_at,
        completed: true,
      })
    }

    if (order.shipped_at) {
      timeline.push({
        status: "Shipped",
        description: "Your order has been shipped",
        timestamp: order.shipped_at,
        completed: true,
      })
    }

    if (order.delivered_at) {
      timeline.push({
        status: "Delivered",
        description: "Order delivered successfully",
        timestamp: order.delivered_at,
        completed: true,
      })
    }

    return timeline
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Order not found"}</p>
          <Link
            href="/orders"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const timeline = getOrderTimeline()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.order_number}</h1>
              <p className="text-muted-foreground">
                Placed on{" "}
                {new Date(order.created_at!).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  order.order_status
                )}`}
              >
                {order.order_status.toUpperCase()}
              </span>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(
                  order.payment_status
                )}`}
              >
                Payment: {order.payment_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline + Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {getStatusIcon(order.order_status)}
                Order Status
              </h2>

              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.completed ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        {item.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {index < timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            item.completed ? "bg-green-200" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-8">
                      <h3 className="font-semibold mb-1">{item.status}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>

                      {item.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">Order Items</h2>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-border last:border-0"
                  >
                    <img
                      src={item.product_image || "/placeholder.svg"}
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">₹{item.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Exchange Button + Form */}
            {order.order_status === "delivered" && (
              <button
                onClick={() => setShowExchangeForm(!showExchangeForm)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-5 h-5" />
                Request Exchange
              </button>
            )}

            {showExchangeForm && (
              <div className="border border-border rounded-lg p-6 mt-4">
                <ExchangeRequestForm
                  order={order}
                  onClose={() => setShowExchangeForm(false)}
                  onSuccess={() => setShowExchangeForm(false)}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shipping_cost === 0
                      ? "Free"
                      : `₹${order.shipping_cost.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>

              <div className="text-sm space-y-1">
                <p className="font-semibold">
                  {order.shipping_address.first_name}{" "}
                  {order.shipping_address.last_name}
                </p>

                <p className="text-muted-foreground">
                  {order.shipping_address.phone}
                </p>

                <p className="text-muted-foreground mt-2">
                  {order.shipping_address.address_line1}
                  {order.shipping_address.address_line2 &&
                    `, ${order.shipping_address.address_line2}`}
                </p>

                <p className="text-muted-foreground">
                  {order.shipping_address.city},{" "}
                  {order.shipping_address.state}{" "}
                  {order.shipping_address.postal_code}
                </p>

                <p className="text-muted-foreground">
                  {order.shipping_address.country}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Payment Information</h2>

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-semibold capitalize">
                    {order.payment_method}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>

                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentStatusColor(
                      order.payment_status
                    )}`}
                  >
                    {order.payment_status.toUpperCase()}
                  </span>
                </div>

                {order.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-mono text-xs">
                      {order.razorpay_payment_id.slice(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
