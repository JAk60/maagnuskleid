"use client";

import Link from "next/link";

interface HeroVideoProps {
  gender: "Men's" | "Women's";
  videoSrc: string;
  posterSrc: string;
}

function HeroVideo({ gender, videoSrc, posterSrc }: HeroVideoProps) {
  return (
    <div className="relative w-full h-[90vh] overflow-hidden bg-black">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

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
      <HeroVideo
        gender="Men's"
        videoSrc="/videos/L1.mp4"
        posterSrc="/videos/L1-poster.webp"
      />
      <HeroVideo
        gender="Women's"
        videoSrc="/videos/L2.mp4"
        posterSrc="/videos/L2-poster.webp"
      />
    </div>
  );
}