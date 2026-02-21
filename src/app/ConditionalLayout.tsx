// src/components/ConditionalLayout.tsx
'use client'

import Header from "@/components/header"
import Footer from "@/components/Footer"
import { usePathname } from 'next/navigation'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && <Footer />}
    </>
  )
}