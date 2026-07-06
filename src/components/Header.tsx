"use client";

import Link from "next/link";
import useSWR from "swr";
import Image from "next/image";
import { NavCategory } from "./header/types";
import DesktopNav from "./header/DesktopNav";
import MobileMenu from "./header/MobileMenu";
import UserActions from "./header/UserActions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Header() {
  const { data } = useSWR('/api/categories/nav', fetcher, { 
    revalidateOnFocus: false, // Nav doesn't change often
    dedupingInterval: 600000 // 10 minutes
  });
  
  const navTree: NavCategory[] = data?.success ? data.data : [];

  // Build a quick lookup: level-0 slug → NavCategory
  const navTreeBySlug = new Map(navTree.map(c => [c.slug, c]));

  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 md:px-10 xl:px-16 relative">
        {/* Single row: Mobile Menu Toggle | Logo | Desktop Nav | Icons */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-4 gap-3 lg:flex lg:justify-between lg:gap-3">
          
          {/* Mobile menu (Hamburger and Drawer) */}
          <MobileMenu navTreeBySlug={navTreeBySlug} />

          {/* LEFT — Logo */}
          <Link href="/" aria-label="Home" className="justify-self-center lg:justify-self-auto flex-shrink-0 relative w-[120px] h-[48px] flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={200}
              height={80}
              className="object-contain absolute translate-y-3 lg:scale-[1] lg:-translate-x-10 lg:translate-y-3"
              priority
            />
          </Link>

          {/* CENTER — Desktop Nav */}
          <DesktopNav navTreeBySlug={navTreeBySlug} />

          {/* RIGHT — Search, Wishlist, Cart, Profile */}
          <UserActions />
          
        </div>
      </div>
    </header>
  );
}
