"use client"

import { useRef } from "react"
import { Product } from "@/lib/types"
import Link from "next/link"
import ProductCard from "../products/ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  products: Product[]
}

export default function WomensLatestFashion({ products }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#E3D9C6] w-full py-12">
        <div className="max-w-7xl px-5 md:px-10 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight">
              Women Latest Fashion
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No products available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#E3D9C6] w-full py-12">
      <div className="max-w-7xl px-5 md:px-10 mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight mb-3">
            Women Latest Fashion
          </h2>
          <p className="text-gray-600">Discover the newest styles for women</p>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative mb-8">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {products.map((product) => (
              <div key={product.id} className="shrink-0 w-72 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {products.length > 1 && (
            <>
              <button onClick={() => scroll('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Scroll left">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Scroll right">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products/gender/Female"
            className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            View All Women Products
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
    </div>
  )
}