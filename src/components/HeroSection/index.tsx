"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: string;
}

interface CarouselProps {
  products: Product[];
  gender: "Men's" | "Women's";
  videoSrc: string;
}

function Carousel({ products, gender, videoSrc }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const nextSlide = () => {
    if (isAnimating || products.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || products.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const diff = touchStart - touchEnd;

    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();

    setTouchStart(null);
    setTouchEnd(null);
    startAutoSlide();
  };

  return (
    <div
      className="relative w-full h-[90vh] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CTA Button */}
      <div className="relative z-10 h-full flex items-end justify-start md:justify-end px-6 md:px-12 pb-12">
        <Link
          href={
            gender === "Men's"
              ? "/products/gender/Male"
              : "/products/gender/Female"
          }
        >
          <button className="px-8 py-3 bg-[#E3D9C6] text-black font-semibold text-base rounded-full hover:bg-white transition-all shadow-md">
            Shop {gender}
          </button>
        </Link>
      </div>



    </div>
  );
}

export default function HeroCarousel() {
  return (
    <div className="w-full bg-black">
      <Carousel
        products={[{ id: 1, name: "", price: "" }]}
        gender="Men's"
        videoSrc="/videos/L1.mp4"
      />
      <Carousel
        products={[{ id: 1, name: "", price: "" }]}
        gender="Women's"
        videoSrc="/videos/L2.mp4"
      />
    </div>
  );
}
