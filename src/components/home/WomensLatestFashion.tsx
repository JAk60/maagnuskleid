// components/home/WomensLatestFashion.tsx - WITH MOBILE CAROUSEL

"use client";

import { useEffect, useState, useRef } from "react";
import { getProducts } from "@/lib/supabase";
import { Product } from "@/lib/types";
import Link from "next/link";
import ProductCard from "../products/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function WomensLatestFashion() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWomensProducts();
  }, []);

  const loadWomensProducts = async () => {
    try {
      // Get latest 8 women's products
      const allProducts = await getProducts();
      const womensProducts = allProducts
        .filter(p => p.gender === "Female")
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 8);
      
      setProducts(womensProducts);
    } catch (error) {
      console.error("Failed to load women's products:", error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 bg-[#E3D9C6]">
        <div className="max-w-7xl px-5 md:px-10 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight">
              Women's Latest Fashion
            </h2>
          </div>
          {/* Mobile Carousel Skeleton */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-[280px] snap-start animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
          {/* Desktop Grid Skeleton */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#E3D9C6] w-full py-12">
        <div className="max-w-7xl px-5 md:px-10 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight">
              Women's Latest Fashion
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No products available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E3D9C6] w-full py-12">
      <div className="max-w-7xl px-5 md:px-10 mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight mb-3">
            Women's Latest Fashion
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
              <div key={product.id} className="flex-shrink-0 w-[280px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Carousel Navigation Buttons */}
          {products.length > 1 && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
                aria-label="Scroll right"
              >
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
            View All Women's Products
          </Link>
        </div>
      </div>

      {/* Hide scrollbar globally for this component */}
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
  );
}