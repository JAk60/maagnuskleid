"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { motion, useInView, useAnimation } from "framer-motion"
import HeroSection from "@/components/HeroSection"
import Marquee from "@/components/Marquee"
import Footer from "@/components/Footer"
import TrendCate from "@/components/Trending-categories"
import MensLatestFashion from "@/components/home/MensLatestFashion"
import WomensLatestFashion from "@/components/home/WomensLatestFashion"
import AnimatedTestimonials from "@/components/home/Review"

// Animation wrapper component
function AnimateOnScroll({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 75 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            delay: delay,
            ease: [0.25, 0.4, 0.25, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [menCarouselIndex, setMenCarouselIndex] = useState(0)
  const [womenCarouselIndex, setWomenCarouselIndex] = useState(0)

  const messages = [
    { icon: '🎉', text: 'EXTRA 5% OFF FOR PREPAID' },
    { icon: '✈️', text: 'FREE SHIPPING ₹2000+' },
    { icon: '🎊', text: 'HIT ₹5K FOR 20%' },
    { icon: '💳', text: 'EXTRA 5% OFF FOR PREPAID' },
  ];

  return (
    <>
      <main className="w-full min-h-screen bg-[#E3D9C6]">
        {/* <Marquee messages={messages} /> */}

        {/* Hero Section - Animated */}
        <AnimateOnScroll delay={0}>
          <HeroSection />
        </AnimateOnScroll>

        {/* Trending Categories - Animated */}
        <AnimateOnScroll delay={0.2}>
          <TrendCate />
        </AnimateOnScroll>

        {/* Male's Latest Fashion - Animated */}
        <AnimateOnScroll delay={0.1}>
          <MensLatestFashion />
        </AnimateOnScroll>

        {/* Female's Latest Fashion - Animated */}
        <AnimateOnScroll delay={0.1}>
          <WomensLatestFashion />
        </AnimateOnScroll>

        {/* Reviews Section - Animated */}
        {/* <AnimateOnScroll delay={0.2}>
          <section className="bg-[#E3D9C6] py-12 md:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <AnimatedTestimonials />
          </section>
        </AnimateOnScroll> */}
      </main>
    </>
  )
}