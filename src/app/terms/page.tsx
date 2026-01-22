// app/terms/page.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Package, RefreshCw, Truck, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E3D9C6]">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #E3D9C6 1px, transparent 1px),
              linear-gradient(to bottom, #E3D9C6 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
          }}
        />
      </div>

      {/* Header with Logo */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 px-6 md:px-12 py-8 border-b border-[#E3D9C6]/10"
      >
        <Link href="/" className="inline-block">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src="/mk.png" alt="Maagnus Kleid" className="h-16 md:h-20 w-auto" />
          </motion.div>
        </Link>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 z-111"
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
            className="mb-16"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6">
              Terms &<br />Conditions
            </h1>
            <div className="w-32 h-1 bg-linear-to-r from-[#E3D9C6] to-transparent" />
          </motion.div>

          {/* Navigation Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            {[
              { id: "shipping", label: "Shipping", icon: Truck },
              { id: "returns", label: "Returns", icon: RefreshCw },
              { id: "exchange", label: "Exchange", icon: Package },
            ].map((item, i) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                className="group flex items-center gap-2 px-6 py-3 border border-[#E3D9C6]/20 hover:border-[#E3D9C6]/60 hover:bg-[#E3D9C6]/5 transition-all duration-300"
              >
                <item.icon className="w-4 h-4 text-[#E3D9C6]/60 group-hover:text-[#E3D9C6] transition-colors" />
                <span className="text-sm tracking-wider uppercase">{item.label}</span>
              </motion.a>
            ))}
          </motion.div>

          {/* Content Sections */}
          <div className="space-y-20">
            {/* Shipping Policy */}
            <motion.section
              id="shipping"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="scroll-mt-24"
            >
              <div className="border-l-2 border-[#E3D9C6] pl-8 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Truck className="w-8 h-8 text-[#E3D9C6]" />
                  <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                    Shipping Policy
                  </h2>
                </div>
                <p className="text-[#E3D9C6]/60 text-lg">
                  We aim to deliver your orders quickly and safely
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="border border-[#E3D9C6]/20 p-8 hover:border-[#E3D9C6]/40 transition-all duration-500 group">
                  <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/0 to-[#E3D9C6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-xl font-light mb-4 tracking-wide text-[#E3D9C6]">
                    Coverage
                  </h3>
                  <ul className="space-y-3 text-[#E3D9C6]/70">
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>We ship across India</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-[#E3D9C6]/20 p-8 hover:border-[#E3D9C6]/40 transition-all duration-500 group">
                  <h3 className="text-xl font-light mb-4 tracking-wide text-[#E3D9C6]">
                    Processing Time
                  </h3>
                  <ul className="space-y-3 text-[#E3D9C6]/70">
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>Orders processed within 1–3 business days</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-[#E3D9C6]/20 p-8 hover:border-[#E3D9C6]/40 transition-all duration-500 group">
                  <h3 className="text-xl font-light mb-4 tracking-wide text-[#E3D9C6]">
                    Delivery Time
                  </h3>
                  <ul className="space-y-3 text-[#E3D9C6]/70">
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>Typically takes 4–8 business days</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>Varies by location</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-[#E3D9C6]/20 p-8 hover:border-[#E3D9C6]/40 transition-all duration-500 group">
                  <h3 className="text-xl font-light mb-4 tracking-wide text-[#E3D9C6]">
                    Tracking
                  </h3>
                  <ul className="space-y-3 text-[#E3D9C6]/70">
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>Details shared via SMS/email</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#E3D9C6] mt-1">•</span>
                      <span>Check status on our website</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 border border-[#E3D9C6]/20 bg-[#E3D9C6]/5">
                <p className="text-[#E3D9C6]/70 text-sm">
                  <strong className="text-[#E3D9C6]">Note:</strong> Shipping charges (if any)
                  will be displayed at checkout
                </p>
              </div>
            </motion.section>

            {/* Returns Policy */}
            <motion.section
              id="returns"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="scroll-mt-24"
            >
              <div className="border-l-2 border-[#E3D9C6] pl-8 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <RefreshCw className="w-8 h-8 text-[#E3D9C6]" />
                  <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                    Return Policy
                  </h2>
                </div>
                <p className="text-[#E3D9C6]/60 text-lg">
                  Quality assurance and customer satisfaction
                </p>
              </div>

              <div className="space-y-6">
                <div className="border border-[#E3D9C6]/20 p-8">
                  <h3 className="text-2xl font-light mb-6 tracking-wide text-[#E3D9C6]">
                    Return Eligibility
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#E3D9C6] mt-2" />
                      <p className="text-[#E3D9C6]/70 leading-relaxed">
                        Returns are accepted <strong className="text-[#E3D9C6]">only</strong> for
                        defective, damaged, or wrong items received
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#E3D9C6] mt-2" />
                      <p className="text-[#E3D9C6]/70 leading-relaxed">
                        Request must be raised within{" "}
                        <strong className="text-[#E3D9C6]">48 hours of delivery</strong> with
                        unboxing proof
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#E3D9C6] mt-2" />
                      <p className="text-[#E3D9C6]/70 leading-relaxed">
                        Items must be unused, unwashed, with original tags & packaging
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-red-500/20 bg-red-500/5 p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-400 mt-1" />
                    <div>
                      <h4 className="text-red-300 font-medium mb-2">Important Notice</h4>
                      <p className="text-red-200/70">
                        No returns on sale/discounted items unless damaged
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Exchange Policy */}
            <motion.section
              id="exchange"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="scroll-mt-24"
            >
              <div className="border-l-2 border-[#E3D9C6] pl-8 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Package className="w-8 h-8 text-[#E3D9C6]" />
                  <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                    Exchange Policy
                  </h2>
                </div>
                <p className="text-[#E3D9C6]/60 text-lg">Finding your perfect fit</p>
              </div>

              <div className="space-y-6">
                <div className="border border-[#E3D9C6]/20 p-8">
                  <h3 className="text-2xl font-light mb-6 tracking-wide text-[#E3D9C6]">
                    Exchange Process
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center">
                          <span className="text-[#E3D9C6] font-light">1</span>
                        </div>
                        <p className="text-[#E3D9C6]/70 leading-relaxed">
                          Exchanges allowed for <strong className="text-[#E3D9C6]">size issues</strong>
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center">
                          <span className="text-[#E3D9C6] font-light">2</span>
                        </div>
                        <p className="text-[#E3D9C6]/70 leading-relaxed">
                          Subject to stock availability
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center">
                          <span className="text-[#E3D9C6] font-light">3</span>
                        </div>
                        <p className="text-[#E3D9C6]/70 leading-relaxed">
                          Request within <strong className="text-[#E3D9C6]">48 hours of delivery</strong>
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center">
                          <span className="text-[#E3D9C6] font-light">4</span>
                        </div>
                        <p className="text-[#E3D9C6]/70 leading-relaxed">
                          Exchanges allowed <strong className="text-[#E3D9C6]">once per order</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-yellow-500/20 bg-yellow-500/5 p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mt-1" />
                    <div>
                      <h4 className="text-yellow-300 font-medium mb-2">Shipping Costs</h4>
                      <p className="text-yellow-200/70">
                        Customers may be required to bear shipping costs for exchanges
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-24 text-center"
          >
            <div className="border border-[#E3D9C6]/20 p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/5 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-light mb-6">Have Questions?</h3>
                <p className="text-[#E3D9C6]/70 mb-8 max-w-2xl mx-auto">
                  Our customer support team is here to help with any inquiries about shipping,
                  returns, or exchanges
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-4 border border-[#E3D9C6] text-[#E3D9C6] hover:bg-[#E3D9C6] hover:text-[#0A0A0A] transition-all duration-300 tracking-wider uppercase text-sm"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="relative z-10 border-t border-[#E3D9C6]/10 px-6 md:px-12 py-12"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-[#E3D9C6]/40 tracking-wider">
            © 2026 Maagnus Kleid. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link
              href="/about"
              className="text-sm text-[#E3D9C6]/60 hover:text-[#E3D9C6] transition-colors tracking-wider"
            >
              About Us
            </Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}