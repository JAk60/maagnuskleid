"use client"

import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { useState } from "react"

export function Navbar() {
  const { items } = useCart()
  const { isLoggedIn, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="sticky top-0 z-50 bg-[#E3D9C6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-sm font-semibold text-gray-900">
            Logo
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
              Home
            </Link>

            {/* Male's Dropdown */}
            <div className="relative group">
              <button className="text-sm text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-1">
                Male
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-[#E3D9C6] border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Shirts
                </Link>
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Jeans
                </Link>
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Trousers
                </Link>
              </div>
            </div>

            {/* Female's Dropdown */}
            <div className="relative group">
              <button className="text-sm text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-1">
                Female
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-[#E3D9C6] border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Tops
                </Link>
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Jeans
                </Link>
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
                  Trousers
                </Link>
              </div>
            </div>


            <Link href="/about" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
              About
            </Link>
            <Link href="/" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
              Contact
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* User Icon */}
            <button className="w-6 h-6 flex items-center justify-center text-gray-900 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative">
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Auth */}
            {isLoggedIn ? (
              <button onClick={logout} className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                Logout
              </button>
            ) : (
              <Link href="/login" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-6 h-6 flex items-center justify-center text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <Link href="/" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
              Home
            </Link>
            <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
              Male
            </Link>
            <Link href="/products" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
              Female
            </Link>
            <Link href="/about" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
              About
            </Link>
            <Link href="/" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50">
              Contact
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
