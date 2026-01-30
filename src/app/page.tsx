"use client"

import HeroSection from "@/components/HeroSection"
import TrendCate from "@/components/Trending-categories"
import MensLatestFashion from "@/components/home/MensLatestFashion"
import WomensLatestFashion from "@/components/home/WomensLatestFashion"


export default function Home() {


  return (
    <>
      <main className="w-full min-h-screen bg-[#E3D9C6]">
        {/* <Marquee messages={messages} /> */}

        {/* Hero Section - Animated */}

        <HeroSection />


        {/* Trending Categories - Animated */}

        <TrendCate />

        {/* Male's Latest Fashion - Animated */}

        <MensLatestFashion />


        {/* Female's Latest Fashion - Animated */}

        <WomensLatestFashion />


      </main>
    </>
  )
}