"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type NavLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

const navLinks: NavLink[] = [
  { label: "MEN CLOTHES", href: "/men-clothes" },
  { label: "WOMEN CLOTHES", href: "/women-clothes" },
  { label: "ACCESSORIES", href: "/accessories" },
];

export default function Header() {
  const [cartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-10 xl:px-16">
        {/* Single row: Logo | Nav | Icons */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-4 gap-3 md:flex md:justify-between md:gap-3">

          {/* Mobile menu */}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden justify-self-start text-black hover:opacity-60 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* LEFT — Logo */}
          <Link href="/" aria-label="Home" className="justify-self-center md:justify-self-auto flex-shrink-0 relative w-[120px] h-[48px] flex items-center justify-center">
            <Image
              src="/images/logo-dark-transparent.png"
              alt="Logo"
              width={200}
              height={80}
              className="object-contain absolute scale-[1.25] -mt-10"
              priority
            />
          </Link>

          {/* CENTER — Nav links */}
          <nav className="hidden md:flex items-center gap-7 mx-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap ${link.highlight ? "text-[#FFCC00]" : "text-black"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT — Icons */}
          <div className="col-start-3 flex items-center gap-4 md:gap-5 flex-shrink-0">

            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              className="text-black hover:opacity-60 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </button>

            {/* Account */}
            <button aria-label="Account" className="text-black hover:opacity-60 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Wishlist */}
            <button aria-label="Wishlist" className="text-black hover:opacity-60 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Cart */}
            <button aria-label="Cart" className="relative text-black hover:opacity-60 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold leading-none">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search bar */}
      {searchOpen && (
        <div className="border-t border-gray-100 px-10 xl:px-16 py-3 bg-gray-50">
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none text-black placeholder-gray-400"
          />
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 bg-white">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 ${link.highlight ? "text-[#FFCC00]" : "text-black"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
