// components/MenuMobile.tsx

import React from "react";
import Link from "next/link";
import { BsChevronDown } from "react-icons/bs";
import { IoPersonOutline } from "react-icons/io5";
import { useAuth } from "@/context/auth-context";

interface MenuMobileProps {
  showMenCat: boolean;
  setShowMenCat: (show: boolean) => void;
  showWomenCat: boolean;
  setShowWomenCat: (show: boolean) => void;
  setMobileMenu: (show: boolean) => void;
  subMenuMenData: Array<{ id: string; name: string; url: string }>;
  subMenuWomenData: Array<{ id: string; name: string; url: string }>;
}

const MenuMobile: React.FC<MenuMobileProps> = ({
  showMenCat,
  setShowMenCat,
  showWomenCat,
  setShowWomenCat,
  setMobileMenu,
  subMenuMenData,
  subMenuWomenData,
}) => {
  const { user, isLoggedIn, logout } = useAuth();

  const data = [
    { id: 1, name: "Home", url: "/" },
    // { id: 2, name: "All Products", url: "/products" },
    { id: 3, name: "Men", subMenu: true },
    { id: 4, name: "Women", subMenu: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ul className="flex flex-col md:hidden font-bold absolute top-[50px] left-0 w-full h-[calc(100vh-50px)] bg-[#E3D9C6] border-t text-black overflow-y-auto">
      {/* User Section - Only show if logged in */}
      {isLoggedIn && user && (
        <li className="border-b bg-[#D4C5B0]">
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E3D9C6] flex items-center justify-center">
              <IoPersonOutline className="text-[22px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          </div>
        </li>
      )}

      {/* Main Menu Items */}
      {data.map((item) => {
        return (
          <React.Fragment key={item.id}>
            {!!item?.subMenu ? (
              <li
                className="cursor-pointer py-4 px-5 border-b flex flex-col relative"
                onClick={() => {
                  if (item.name === "Men") setShowMenCat(!showMenCat);
                  if (item.name === "Women") setShowWomenCat(!showWomenCat);
                }}
              >
                <div className="flex justify-between items-center">
                  {item.name}
                  <BsChevronDown size={14} />
                </div>

                {item.name === "Men" && showMenCat && (
                  <ul className="bg-[#E3D9C6]/5 -mx-5 mt-4 -mb-4">
                    {subMenuMenData.map((submenu) => {
                      return (
                        <Link
                          key={submenu.id}
                          href={submenu.url}
                          onClick={() => {
                            setShowMenCat(false);
                            setMobileMenu(false);
                          }}
                        >
                          <li className="py-4 px-8 border-t flex justify-between">
                            {submenu.name}
                          </li>
                        </Link>
                      );
                    })}
                  </ul>
                )}

                {item.name === "Women" && showWomenCat && (
                  <ul className="bg-[#E3D9C6]/5 -mx-5 mt-4 -mb-4">
                    {subMenuWomenData.map((submenu) => {
                      return (
                        <Link
                          key={submenu.id}
                          href={submenu.url}
                          onClick={() => {
                            setShowWomenCat(false);
                            setMobileMenu(false);
                          }}
                        >
                          <li className="py-4 px-8 border-t flex justify-between">
                            {submenu.name}
                          </li>
                        </Link>
                      );
                    })}
                  </ul>
                )}
              </li>
            ) : (
              <li className="py-4 px-5 border-b">
                <Link href={item?.url || "/"} onClick={() => setMobileMenu(false)}>
                  {item.name}
                </Link>
              </li>
            )}
          </React.Fragment>
        );
      })}

      {/* User Account Links - Show if logged in */}
      {isLoggedIn ? (
        <>
          <li className="py-4 px-5 border-b">
            <Link href="/profile" onClick={() => setMobileMenu(false)}>
              My Profile
            </Link>
          </li>

          <li className="py-4 px-5 border-b">
            <Link href="/orders" onClick={() => setMobileMenu(false)}>
              My Orders
            </Link>
          </li>

          <li className="py-4 px-5 border-b">
            <button
              onClick={handleLogout}
              className="w-full text-left text-red-600"
            >
              Logout
            </button>
          </li>
        </>
      ) : (
        // Login Link - Show if not logged in
        <li className="py-4 px-5 border-b">
          <Link href="/login" onClick={() => setMobileMenu(false)}>
            <div className="flex items-center gap-2">
              <IoPersonOutline className="text-[20px]" />
              <span>Login / Sign Up</span>
            </div>
          </Link>
        </li>
      )}
    </ul>
  );
};

export default MenuMobile;
