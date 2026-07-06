"use client";

import { useState } from "react";
import Link from "next/link";
import { NavCategory, navLinks } from "./types";

export default function MobileMenu({ navTreeBySlug }: { navTreeBySlug: Map<string, NavCategory> }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSlug, setMobileExpandedSlug] = useState<string | null>(null);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setMobileExpandedSlug(null);
  };

  return (
    <>
      <button
        onClick={() => { setMobileMenuOpen((open) => !open); setMobileExpandedSlug(null); }}
        aria-label="Open menu"
        aria-expanded={mobileMenuOpen}
        className="lg:hidden justify-self-start text-black hover:opacity-60 transition-opacity"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white absolute top-full left-0 right-0 w-full z-50">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Menu</span>
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="text-black hover:opacity-60 transition-opacity p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col px-5 py-2 max-h-[80vh] overflow-y-auto">
            {navLinks.map((link) => {
              const cat = navTreeBySlug.get(link.slug);
              const hasChildren = cat && cat.children.length > 0;
              const isExpanded = mobileExpandedSlug === link.slug;

              return (
                <div key={link.label} className="border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex-1 py-3.5 text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 ${link.highlight ? "text-[#FFCC00]" : "text-black"}`}
                    >
                      {link.label}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => setMobileExpandedSlug(isExpanded ? null : link.slug)}
                        aria-label={isExpanded ? `Collapse ${link.label}` : `Expand ${link.label}`}
                        className="p-3 text-gray-400 hover:text-black transition-colors"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="pb-3 pl-2 flex flex-col">
                      {cat.children.map((sub) => (
                        <div key={sub._id}>
                          <Link
                            href={`/${link.slug}/${sub.slug}`}
                            onClick={closeMenu}
                            className="block py-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
                          >
                            {sub.label}
                          </Link>
                          {sub.children.length > 0 && (
                            <div className="pl-4 flex flex-col">
                              {sub.children.map((subsub) => (
                                <Link
                                  key={subsub._id}
                                  href={`/${link.slug}/${sub.slug}/${subsub.slug}`}
                                  onClick={closeMenu}
                                  className="block py-1.5 text-xs text-gray-500 hover:text-black transition-colors"
                                >
                                  {subsub.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
