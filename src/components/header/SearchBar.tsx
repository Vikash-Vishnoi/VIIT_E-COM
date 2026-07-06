"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  return (
    <>
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

      {/* Expandable Search bar */}
      {searchOpen && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
          }
        }} className="absolute left-0 right-0 top-full border-t border-gray-100 px-10 xl:px-16 py-3 bg-gray-50 z-40">
          <label htmlFor="site-search" className="sr-only">Search</label>
          <input
            id="site-search"
            autoFocus
            type="text"
            name="q"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none text-black"
          />
        </form>
      )}
    </>
  );
}
