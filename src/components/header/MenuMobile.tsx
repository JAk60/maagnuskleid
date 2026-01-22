// components/MenuMobile.tsx

import React from "react";
import Link from "next/link";
import { BsChevronDown } from "react-icons/bs";

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
  const data = [
    { id: 1, name: "Home", url: "/" },
    // { id: 2, name: "All Products", url: "/products" },
    { id: 3, name: "Men", subMenu: true },
    { id: 4, name: "Women", subMenu: true },
  ];

  return (
    <ul className="flex flex-col md:hidden font-bold absolute top-[50px] left-0 w-full h-[calc(100vh-50px)] bg-[#E3D9C6] border-t text-black">
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
    </ul>
  );
};

export default MenuMobile;