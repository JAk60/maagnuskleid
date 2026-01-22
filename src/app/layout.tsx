'use client'
import Footer from "@/components/Footer"
import Header from "@/components/header"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import localFont from "next/font/local"
import { usePathname } from 'next/navigation'
import type React from "react"
import "./globals.css"


const paragraph = localFont({
  src: [
    {
      path: '../../public/fonts/Paragraph.otf',
      weight: '400',
      style: 'normal',
    }
  ],
  variable: '--font-paragraph',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <html lang="en" className={paragraph.variable}>
      <body className={`--font-paragraph`}>
        <AuthProvider>
          <CartProvider>
            {!isAdminRoute && <Header />}
            {children}
            {!isAdminRoute && <Footer />}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}