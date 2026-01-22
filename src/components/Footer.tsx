import React from 'react';
import { Instagram } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Customer Service */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">
              CUSTOMER SERVICE
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/contact"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Track Order
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">
              COMPANY
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/about"
                  className="hover:text-yellow-400 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">
              CONNECT WITH US
            </h3>

            <a
              href="https://www.instagram.com/maagnuskleid?igsh=ZTJzemQ2dnpxeXFz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:text-yellow-400 transition-colors"
            >
              <Instagram className="w-6 h-6" />
              <span className="text-sm">Follow us on Instagram</span>
            </a>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-yellow-400 font-bold text-sm mb-3">
              100% SECURE PAYMENT
            </h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-[#E3D9C6] px-2 py-1 rounded">
                <span className="text-xs font-bold text-gray-700">G Pay</span>
              </div>
              <div className="bg-[#E3D9C6] px-2 py-1 rounded">
                <span className="text-xs font-bold text-blue-600">Paytm</span>
              </div>
              <div className="bg-[#E3D9C6] px-2 py-1 rounded">
                <span className="text-xs font-bold text-purple-600">
                  PhonePe
                </span>
              </div>
              <div className="bg-[#E3D9C6] px-2 py-1 rounded">
                <span className="text-xs font-bold text-blue-800">VISA</span>
              </div>
              <div className="bg-[#E3D9C6] px-2 py-1 rounded">
                <span className="text-xs font-bold text-orange-500">
                  RuPay
                </span>
              </div>
              <div className="bg-[#E3D9C6] px-2 py-1 rounded flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <div className="w-4 h-4 rounded-full bg-orange-500 -ml-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="border-t border-gray-800 pt-8">
          <Link href="/">
            <Image
              src="/logo4.png"
              alt="Logo"
              width={320}
              height={60}
              className="object-contain mt-2"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
