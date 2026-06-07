"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

const navLinks: NavLink[] = [
  { label: "VIIT Exclusive", href: "/viit-exclusive" },
  { label: "WOMAN", href: "/woman" },
  { label: "MAN", href: "/man" },
  { label: "KIDS", href: "/kids" },
  { label: "ACCESSORIES", href: "/accessories" },
];

type DropdownItem = {
  label: string;
  href: string;
};

const kidsDropdownItems: DropdownItem[] = [
  { label: "Girls' Dresses", href: "/kids/kids-clothing/girls-dresses" },
  { label: "Party Princess", href: "/kids/kids-clothing/party-princess" },
  { label: "Casual Cuties", href: "/kids/kids-clothing/casual-cuties" },
  { label: "Mini Occasion Wear", href: "/kids/kids-clothing/mini-occasion" },
];

const accessoriesDropdownItems: DropdownItem[] = [
  { label: "Brooches", href: "/accessories/accessories-collection/brooches" },
  { label: "Silk Stories (scarves)", href: "/accessories/accessories-collection/silk-stories" },
  { label: "Leg Couture (stockings)", href: "/accessories/accessories-collection/leg-couture" },
  { label: "Hand Luxe (gloves)", href: "/accessories/accessories-collection/hand-luxe" },
];

const womenDropdownItems: DropdownItem[] = [
  { label: "Casual Edit", href: "/woman/woman-edits/casual-edit" },
  { label: "Summer Stories", href: "/woman/woman-edits/summer-stories" },
  { label: "Winter Luxe", href: "/woman/woman-edits/winter-luxe" },
  { label: "Party Icons", href: "/woman/woman-edits/party-icons" },
  { label: "Street Muse", href: "/woman/woman-edits/street-muse" },
  { label: "Club Nights", href: "/woman/woman-edits/club-nights" },
  { label: "Mall Edit", href: "/woman/woman-edits/mall-edit" },
  { label: "Date Night", href: "/woman/woman-edits/date-night" },
  { label: "Dinner Glam", href: "/woman/woman-edits/dinner-glam" },
  { label: "Resort Escape", href: "/woman/woman-edits/resort-escape" },
  { label: "Vacation Edit", href: "/woman/woman-edits/vacation-edit" },
  { label: "Lounge Luxe", href: "/woman/woman-edits/lounge-luxe" },
  { label: "Work Chic", href: "/woman/woman-edits/work-chic" },
  { label: "Evening Affair", href: "/woman/woman-edits/evening-affair" },
  { label: "Statement Looks", href: "/woman/woman-edits/statement-looks" },
  { label: "New Arrivals", href: "/woman/woman-edits/new-arrivals" },
];

const womenEssentialsDropdownItems: DropdownItem[] = [
  { label: "Denim Edit", href: "/woman/woman-essentials/denim" },
  { label: "Jeans", href: "/woman/woman-essentials/womens-jeans" },
  { label: "Shorts", href: "/woman/woman-essentials/shorts" },
  { label: "Trousers", href: "/woman/woman-essentials/womens-trousers" },
  { label: "Pants", href: "/woman/woman-essentials/pants" },
  { label: "Skirts", href: "/woman/woman-essentials/skirts" },
  { label: "Bodysuits", href: "/woman/woman-essentials/bodysuits" },
  { label: "Tops", href: "/woman/woman-essentials/tops" },
  { label: "Shirts", href: "/woman/woman-essentials/shirts" },
  { label: "Co-ord Sets", href: "/woman/woman-essentials/coords" },
  { label: "Dresses", href: "/woman/woman-essentials/dresses" },
  { label: "Kaftans", href: "/woman/woman-essentials/kaftans" },
  { label: "Jumpsuits", href: "/woman/woman-essentials/jumpsuits" },
  { label: "Blazers", href: "/woman/woman-essentials/blazers" },
  { label: "Knitwear", href: "/woman/woman-essentials/knitwear" },
];
const manDenimDropdownItems: DropdownItem[] = [
  { label: "Denim Jacket", href: "/man/man-denim/jacket" },
  { label: "Denim Jeans", href: "/man/man-denim/mens-jeans" },
];

