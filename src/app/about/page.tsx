// app/about/page.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E3D9C6] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#E3D9C6]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#E3D9C6]/5 rounded-full blur-3xl" />
      </div>

      {/* Header with Logo */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 px-6 md:px-12 py-8"
      >
        <Link href="/" className="inline-block">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/mk.png"
              alt="Maagnus Kleid"
              className="h-16 md:h-20 w-auto"
            />
          </motion.div>
        </Link>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#E3D9C6]/60 hover:text-[#E3D9C6] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm tracking-wider uppercase">Back to Home</span>
            </Link>
          </motion.div>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-20"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-tight mb-6">
              About Us
            </h1>
            <div className="w-32 h-1 bg-linear-to-r from-[#E3D9C6] to-transparent" />
          </motion.div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left Column - Main Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#E3D9C6]/90">
                  Maagnus Kleid is a contemporary clothing brand driven by a commitment to{" "}
                  <span className="text-[#E3D9C6] font-normal">quality</span>,{" "}
                  <span className="text-[#E3D9C6] font-normal">craftsmanship</span>, and{" "}
                  <span className="text-[#E3D9C6] font-normal">individuality</span>.
                </p>

                <p className="text-lg leading-relaxed text-[#E3D9C6]/70">
                  Designed for a new generation, we seamlessly blend elevated streetwear with modern,
                  distinctive silhouettes to create premium clothing that feels effortless yet intentional.
                </p>

                <p className="text-lg leading-relaxed text-[#E3D9C6]/70">
                  Every piece is developed with a sharp focus on fabric selection, fit, structure, and
                  finishing—ensuring each garment delivers comfort, durability, and a refined aesthetic.
                </p>
              </div>

              {/* Decorative Divider */}
              <div className="py-8">
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.7 + i * 0.1 }}
                      className="h-px bg-linear-to-r from-transparent via-[#E3D9C6]/30 to-transparent"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Philosophy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-12"
            >
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-linear-to-b from-[#E3D9C6] to-transparent" />
                <div className="pl-8 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-light tracking-tight">
                    Our Philosophy
                  </h2>
                  <p className="text-lg leading-relaxed text-[#E3D9C6]/70">
                    Our collections are built around originality and versatility, offering unique statement
                    pieces alongside elevated essentials that move effortlessly from everyday wear to
                    standout moments.
                  </p>
                  <p className="text-lg leading-relaxed text-[#E3D9C6]/70">
                    We believe clothing is more than just style—it an extension of identity.
                  </p>
                </div>
              </div>

              {/* Quote Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="border border-[#E3D9C6]/20 p-8 md:p-10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/5 to-transparent" />
                <div className="relative z-10">
                  <svg
                    className="w-8 h-8 text-[#E3D9C6]/30 mb-4"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M10 8v8h-4l4 8h8l-4-8h4v-8zM22 8v8h-4l4 8h8l-4-8h4v-8z" />
                  </svg>
                  <p className="text-xl md:text-2xl font-light leading-relaxed italic mb-6">
                    Maagnus Kleid is for those who do not chase trends, but define their own presence,
                    choosing to wear the difference and move with quiet confidence.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Values Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-32 grid md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Quality",
                desc: "Sharp focus on fabric selection, fit, and finishing",
              },
              {
                title: "Craftsmanship",
                desc: "Every detail meticulously developed and refined",
              },
              {
                title: "Individuality",
                desc: "Clothing as an extension of your unique identity",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 + i * 0.1 }}
                className="group"
              >
                <div className="border border-[#E3D9C6]/20 p-8 h-full hover:border-[#E3D9C6]/50 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/0 to-[#E3D9C6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-light mb-4 tracking-wide">{value.title}</h3>
                    <p className="text-[#E3D9C6]/60 leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 border-t border-[#E3D9C6]/10 px-6 md:px-12 py-12"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-[#E3D9C6]/40 tracking-wider">
            © 2026 Maagnus Kleid. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link
              href="/terms"
              className="text-sm text-[#E3D9C6]/60 hover:text-[#E3D9C6] transition-colors tracking-wider"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}