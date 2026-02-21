// src/app/layout.tsx  <-- no 'use client' here
import ConditionalLayout from "./ConditionalLayout"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import MetaPixel from "@/components/MetaPixel"
import localFont from "next/font/local"
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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={paragraph.variable}>
      <body>
        <MetaPixel />
        <AuthProvider>
          <CartProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}