const manDropdownItems: DropdownItem[] = [
  { label: "T-Shirts", href: "/man/man-casual/tshirt" },
  { label: "Linen Shirts", href: "/man/man-linen/shirt" },
];

type NavDropdownSimple = {
  layout: "simple";
  items: DropdownItem[];
  imageSrc: string;
  imageAlt: string;
};

type NavDropdownTwoColumn = {
  layout: "two-column";
  columns: {
    title: string;
    items: DropdownItem[];
  }[];
  imageSrc: string;
  imageAlt: string;
};

type NavDropdown = NavDropdownSimple | NavDropdownTwoColumn;

const navDropdowns: Partial<Record<string, NavDropdown>> = {
  KIDS: {
    layout: "simple",
    items: kidsDropdownItems,
    imageSrc: "/images/about.jpeg",
    imageAlt: "Kids collection preview",
  },
  ACCESSORIES: {
    layout: "simple",
    items: accessoriesDropdownItems,
    imageSrc: "/images/about.jpeg",
    imageAlt: "Accessories collection preview",
  },
  WOMAN: {
    layout: "two-column",
    columns: [
      { title: "Women", items: womenDropdownItems },
      { title: "Women - Denim & Essentials", items: womenEssentialsDropdownItems },
    ],
    imageSrc: "/images/woman-header.jpeg",
    imageAlt: "Women collection preview",
  },
  MAN: {
    layout: "two-column",
    columns: [
      { title: "Denim", items: manDenimDropdownItems },
      { title: "Man", items: manDropdownItems },
    ],
    imageSrc: "/images/man-header.jpeg",
    imageAlt: "Men collection preview",
  },
};

type NavLabelWithArrowProps = {
  label: string;
};

function NavLabelWithArrow({ label }: NavLabelWithArrowProps) {
  return (
    <span className="inline-flex items-center">
      {label}
      <svg
        className="ml-1 h-7 w-7 transition-transform duration-200 group-hover:rotate-180"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
      </svg>
    </span>
  );
}

