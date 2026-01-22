// app/privacy/page.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Mail, Phone, User, MapPin, Target, ShieldCheck, CheckCircle, Heart } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E3D9C6]">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #E3D9C6 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
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
            className="mb-16"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6">
              Privacy<br />Policy
            </h1>
            <div className="w-32 h-1 bg-linear-to-r from-[#E3D9C6] to-transparent" />
            <p className="mt-8 text-xl text-[#E3D9C6]/70 max-w-3xl">
              Your privacy and trust matter to us. We are committed to protecting your personal information.
            </p>
          </motion.div>

          {/* Core Principle */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-20"
          >
            <div className="border-2 border-[#E3D9C6]/30 p-10 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/10 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="w-10 h-10 text-[#E3D9C6]" />
                  <h2 className="text-3xl md:text-4xl font-light tracking-tight">Our Commitment</h2>
                </div>
                <p className="text-xl leading-relaxed text-[#E3D9C6]/90 mb-4">
                  We <strong className="text-[#E3D9C6]">strongly support our customers' privacy</strong> and their faith in us.
                </p>
                <p className="text-lg leading-relaxed text-[#E3D9C6]/70">
                  We do not share, sell, or distribute your information to anyone. Your data is collected solely to serve you better and improve our services.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Information We Collect */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mb-20"
          >
            <div className="border-l-2 border-[#E3D9C6] pl-8 mb-10">
              <div className="flex items-center gap-4 mb-4">
                <Eye className="w-8 h-8 text-[#E3D9C6]" />
                <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                  Information We Collect
                </h2>
              </div>
              <p className="text-[#E3D9C6]/60 text-lg">
                We collect only essential information required for delivery and communication
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: User,
                  title: "Name",
                  desc: "To address you personally and confirm your identity",
                },
                {
                  icon: Mail,
                  title: "Email Address",
                  desc: "For order confirmations, updates, and communication",
                },
                {
                  icon: Phone,
                  title: "Phone Number",
                  desc: "To contact you regarding delivery and order issues",
                },
                {
                  icon: MapPin,
                  title: "Delivery Address",
                  desc: "Essential for shipping your orders to the right location",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                  className="border border-[#E3D9C6]/20 p-6 hover:border-[#E3D9C6]/40 transition-all duration-500 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center shrink-0 group-hover:bg-[#E3D9C6]/20 transition-colors">
                      <item.icon className="w-6 h-6 text-[#E3D9C6]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-light mb-2 text-[#E3D9C6]">{item.title}</h3>
                      <p className="text-[#E3D9C6]/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* How We Use Your Data */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mb-20"
          >
            <div className="border-l-2 border-[#E3D9C6] pl-8 mb-10">
              <div className="flex items-center gap-4 mb-4">
                <Target className="w-8 h-8 text-[#E3D9C6]" />
                <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                  How We Use Your Information
                </h2>
              </div>
              <p className="text-[#E3D9C6]/60 text-lg">
                All data is used to analyze our capabilities and serve our customers better
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: "Order Processing & Delivery",
                  desc: "We use your name, phone number, and address to process and deliver your orders accurately and efficiently.",
                },
                {
                  title: "Customer Communication",
                  desc: "Your email and phone number help us keep you updated about order status, shipping, and important notifications.",
                },
                {
                  title: "Service Improvement",
                  desc: "We analyze collected data to understand our incapabilities, improve our services, and enhance your shopping experience.",
                },
                {
                  title: "Customer Support",
                  desc: "Your information enables us to provide personalized support and resolve any issues you may encounter.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 + i * 0.1 }}
                  className="border border-[#E3D9C6]/20 p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#E3D9C6] mt-2 shrink-0" />
                    <div>
                      <h3 className="text-xl font-light mb-3 text-[#E3D9C6]">{item.title}</h3>
                      <p className="text-[#E3D9C6]/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Data Security */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mb-20"
          >
            <div className="border-l-2 border-[#E3D9C6] pl-8 mb-10">
              <div className="flex items-center gap-4 mb-4">
                <Lock className="w-8 h-8 text-[#E3D9C6]" />
                <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                  Data Security & Protection
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "No Third-Party Sharing",
                  desc: "We never share, sell, or distribute your information to third parties",
                },
                {
                  icon: Eye,
                  title: "Internal Use Only",
                  desc: "Your data is strictly used within Maagnus Kleid for operational purposes",
                },
                {
                  icon: Lock,
                  title: "Secure Storage",
                  desc: "We implement industry-standard security measures to protect your data",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 + i * 0.1 }}
                  className="border border-[#E3D9C6]/20 p-8 text-center hover:border-[#E3D9C6]/40 transition-all duration-500 group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#E3D9C6]/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#E3D9C6]/20 transition-colors">
                    <item.icon className="w-8 h-8 text-[#E3D9C6]" />
                  </div>
                  <h3 className="text-xl font-light mb-3 text-[#E3D9C6]">{item.title}</h3>
                  <p className="text-[#E3D9C6]/70 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Your Rights */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mb-20"
          >
            <div className="border-l-2 border-[#E3D9C6] pl-8 mb-10">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle className="w-8 h-8 text-[#E3D9C6]" />
                <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                  Your Rights
                </h2>
              </div>
              <p className="text-[#E3D9C6]/60 text-lg">
                You have full control over your personal information
              </p>
            </div>

            <div className="border border-[#E3D9C6]/20 p-8 md:p-10">
              <div className="space-y-6">
                {[
                  "Access your personal data at any time",
                  "Request corrections to your information",
                  "Request deletion of your account and data",
                  "Opt out of promotional communications",
                  "Contact us with privacy concerns or questions",
                ].map((right, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-[#E3D9C6] shrink-0 mt-1" />
                    <p className="text-lg text-[#E3D9C6]/90">{right}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-center py-16"
          >
            <div className="border-2 border-[#E3D9C6]/30 p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-[#E3D9C6]/10 via-transparent to-[#E3D9C6]/5" />
              <div className="relative z-10">
                <Heart className="w-16 h-16 text-[#E3D9C6] mx-auto mb-8" />
                <h3 className="text-3xl md:text-4xl font-light mb-6">Built on Trust</h3>
                <p className="text-xl leading-relaxed text-[#E3D9C6]/80 max-w-3xl mx-auto mb-8">
                  Your faith in us is the foundation of our brand. We honor that trust by keeping your information private, secure, and used only to enhance your experience with Maagnus Kleid.
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-4 border border-[#E3D9C6] text-[#E3D9C6] hover:bg-[#E3D9C6] hover:text-[#0A0A0A] transition-all duration-300 tracking-wider uppercase text-sm"
                >
                  Shop with Confidence
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            className="text-center"
          >
            <div className="border border-[#E3D9C6]/20 p-10">
              <h3 className="text-2xl font-light mb-4">Questions About Privacy?</h3>
              <p className="text-[#E3D9C6]/70 mb-6 max-w-2xl mx-auto">
                If you have any questions or concerns about how we handle your data, please don't hesitate to reach out to us.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[#E3D9C6] hover:text-[#E3D9C6]/80 transition-colors"
              >
                <span className="tracking-wider uppercase text-sm">Contact Us</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.9 }}
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