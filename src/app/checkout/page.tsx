// src/app/checkout/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { initializeRazorpay, openRazorpayCheckout } from "@/lib/razorpay"
import { createOrder, getAddresses, createAddress, type Address } from "@/lib/supabase-orders"
import { Tag, X, CheckCircle } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"

// =====================
// Constants
// =====================

const COD_FEE = 100

// =====================
// Types
// =====================

type PaymentMethod = "razorpay" | "cod"

interface AppliedCoupon {
  id: string
  code: string
  description: string | null
  discount_type: "flat" | "percentage"
  discount_value: number
}

interface CouponValidateResponse {
  success: boolean
  error?: string
  coupon?: AppliedCoupon
  discount_amount?: number
  final_total?: number
  message?: string
}

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
// Shared Place Order Button
// =====================

function PlaceOrderButton({
  onClick,
  disabled,
  loading,
  paymentMethod,
  finalTotal,
  className = "",
}: {
  onClick: () => void
  disabled: boolean
  loading: boolean
  paymentMethod: PaymentMethod
  finalTotal: number
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
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
  )
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

  // Coupon state
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponSuccess, setCouponSuccess] = useState("")

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

  const shippingCost = 0
  const codCharge = paymentMethod === "cod" ? COD_FEE : 0
  const finalTotal = total - discountAmount + shippingCost + codCharge

  // Re-validate coupon when payment method changes
  useEffect(() => {
    if (appliedCoupon) {
      handleApplyCoupon(couponInput, paymentMethod)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod])

  // ✅ FIX: Auto-select default address, fallback to first address if none marked default
  const loadAddresses = useCallback(async () => {
    if (!user) return
    try {
      const userAddresses = await getAddresses(user.id)
      setAddresses(userAddresses)
      const defaultAddr = userAddresses.find(addr => addr.is_default) ?? userAddresses[0] ?? null
      if (defaultAddr) setSelectedAddress(defaultAddr)
    } catch (err) {
      console.error("Failed to load addresses:", err)
    }
  }, [user])

  useEffect(() => {
    if (isLoggedIn && user) loadAddresses()
  }, [isLoggedIn, user, loadAddresses])

  // =====================
  // Coupon Handlers
  // =====================

  const handleApplyCoupon = async (code: string, method?: PaymentMethod) => {
    const codeToApply = code.trim().toUpperCase()
    if (!codeToApply) { setCouponError("Please enter a coupon code"); return }
    if (!user) { setCouponError("Please log in to apply a coupon"); return }

    setCouponLoading(true)
    setCouponError("")
    setCouponSuccess("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToApply,
          user_id: user.id,
          cart_total: total,
          payment_method: method ?? paymentMethod,
        }),
      })

      const data = (await response.json()) as CouponValidateResponse

      if (!data.success || !data.coupon || data.discount_amount === undefined) {
        setCouponError(data.error || "Invalid coupon")
        setAppliedCoupon(null)
        setDiscountAmount(0)
        return
      }

      setAppliedCoupon(data.coupon)
      setDiscountAmount(data.discount_amount)
      setCouponSuccess(data.message || "Coupon applied!")
    } catch (err) {
      console.error("Coupon apply error:", err)
      setCouponError("Failed to apply coupon. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponInput("")
    setCouponError("")
    setCouponSuccess("")
  }

  // =====================
  // Address Handlers
  // =====================

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleSaveAddress = async () => {
    if (
      !addressForm.first_name || !addressForm.last_name || !addressForm.phone ||
      !addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.postal_code
    ) {
      setError("Please fill in all required address fields")
      return
    }
    try {
      const newAddress = await createAddress({ ...addressForm, user_id: user!.id })
      setAddresses(prev => [...prev, newAddress])
      setSelectedAddress(newAddress)
      setShowAddressForm(false)
      setError("")
      setAddressForm({
        first_name: "", last_name: "", phone: "",
        address_line1: "", address_line2: "",
        city: "", state: "", postal_code: "",
        country: "India", is_default: false,
      })
    } catch (err) {
      console.error("Failed to save address:", err)
      setError("Failed to save address. Please try again.")
    }
  }

  // =====================
  // COD Order
  // =====================

  const handleCODOrder = async () => {
    if (!selectedAddress || !user) return
    setLoading(true)
    setError("")

    try {
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
        cod_charge: COD_FEE,
        total: finalTotal,
        coupon_code: appliedCoupon?.code ?? null,
        coupon_id: appliedCoupon?.id ?? null,
        discount_amount: discountAmount,
        shipping_address: selectedAddress,
        payment_method: "cod",
        payment_status: "pending",
        order_status: "confirmed",
      })

      if (!order?.id || !order?.order_number) throw new Error("Failed to create order")

      try {
        await fetch("/api/shiprocket/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        })
      } catch (shipErr) {
        console.error("ShipRocket order creation failed (non-critical):", shipErr)
      }

      clearCart()
      router.push(`/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  // =====================
  // Razorpay Order
  // =====================

  const handleRazorpayOrder = async () => {
    if (!selectedAddress || !user) return
    setLoading(true)
    setError("")

    try {
      const razorpayLoaded = await initializeRazorpay()
      if (!razorpayLoaded) throw new Error("Failed to load payment gateway.")

      // STEP 1: Create Razorpay order only — no Supabase order yet
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: { user_id: user.id },
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({ error: "Too many attempts" })) as ErrorResponse
        throw new Error(errorData.error || "Too many payment attempts.")
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ErrorResponse
        throw new Error(errorData.error || `Payment gateway error (${response.status})`)
      }

      const data = await response.json() as RazorpayOrderResponse
      if (!data.success || !data.order) throw new Error("Invalid response from payment server")

      // STEP 2: Open Razorpay modal
      openRazorpayCheckout(
        {
          orderId: data.order.id,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Magnus Kleid",
          description: "Order payment",
          prefill: {
            name: `${selectedAddress.first_name} ${selectedAddress.last_name}`,
            email: user.email || "",
            contact: selectedAddress.phone,
          },
          notes: { user_id: user.id },
        },
        async (razorpayResponse) => {
          // STEP 3: Payment succeeded — NOW create Supabase order
          try {
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
              cod_charge: 0,
              total: finalTotal,
              coupon_code: appliedCoupon?.code ?? null,
              coupon_id: appliedCoupon?.id ?? null,
              discount_amount: discountAmount,
              shipping_address: selectedAddress,
              payment_method: "razorpay",
              payment_status: "pending",
              order_status: "pending",
            })

            if (!order?.id || !order?.order_number) throw new Error("Failed to create order record")

            // STEP 4: Verify payment signature
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                order_id: order.id,
              }),
            })

            const result = await verifyResponse.json() as VerifyPaymentResponse
            if (result.success) {
              clearCart()
              router.push(`/order-success?orderId=${order.id}&orderNumber=${order.order_number}`)
            } else {
              setError(`Payment verified but order update failed. Order: ${order.order_number}. Contact support.`)
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : `Order creation failed after payment. Contact support with payment ID: ${razorpayResponse.razorpay_payment_id}`
            )
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          setLoading(false)
          if (!error || Object.keys(error).length === 0) return
          if (error.reason === "Payment cancelled by user") return
          if (error.error?.code === "payment_cancelled") return
          setError(error.error?.description || "Payment failed. Please try again.")
        }
      )
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : "Failed to process order.")
    }
  }

  // =====================
  // Main Handler
  // =====================

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { setError("Please select a delivery address"); return }
    if (!user?.id) { setError("User session expired. Please log in again."); return }
    if (items.length === 0) { setError("Your cart is empty"); return }
    if (paymentMethod === "cod") await handleCODOrder()
    else await handleRazorpayOrder()
  }

  // =====================
  // Empty / Auth Guards
  // =====================

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-lg text-muted-foreground mb-6">Your cart is empty</p>
          <Link href="/products" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
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
          <Link href="/login" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  // =====================
  // Render
  // =====================

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/*
          MOBILE:  flex-col — Order Summary at top, then forms, then Pay button at very bottom
          DESKTOP: lg:grid 3-col — forms left (col-span-2), summary sticky right
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">

          {/* ── ORDER SUMMARY — top on mobile, right column on desktop ── */}
          <div className="lg:col-start-3 lg:row-start-1 border border-border rounded-lg p-6 h-fit lg:sticky lg:top-20">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-48 lg:max-h-96 overflow-y-auto">
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
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon ({appliedCoupon.code})
                  </span>
                  <span className="font-semibold text-green-600">− ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
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

            {/* Desktop-only pay button inside summary */}
            <PlaceOrderButton
              onClick={handlePlaceOrder}
              disabled={!selectedAddress || loading}
              loading={loading}
              paymentMethod={paymentMethod}
              finalTotal={finalTotal}
              className="hidden lg:flex mt-6"
            />
          </div>

          {/* ── LEFT COLUMN: forms + mobile pay button at very bottom ── */}
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 space-y-6">

            {/* Delivery Address */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-4 mb-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => { setSelectedAddress(addr); setError("") }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === addr.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <p className="font-semibold">{addr.first_name} {addr.last_name}</p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                    </div>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <input type="text" name="first_name" placeholder="First Name *" value={addressForm.first_name} onChange={handleAddressFormChange} className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <input type="text" name="last_name" placeholder="Last Name *" value={addressForm.last_name} onChange={handleAddressFormChange} className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <PhoneInput
                    value={addressForm.phone}
                    onChange={(val) => setAddressForm(prev => ({ ...prev, phone: val }))}
                    placeholder="Phone Number *"
                    required
                  />
                  <input type="text" name="address_line1" placeholder="Address Line 1 *" value={addressForm.address_line1} onChange={handleAddressFormChange} className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <input type="text" name="address_line2" placeholder="Address Line 2 (Optional)" value={addressForm.address_line2} onChange={handleAddressFormChange} className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <input type="text" name="city" placeholder="City *" value={addressForm.city} onChange={handleAddressFormChange} className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <input type="text" name="state" placeholder="State *" value={addressForm.state} onChange={handleAddressFormChange} className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <input type="text" name="postal_code" placeholder="Postal Code *" value={addressForm.postal_code} onChange={handleAddressFormChange} className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  <label className="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressFormChange} className="w-4 h-4" />
                    <span className="text-sm">Set as default address</span>
                  </label>
                </div>
              )}

              <div className="flex gap-4">
                {showAddressForm ? (
                  <>
                    <button onClick={handleSaveAddress} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">Save Address</button>
                    <button onClick={() => { setShowAddressForm(false); setError("") }} className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setShowAddressForm(true)} className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold">+ Add New Address</button>
                )}
              </div>
            </div>

            {/* Coupon Code */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Tag className="w-6 h-6" />
                Coupon Code
              </h2>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-700">{couponSuccess}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="p-1.5 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-full transition-colors" title="Remove coupon">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ✅ Stack vertically on mobile — no overflow clipping */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(couponInput) }}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background uppercase placeholder:normal-case"
                    />
                    <button
                      onClick={() => handleApplyCoupon(couponInput)}
                      disabled={couponLoading || !couponInput.trim()}
                      className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {couponLoading ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "razorpay" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="font-semibold">Pay Online</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">UPI, Cards, Net Banking via Razorpay</p>
                  <p className="text-sm font-medium text-green-600 pl-7 mt-1">No extra charges</p>
                </button>

                <button
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "cod" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="font-semibold">Cash on Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">Pay when your order arrives</p>
                  <p className="text-sm font-medium text-amber-600 pl-7 mt-1">+₹{COD_FEE} COD fee will be added</p>
                </button>
              </div>
            </div>

            {/*
              ✅ MOBILE pay button — sits at the very bottom of the form flow
                 (after address, coupon, payment method — exactly where the user expects it)
              ✅ DESKTOP — hidden here, button lives inside Order Summary panel on the right
            */}
            <PlaceOrderButton
              onClick={handlePlaceOrder}
              disabled={!selectedAddress || loading}
              loading={loading}
              paymentMethod={paymentMethod}
              finalTotal={finalTotal}
              className="lg:hidden"
            />

          </div>
        </div>
      </div>
    </main>
  )
}