"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/utils/helpers"
import type { Product } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  products: Product[]
}

export default function TrendingCategories({ products }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getColorHex = (color: string | { name?: string; hex: string }): string => {
    if (typeof color === 'string') {
      return color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase()
    } else if (color && typeof color === 'object' && color.hex) {
      return color.hex
    }
    return '#000000'
  }

  const getColorTitle = (color: string | { name?: string; hex: string }): string => {
    if (typeof color === 'string') {
      return color
    } else if (color && typeof color === 'object') {
      return color.name ? `${color.name} (${color.hex})` : color.hex
    }
    return 'Color'
  }

  if (products.length === 0) return null

  return (
    <section className="bg-[#E3D9C6] py-12 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-20">
          <h2 className="text-xs md:text-sm font-bold tracking-widest text-gray-900 uppercase">
            Latest Drop
          </h2>
          <Link
            href="/products"
            className="text-xs md:text-sm font-bold tracking-widest text-gray-900 hover:text-gray-600 transition-colors uppercase"
          >
            Discover More
          </Link>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative mb-8">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="shrink-0 w-[90vw] snap-start"
              >
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden bg-gray-100 aspect-3/4">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/5" />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-[#E3D9C6]/80 flex items-center justify-center">
                        <span className="text-gray-900 font-bold text-lg">OUT OF STOCK</span>
                      </div>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded">
                        ONLY {product.stock} LEFT
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 px-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 font-semibold">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Sizes:</span>
                      <span className="font-medium">{product.sizes.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.colors.slice(0, 4).map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: getColorHex(color) }} title={getColorTitle(color)} />
                      ))}
                      {product.colors.length > 4 && <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Dots — single set, outside cards */}
          <div className="flex justify-center gap-2 mt-4">
            {products.map((_, idx) => (
              <div key={idx} className="w-2 h-2 rounded-full bg-gray-400" />
            ))}
          </div>

          {products.length > 1 && (
            <>
              <button onClick={() => scroll('left')}
                className="absolute left-2 top-1/3 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll('right')}
                className="absolute right-2 top-1/3 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-12">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <div
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative overflow-hidden bg-gray-100 aspect-3/4 flex items-center justify-center">
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hoveredId === product.id && product.images?.[1]
                        ? 'opacity-0'
                        : 'opacity-100'
                      }`}
                  />

                  {product.images?.[1] && (
                    <Image
                      src={
                        typeof product.images[1] === 'string'
                          ? product.images[1]
                          : (product.images[1] as { image_url?: string }).image_url ?? "/placeholder.svg"
                      }
                      alt={`${product.name} - alternate view`}
                      fill
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hoveredId === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                  )}

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />

                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-[#E3D9C6]/80 flex items-center justify-center">
                      <span className="text-gray-900 font-bold text-lg">OUT OF STOCK</span>
                    </div>
                  )}

                  {product.stock > 0 && product.stock <= 5 && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded">
                      ONLY {product.stock} LEFT
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold">
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Sizes:</span>
                    <span className="font-medium">{product.sizes.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.colors.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorHex(color) }}
                        title={getColorTitle(color)}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Button - Desktop Only */}
        <div className="hidden md:flex justify-center">
          <Link
            href="/products"
            className="px-12 py-3 border border-gray-900 text-gray-900 text-sm font-bold tracking-widest hover:bg-gray-900 hover:text-white transition-colors uppercase"
          >
            Discover More
          </Link>
        </div>

        {/* CTA Button - Mobile */}
        <div className="md:hidden flex justify-center mt-8">
          <Link
            href="/products"
            className="w-full max-w-sm px-8 py-3 border border-gray-900 text-gray-900 text-sm font-bold tracking-widest hover:bg-gray-900 hover:text-white transition-colors uppercase text-center"
          >
            Discover More
          </Link>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}