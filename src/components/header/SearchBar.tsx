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
        }} className="absolute left-0 right-0 top-full border-t border-gray-100 px-10 xl:px-16 py-3 bg-gray-50 z-40 flex items-center gap-3 shadow-sm">
          <label htmlFor="site-search" className="sr-only">Search</label>
          <input
            id="site-search"
            autoFocus
            type="search"
            enterKeyHint="search"
            name="q"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm outline-none text-black placeholder-gray-400 py-2"
          />
          <button 
            type="submit" 
            aria-label="Submit search" 
            className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>
      )}
    </>
  );
}