export default function Header() {
  const cartCount = 0;
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const fetchWishlistCount = () => {
    fetch('/api/user/wishlist')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setWishlistCount(data.data.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const fetchAuth = () => {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(async data => {
          if (data.success) {
            setUser(data.user);
            
            // Process pending wishlist action if exists
            const pendingProductId = sessionStorage.getItem('pendingWishlistAction');
            if (pendingProductId) {
              sessionStorage.removeItem('pendingWishlistAction');
              try {
                await fetch('/api/user/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: pendingProductId })
                });
                window.dispatchEvent(new Event('wishlist-change'));
              } catch (err) {}
            }
            
            fetchWishlistCount();
          } else {
            setUser(null);
            setWishlistCount(0);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAuth(false));
    };

    fetchAuth();

    const handleAuthChange = () => fetchAuth();
    
    // Listen for custom event payloads to update counter instantly without an API call
    const handleWishlistChange = (e: any) => {
      if (e.detail && e.detail.action) {
        setWishlistCount(prev => e.detail.action === 'added' ? prev + 1 : Math.max(0, prev - 1));
      } else {
        fetchWishlistCount();
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('wishlist-change', handleWishlistChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('wishlist-change', handleWishlistChange);
    };
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-10 xl:px-16">
        {/* Single row: Logo | Nav | Icons */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-4 gap-3 md:flex md:justify-between md:gap-3">

          {/* Mobile menu — hidden on admin */}
          {!isAdmin && (
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
          )}

          {/* LEFT — Logo */}
          <Link href="/" aria-label="Home" className="justify-self-center md:justify-self-auto flex-shrink-0 relative w-[120px] h-[48px] flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={200}
              height={80}
              className="object-contain absolute scale-[1] -translate-x-10 translate-y-3"
              priority
            />
          </Link>

          {/* CENTER — Nav links — hidden on admin */}
          {!isAdmin && (
            <nav key={pathname} className="hidden md:flex items-center gap-7 mx-8">
              {navLinks.map((link) => {
                const dropdown = navDropdowns[link.label];

                if (dropdown) {
                  if (dropdown.layout === "two-column") {
                    return (
                      <div key={link.label} className="group">
                        <Link
                          href={link.href}
                          className={`relative inline-flex text-[15px] font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 ${link.highlight ? "text-[#FFCC00] after:bg-[#FFCC00]" : "text-black after:bg-current"
                            }`}
                        >
                          <NavLabelWithArrow label={link.label} />
                        </Link>
                        <div className="absolute left-0 right-0 top-full mt-0 w-screen rounded-lg border border-gray-200 bg-white shadow-lg pt-4 opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto z-50 before:absolute before:left-0 before:right-0 before:-top-10 before:h-10 before:content-[''] before:block">
                          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-6 px-5 pb-5">
                            <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                              <Image
                                src={dropdown.imageSrc}
                                alt={dropdown.imageAlt}
                                fill
                                className="rounded-md object-cover"
                              />
                            </div>
                            {dropdown.columns.map((column) => (
                              <div key={column.title} className="min-w-0">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                                  {column.title}
                                </div>
                                <div className="flex flex-col gap-2">
                                  {column.items.map((item) => (
                                    <Link
                                      key={item.label}
                                      href={item.href}
                                      className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={link.label} className="group">
                      <Link
                        href={link.href}
                        className={`relative inline-flex text-[15px] font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 ${link.highlight ? "text-[#FFCC00] after:bg-[#FFCC00]" : "text-black after:bg-current"
                          }`}
                      >
                        <NavLabelWithArrow label={link.label} />
                      </Link>
                      <div className="absolute left-0 right-0 top-full mt-0 w-screen rounded-lg border border-gray-200 bg-white shadow-lg pt-4 opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto z-50 before:absolute before:left-0 before:right-0 before:-top-10 before:h-10 before:content-[''] before:block">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 px-5 pb-5">
                          <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                            <Image
                              src={dropdown.imageSrc}
                              alt={dropdown.imageAlt}
                              fill
                              className="rounded-md object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            {dropdown.items.map((item) => (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4 whitespace-nowrap"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`group text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap ${link.highlight ? "text-[#FFCC00]" : "text-black"
                      }`}
                  >
                    <NavLabelWithArrow label={link.label} />
                  </Link>
                );
              })}
            </nav>
          )}

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

            {/* Wishlist */}
            <Link href="/wishlist" aria-label="Wishlist" className="relative text-black hover:opacity-60 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

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
            
            {/* Account */}
            {!loadingAuth && user ? (
              <Link href="/profile" aria-label="Account" className="text-black hover:opacity-60 transition-opacity flex items-center justify-center min-w-[40px]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            ) : !loadingAuth && !user ? (
              <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} aria-label="Login / Register" className="flex items-center gap-2 text-black hover:opacity-60 transition-opacity">
                <span className="text-[12px] font-bold uppercase tracking-widest whitespace-nowrap">Login / Register</span>
              </Link>
            ) : (
              <div className="w-[120px] h-[20px] animate-pulse bg-gray-100 rounded"></div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search bar — hidden on admin */}
      {!isAdmin && searchOpen && (
        <div className="border-t border-gray-100 px-10 xl:px-16 py-3 bg-gray-50">
          <label htmlFor="site-search" className="sr-only">Search</label>
          <input
            id="site-search"
            autoFocus
            type="text"
            name="q"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none text-black placeholder-gray-400"
          />
        </div>
      )}

      {/* Mobile menu drawer — hidden on admin */}
      {!isAdmin && mobileMenuOpen && (
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
