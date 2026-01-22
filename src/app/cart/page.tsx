// app/cart/page.tsx - UPDATED (Tax Inclusive)

"use client"

import { Navbar } from "@/components/navbar"
import { useCart } from "@/context/cart-context"
import { formatPrice } from "@/utils/helpers"
import { Minus, Plus } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <>
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="border border-border rounded-lg p-4 flex gap-4">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Size: <span className="font-medium text-foreground">{item.size}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Color: 
                        <span 
                          className="inline-block w-4 h-4 rounded-full border border-gray-300 ml-1"
                          style={{ backgroundColor: item.color.toLowerCase() === 'white' ? '#ffffff' : item.color.toLowerCase() }}
                          title={item.color}
                        />
                        <span className="font-medium text-foreground">{item.color}</span>
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary mt-2">{formatPrice(item.price)}</p>
                    {item.stock && item.stock <= 5 && item.quantity >= item.stock && (
                      <p className="text-sm text-orange-600 mt-1">Maximum stock reached</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        disabled={item.stock ? item.quantity >= item.stock : false}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id, item.size, item.color)}
                      className="text-sm text-destructive hover:text-destructive/80 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border border-border rounded-lg p-6 h-fit sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  All taxes included in the price
                </p>
              </div>
              <Link
                href="/checkout"
                className="w-full block text-center py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold mb-3"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your cart?')) {
                    clearCart();
                  }
                }}
                className="w-full py-3 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}