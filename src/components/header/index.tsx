// components/header/index.tsx - DYNAMIC CATEGORIES

"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/Wrapper";
import Link from "next/link";
import Menu from "./Menu";
import MenuMobile from "./MenuMobile";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

import { BsCart } from "react-icons/bs";
import { BiMenuAltRight } from "react-icons/bi";
import { VscChromeClose } from "react-icons/vsc";
import { IoPersonOutline } from "react-icons/io5";

interface Category {
  id: string;
  name: string;
  slug: string;
  gender: 'Male' | 'Female' | 'Unisex';
}

interface ApiResponse {
  success: boolean;
  data: Category[];
}

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMenCat, setShowMenCat] = useState(false);
  const [showWomenCat, setShowWomenCat] = useState(false);
  const [show, setShow] = useState("translate-y-0");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Dynamic categories state
  const [menCategories, setMenCategories] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [womenCategories, setWomenCategories] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const { itemCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        // Fetch Male categories
        const menResponse = await fetch('/api/categories?gender=Male');
        const menData: ApiResponse = await menResponse.json();

        // Fetch Female categories
        const womenResponse = await fetch('/api/categories?gender=Female');
        const womenData: ApiResponse = await womenResponse.json();

        if (menData.success) {
          const formattedMen = menData.data.map((cat: Category) => ({
            id: cat.id,
            name: cat.name,
            url: `/products/gender/Male/${cat.slug}`,
          }));
          setMenCategories(formattedMen);
        }

        if (womenData.success) {
          const formattedWomen = womenData.data.map((cat: Category) => ({
            id: cat.id,
            name: cat.name,
            url: `/products/gender/Female/${cat.slug}`,
          }));
          setWomenCategories(formattedWomen);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to empty arrays on error
        setMenCategories([]);
        setWomenCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const controlNavbar = useCallback(() => {
    if (window.scrollY > 200) {
      if (window.scrollY > lastScrollY && !mobileMenu) {
        setShow("-translate-y-[80px]");
      } else {
        setShow("shadow-sm");
      }
    } else {
      setShow("translate-y-0");
    }
    setLastScrollY(window.scrollY);
  }, [lastScrollY, mobileMenu]);

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [controlNavbar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      className={`w-full h-15 md:h-20 bg-[#E3D9C6] flex items-center justify-between z-20 sticky top-0 transition-transform duration-300 ${show}`}
    >
      <Wrapper className="h-15 md:h-20 flex justify-between items-center">
        {/* Mobile Menu Icon - LEFT SIDE */}
        <div className="flex md:hidden w-10 h-10 rounded-full justify-center items-center cursor-pointer">
          {mobileMenu ? (
            <VscChromeClose
              className="text-[24px]"
              onClick={() => setMobileMenu(false)}
            />
          ) : (
            <BiMenuAltRight
              className="text-[28px]"
              onClick={() => setMobileMenu(true)}
            />
          )}
        </div>

        {/* Logo - CENTERED ON MOBILE, LEFT ON DESKTOP */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mk.png"
            alt="Maagnus Kleid"
            className="h-80  md:h-40 w-auto object-contain"
          />
        </Link>

        {/* Desktop Menu */}
        {!categoriesLoading && (
          <Menu
            showMenCat={showMenCat}
            setShowMenCat={setShowMenCat}
            showWomenCat={showWomenCat}
            setShowWomenCat={setShowWomenCat}
            subMenuMenData={menCategories}
            subMenuWomenData={womenCategories}
          />
        )}

        {/* Mobile Menu Overlay */}
        {mobileMenu && !categoriesLoading && (
          <MenuMobile
            showMenCat={showMenCat}
            setShowMenCat={setShowMenCat}
            showWomenCat={showWomenCat}
            setShowWomenCat={setShowWomenCat}
            setMobileMenu={setMobileMenu}
            subMenuMenData={menCategories}
            subMenuWomenData={womenCategories}
          />
        )}

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 md:gap-4 text-black">
          {/* Cart Icon - Always visible */}
          <Link href="/cart">
            <div className="w-10 md:w-12 h-10 md:h-12 flex justify-center items-center cursor-pointer relative">
              <BsCart className="text-[22px] md:text-[24px]" />
              {itemCount > 0 && (
                <div className="h-5 w-5 rounded-full bg-red-600 absolute -top-1 -right-2 text-white text-[11px] flex justify-center items-center font-semibold">
                  {itemCount}
                </div>
              )}
            </div>
          </Link>

          {/* User Icon with Dropdown - Hidden on mobile, visible on md+ */}
          <div className="relative user-menu-container hidden md:block">
            {isLoggedIn ? (
              <>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 md:w-12 h-10 md:h-12 flex justify-center items-center cursor-pointer"
                >
                  <IoPersonOutline className="text-[24px] md:text-[26px]" />
                </div>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#E3D9C6] border border-gray-200 rounded-lg shadow-lg py-2 z-30">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    >
                      My Orders
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login">
                <div className="w-10 md:w-12 h-10 md:h-12 flex justify-center items-center cursor-pointer">
                  <IoPersonOutline className="text-[24px] md:text-[26px]" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </Wrapper>
    </header>
  );
};

export default Header;