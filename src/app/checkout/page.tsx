// app/checkout/page.tsx - UPDATED WITH COD SUPPORT

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { initializeRazorpay, openRazorpayCheckout } from "@/lib/razorpay"
import { createOrder, getAddresses, createAddress, type Address } from "@/lib/supabase-orders"

// =====================
// Constants
// =====================

const COD_FEE = 100 // ₹100 flat fee for Cash on Delivery

// =====================
// Types
// =====================

type PaymentMethod = "razorpay" | "cod"

interface RazorpayOrderResponse {
  success: boolean
  order: {
    id: string
    amount: number
    currency: string
  }
}

interface VerifyPaymentResponse {
  success: boolean
}

interface ErrorResponse {
  error?: string
}

// =====================
// Component
// =====================

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay")

  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  })

  // ✅ Reactive total — updates instantly when payment method changes
  const shippingCost = 0
  const codCharge = paymentMethod === "cod" ? COD_FEE : 0
  const finalTotal = total + shippingCost + codCharge

  const loadAddresses = useCallback(async () => {
    if (!user) return

    try {
      const userAddresses = await getAddresses(user.id)
      setAddresses(userAddresses)
      const defaultAddr = userAddresses.find(addr => addr.is_default)
      if (defaultAddr) setSelectedAddress(defaultAddr)
    } catch (err) {
      console.error("Failed to load addresses:", err)
      setError("Failed to load saved addresses. You can still add a new one.")
    }
  }, [user])

  useEffect(() => {
    if (isLoggedIn && user) {
      loadAddresses()
    }
  }, [isLoggedIn, user, loadAddresses])

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSaveAddress = async () => {
    if (!addressForm.first_name || !addressForm.last_name || !addressForm.phone ||
      !addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.postal_code) {
      setError("Please fill in all required address fields")
      return
    }

    try {
      const newAddress = await createAddress({
        ...addressForm,
        user_id: user!.id
      })
      setAddresses(prev => [...prev, newAddress])
      setSelectedAddress(newAddress)
      setShowAddressForm(false)
      setError("")
      setAddressForm({
        first_name: "",
        last_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
      })
    } catch (err) {
      console.error("Failed to save address:", err)
      setError("Failed to save address. Please try again.")
    }
  }

  // =====================
  // COD Order Handler
  // =====================

  const handleCODOrder = async () => {
    if (!selectedAddress || !user) return

    setLoading(true)
    setError("")

    try {
      console.log("Creating COD order...")

      const order = await createOrder({
        user_id: user.id,
        items: items.map(item => ({
          product_id: item?.id,
          product_name: item.name,
          product_image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        subtotal: total,
        tax: 0,
        shipping_cost: shippingCost,
        cod_charge: COD_FEE,        // ✅ ₹100 COD fee
        total: finalTotal,          // ✅ includes COD fee
        shipping_address: selectedAddress,
        payment_method: "cod",      // ✅ explicit
        payment_status: "pending",  // ✅ will be marked paid on delivery
        order_status: "confirmed",  // ✅ COD orders skip pending entirely
      })

      if (!order || !order.id || !order.order_number) {
        throw new Error("Failed to create order")
      }

      console.log("COD order created:", order.id)

      // ✅ Create ShipRocket order immediately for COD
      // ShipRocket will receive payment_method: 'COD' and transaction_charges: 100
      try {
        console.log("Creating ShipRocket order for COD...")
        await fetch("/api/shiprocket/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        })
        console.log("ShipRocket order created for COD")
      } catch (shipErr) {
        // Non-critical — admin can retry from panel
        console.error("ShipRocket order creation failed (non-critical):", shipErr)
      }

      clearCart()
      router.push(`/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place order"
      console.error("COD order error:", err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // =====================
  // Razorpay Order Handler
  // =====================

  const handleRazorpayOrder = async () => {
    if (!selectedAddress || !user) return

    setLoading(true)
    setError("")

    try {
      // 1. Initialize Razorpay
      const razorpayLoaded = await initializeRazorpay()
      if (!razorpayLoaded) {
        throw new Error("Failed to load payment gateway. Please check your internet connection and try again.")
      }

      // 2. Create order in database
      const orderData = {
        user_id: user.id,
        items: items.map(item => ({
          product_id: item?.id,
          product_name: item.name,
          product_image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        subtotal: total,
        tax: 0,
        shipping_cost: shippingCost,
        cod_charge: 0,              // ✅ No COD fee for Razorpay
        total: finalTotal,
        shipping_address: selectedAddress,
        payment_method: "razorpay" as const,
        payment_status: "pending" as const,
        order_status: "pending" as const,
      }

      console.log("Creating Razorpay order in database...")
      const order = await createOrder(orderData)

      if (!order || !order.id || !order.order_number) {
        throw new Error("Failed to create order in database")
      }

      console.log("Order created:", order.id)

      // 3. Create Razorpay order
      console.log("Creating Razorpay payment order...")
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          currency: "INR",
          receipt: order.order_number,
          notes: {
            order_id: order.id,
            user_id: user.id,
          },
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({ error: "Too many attempts" })) as ErrorResponse
        throw new Error(errorData.error || "Too many payment attempts. Please try again in a few minutes.")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ErrorResponse
        throw new Error(errorData.error || `Payment gateway error (${response.status})`)
      }

      const data = await response.json() as RazorpayOrderResponse

      if (!data.success || !data.order) {
        throw new Error("Invalid response from payment server")
      }

      const razorpayOrder = data.order
      console.log("Razorpay order created:", razorpayOrder.id)

      // 4. Open Razorpay checkout modal
      openRazorpayCheckout(
        {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Magnus Kleid",
          description: `Order #${order.order_number}`,
          prefill: {
            name: `${selectedAddress.first_name} ${selectedAddress.last_name}`,
            email: user.email || "",
            contact: selectedAddress.phone,
          },
          notes: {
            order_id: order.id,
          },
        },
        // Success callback
        async (response) => {
          console.log("Payment successful, verifying...")
          try {
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed")
            }

            const result = await verifyResponse.json() as VerifyPaymentResponse

            if (result.success) {
              console.log("Payment verified successfully")
              clearCart()
              router.push(`/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
            } else {
              setError(`Payment verification failed. Order ID: ${order.order_number}. Please contact support.`)
            }
          } catch (verifyError) {
            const errorMessage = verifyError instanceof Error ? verifyError.message : "Unknown error occurred"
            console.error("Verification error:", verifyError)
            setError(
              `Payment verification failed: ${errorMessage}. Order ID: ${order.order_number}. ` +
              `Your payment may have been processed. Please contact support before retrying.`
            )
          } finally {
            setLoading(false)
          }
        },
        // Error callback
        // Error callback
        (error) => {
          setLoading(false)

          // User just closed the modal - not an error
          if (!error || Object.keys(error).length === 0) return
          if (error.reason === "Payment cancelled by user") return
          if (error.error?.code === "payment_cancelled") return

          // Actual payment failure
          if (error.error?.code === "payment_failed") {
            setError("Payment failed. Please try again or use a different payment method.")
          } else {
            setError(error.error?.description || "Payment failed. Please try again or contact support.")
          }
        }
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      console.error("Order creation error:", err)
      setLoading(false)

      if (errorMessage.includes("internet connection")) {
        setError("Connection error. Please check your internet and try again.")
      } else if (errorMessage.includes("Too many")) {
        setError(errorMessage)
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        setError("Too many attempts. Please wait a few minutes and try again.")
      } else {
        setError(errorMessage || "Failed to process order. Please try again or contact support.")
      }
    }
  }

  // =====================
  // Main Handler — splits based on payment method
  // =====================

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address")
      return
    }

    if (!user || !user.id) {
      setError("User session expired. Please log in again.")
      return
    }

    if (items.length === 0) {
      setError("Your cart is empty")
      return
    }

    if (paymentMethod === "cod") {
      await handleCODOrder()
    } else {
      await handleRazorpayOrder()
    }
  }

  // =====================
  // Empty / Logged Out States
  // =====================

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-lg text-muted-foreground mb-6">Your cart is empty</p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-lg text-muted-foreground mb-6">Please log in to continue checkout</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  // =====================
  // Main Render
  // =====================

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column — Address + Payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Address */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-4 mb-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr)
                        setError("")
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <p className="font-semibold">{addr.first_name} {addr.last_name}</p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {addr.address_line1}
                        {addr.address_line2 && `, ${addr.address_line2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}, {addr.state} {addr.postal_code}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name *"
                    value={addressForm.first_name}
                    onChange={handleAddressFormChange}
                    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name *"
                    value={addressForm.last_name}
                    onChange={handleAddressFormChange}
                    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number *"
                    value={addressForm.phone}
                    onChange={handleAddressFormChange}
                    className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="text"
                    name="address_line1"
                    placeholder="Address Line 1 *"
                    value={addressForm.address_line1}
                    onChange={handleAddressFormChange}
                    className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="text"
                    name="address_line2"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.address_line2}
                    onChange={handleAddressFormChange}
                    className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State *"
                    value={addressForm.state}
                    onChange={handleAddressFormChange}
                    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="Postal Code *"
                    value={addressForm.postal_code}
                    onChange={handleAddressFormChange}
                    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                  <label className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressFormChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Set as default address</span>
                  </label>
                </div>
              )}

              <div className="flex gap-4">
                {showAddressForm ? (
                  <>
                    <button
                      onClick={handleSaveAddress}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressForm(false)
                        setError("")
                      }}
                      className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                  >
                    + Add New Address
                  </button>
                )}
              </div>
            </div>

            {/* ✅ Payment Method Selector */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Razorpay Option */}
                <button
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === "razorpay"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-primary" : "border-muted-foreground"
                      }`}>
                      {paymentMethod === "razorpay" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-semibold">Pay Online</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">
                    UPI, Cards, Net Banking via Razorpay
                  </p>
                  <p className="text-sm font-medium text-green-600 pl-7 mt-1">No extra charges</p>
                </button>

                {/* COD Option */}
                <button
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === "cod"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"
                      }`}>
                      {paymentMethod === "cod" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-semibold">Cash on Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">
                    Pay when your order arrives
                  </p>
                  <p className="text-sm font-medium text-amber-600 pl-7 mt-1">
                    +₹{COD_FEE} COD fee will be added
                  </p>
                </button>

              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!selectedAddress || loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : paymentMethod === "cod" ? (
                `Place Order — Pay ₹${finalTotal.toFixed(2)} on Delivery`
              ) : (
                `Pay ₹${finalTotal.toFixed(2)} with Razorpay`
              )}
            </button>

          </div>

          {/* Order Summary */}
          <div className="border border-border rounded-lg p-6 h-fit sticky top-20">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between text-sm gap-2">
                  <span className="flex-1">
                    {item.name}
                    <span className="text-muted-foreground"> (Size {item.size}, {item.color}) </span>
                    x{item.quantity}
                  </span>
                  <span className="font-semibold ml-2 whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>

              {/* ✅ COD fee line item — only shows when COD is selected */}
              {paymentMethod === "cod" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Handling Fee</span>
                  <span className="font-semibold text-amber-600">+₹{COD_FEE.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-border pt-4 flex justify-between items-end">
                <div>
                  <span className="font-bold text-lg block">Total</span>
                  <span className="text-xs text-muted-foreground">All taxes included</span>
                </div>
                <span className="text-2xl font-bold text-primary">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}