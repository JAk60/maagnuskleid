"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/context/cart-context"

interface Product {
  id: number
  name: string
  price: number
  image: string
  color: string
  sizes: string[]
  description: string
  specs: string[]
}

export function ProductCard({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [showAdded, setShowAdded] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size")
      return
    }

    addItem({
      id: product?.id,
      name: product?.name,
      price: product?.price,
      size: selectedSize,
      color:product.color,
      image: product?.image,
    })

    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 2000)
    setSelectedSize("")
    setQuantity(1)
  }

  return (
    <div className="group border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
      {/* Image */}
      <Link href={`/products/${product?.id}`}>
        <div className="relative overflow-hidden bg-muted h-64 md:h-72">
          <img
            src={product?.image || "/placeholder.svg"}
            alt={product?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <Link href={`/products/${product?.id}`}>
            <h3 className="font-semibold text-lg hover:text-primary transition-colors">{product?.name}</h3>
          </Link>
          <p className="text-2xl font-bold text-primary mt-2">${product?.price}</p>
        </div>

        {/* Size Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <div className="grid grid-cols-3 gap-2">
            {product?.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${selectedSize === size ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
            >
              −
            </button>
            <span className="flex-1 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${showAdded ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
        >
          {showAdded ? "✓ Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
