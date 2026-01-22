"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Calendar,
  ArrowRight
} from "lucide-react"
import { getOrderById, type Order } from "@/lib/supabase-orders"
import { useCart } from "@/context/cart-context"

export default function OrderSuccessClient() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const { clearCart } = useCart()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    clearCart()

    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId!)
      setOrder(orderData)
    } catch (err) {
      console.error("Failed to load order:", err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const getEstimatedDelivery = () => {
    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + 7)

    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Banner */}
      <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-xl text-green-50 mb-2">
            Thank you for your purchase
          </p>
          <p className="text-green-100">
            Your order has been successfully placed and is being processed
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Order Details */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                Order Number
              </h2>
              <p className="text-2xl font-bold">#{order.order_number}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                Order Date
              </h2>
              <p className="text-lg font-semibold">
                {new Date(order.created_at!).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Estimated Delivery
                </h3>
                <p className="text-blue-700 font-medium">
                  {getEstimatedDelivery()}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Usually delivered in 5–7 business days
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>

            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.product_image || "/placeholder-product.jpg"}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size} | Color: {item.color} | Qty:{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <div className="text-right font-semibold">
                    ₹{item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold">Shipping Address</h3>
          </div>

          <div className="text-sm space-y-1">
            <p className="font-semibold">
              {order.shipping_address.first_name}{" "}
              {order.shipping_address.last_name}
            </p>
            <p>{order.shipping_address.phone}</p>
            <p className="mt-2">
              {order.shipping_address.address_line1}
              {order.shipping_address.address_line2 &&
                `, ${order.shipping_address.address_line2}`}
            </p>
            <p>
              {order.shipping_address.city},{" "}
              {order.shipping_address.state}{" "}
              {order.shipping_address.postal_code}
            </p>
            <p>{order.shipping_address.country}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold"
          >
            <Package className="w-5 h-5" />
            Track Order
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-6 py-4 border border-border rounded-lg hover:bg-muted font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
