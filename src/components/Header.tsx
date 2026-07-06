"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  MapPin, 
  Package, 
  ShieldCheck, 
  LogOut
} from "lucide-react";

// ── Level-0 nav links are HARDCODED (these are the fixed top-level categories) ──
type NavLink = {
  label: string;
  href: string;
  slug: string;          // matches SubCategory.slug for DB tree lookup
  highlight?: boolean;
};

const navLinks: NavLink[] = [
  { label: "VIIT EXCLUSIVE", href: "/viit-exclusive", slug: "viit-exclusive" },
  { label: "WOMAN",          href: "/woman",          slug: "woman" },
  { label: "MAN",            href: "/man",            slug: "man" },
  { label: "KIDS",           href: "/kids",           slug: "kids" },
  { label: "ACCESSORIES",    href: "/accessories",    slug: "accessories" },
  { label: "HANDBAG",        href: "/handbag",        slug: "handbag" },
];

// ── Hardcoded header images per level-0 slug ──
const HEADER_IMAGES: Record<string, { src: string; alt: string }> = {
  woman:          { src: '/images/woman-header.jpeg',    alt: 'Women collection'    },
  man:            { src: '/images/man-header.jpeg',      alt: 'Men collection'      },
  kids:           { src: '/images/kids.PNG',             alt: 'Kids collection'     },
  accessories:    { src: '/images/accessories.PNG',      alt: 'Accessories'         },
  handbag:        { src: '/images/hand-bag.PNG',         alt: 'Hand Bags'           },
  'viit-exclusive': { src: '/images/viit-exclusive.PNG', alt: 'VIIT Exclusive'      },
};

// ── Types returned by /api/categories/nav ──
type NavSubSubCategory = {
  _id: string; slug: string; label: string; level: 2; parentId: string;
};

type NavSubCategory = {
  _id: string; slug: string; label: string; level: 1; parentId: string; image?: string;
  children: NavSubSubCategory[];
};

type NavCategory = {
  _id: string; slug: string; label: string; level: 0; image?: string;
  children: NavSubCategory[];
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
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSlug, setMobileExpandedSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  // ── Dynamic category tree fetched from DB ──
  const [navTree, setNavTree] = useState<NavCategory[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const fetchWishlistCount = () => {
    fetch('/api/user/wishlist')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setWishlistCount(data.data.length);
          // Cache the IDs globally for zero-network ProductCard checks
          const ids = data.data.map((item: any) => item.productId?._id || item.productId);
          (window as any).__wishlistIds = new Set(ids);
          window.dispatchEvent(new Event('wishlist-loaded'));
        }
      })
      .catch(() => {});
  };

  const fetchCartCount = () => {
    fetch('/api/user/cart')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Calculate total items (sum of quantities)
          const total = data.data.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartCount(total);
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

            // Process pending cart action if exists
            const pendingCartAction = sessionStorage.getItem('pendingCartAction');
            if (pendingCartAction) {
              sessionStorage.removeItem('pendingCartAction');
              try {
                await fetch('/api/user/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: pendingCartAction
                });
                window.dispatchEvent(new Event('cart-change'));
              } catch (err) {}
            }
            
            fetchWishlistCount();
            fetchCartCount();
          } else {
            setUser(null);
            setWishlistCount(0);
            setCartCount(0);
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

    const handleCartChange = (e: any) => {
      if (e.detail && e.detail.quantity) {
         // Just a simple refresh for cart since quantity logic is complex (added vs updated vs removed)
         fetchCartCount();
      } else {
         fetchCartCount();
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('wishlist-change', handleWishlistChange);
    window.addEventListener('cart-change', handleCartChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('wishlist-change', handleWishlistChange);
      window.removeEventListener('cart-change', handleCartChange);
    };
  }, []);

  // Close profile menu when route changes
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.dispatchEvent(new Event('auth-change'));
    setProfileMenuOpen(false);
    router.push('/');
  };

  // Fetch dynamic nav tree once on mount
  useEffect(() => {
    fetch('/api/categories/nav')
      .then(res => res.json())
      .then(data => { if (data.success) setNavTree(data.data); })
      .catch(() => {});
  }, []);

  // Build a quick lookup: level-0 slug → NavCategory
  const navTreeBySlug = new Map(navTree.map(c => [c.slug, c]));

  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 md:px-10 xl:px-16">
        {/* Single row: Logo | Nav | Icons */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-4 gap-3 lg:flex lg:justify-between lg:gap-3">

          {/* Mobile menu */}
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

          {/* CENTER — Nav links */}
          <nav key={pathname} className="hidden lg:flex items-center gap-7 mx-8">
              {navLinks.map((link) => {
                // Look up this level-0 slug in the dynamic tree
                const cat = navTreeBySlug.get(link.slug);
                const hasChildren = cat && cat.children.length > 0;

                if (!hasChildren) {
                  // No dropdown (VIIT Exclusive, or if DB has no children yet)
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`group text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap ${link.highlight ? "text-[#FFCC00]" : "text-black"}`}
                    >
                      {link.label}
                    </Link>
                  );
                }

                const headerImg = HEADER_IMAGES[link.slug];

                // Determine layout: if any sub-category has children → two-column, else simple
                const hasSubSub = cat.children.some(sub => sub.children.length > 0);

                return (
                  <div key={link.label} className="group">
                    <Link
                      href={link.href}
                      className={`relative inline-flex text-[15px] font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 ${link.highlight ? "text-[#FFCC00] after:bg-[#FFCC00]" : "text-black after:bg-current"}`}
                    >
                      <NavLabelWithArrow label={link.label} />
                    </Link>

                    <div className="absolute left-0 right-0 top-full mt-0 w-screen rounded-lg border border-gray-200 bg-white shadow-lg pt-4 opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto z-50 before:absolute before:left-0 before:right-0 before:-top-10 before:h-10 before:content-[''] before:block">
                      {hasSubSub ? (
                        // ── Two-column layout: each level-1 becomes a column ──
                        <div className="grid gap-6 px-5 pb-5" style={{ gridTemplateColumns: `auto repeat(${cat.children.length}, minmax(0,1fr))` }}>
                          {/* Header image */}
                          {headerImg && (
                            <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                              <Image src={headerImg.src} alt={headerImg.alt} fill sizes="(max-width: 768px) 100vw, 370px" className="rounded-md object-cover" />
                            </div>
                          )}
                          {cat.children.map(sub => (
                            <div key={sub._id} className="min-w-0">
                              <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                                <Link href={`/${link.slug}/${sub.slug}`} className="hover:underline">{sub.label}</Link>
                              </div>
                              <div className="flex flex-col gap-2">
                                {sub.children.map(subsub => (
                                  <Link
                                    key={subsub._id}
                                    href={`/${link.slug}/${sub.slug}/${subsub.slug}`}
                                    className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4"
                                  >
                                    {subsub.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // ── Simple layout: flat list of level-1 sub-categories ──
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 px-5 pb-5">
                          {headerImg && (
                            <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                              <Image src={headerImg.src} alt={headerImg.alt} fill sizes="(max-width: 768px) 100vw, 370px" className="rounded-md object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            {cat.children.map(sub => (
                              <Link
                                key={sub._id}
                                href={`/${link.slug}/${sub.slug}`}
                                className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4 whitespace-nowrap"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <Link href="/cart" aria-label="Cart" className="relative text-black hover:opacity-60 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold leading-none">
                {cartCount}
              </span>
            </Link>
            
            {/* Account */}
            {!loadingAuth && user ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label="Account Menu" 
                  className={`text-black hover:opacity-60 transition-opacity flex items-center justify-center min-w-[40px] ${profileMenuOpen ? 'opacity-60' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                    <div className="absolute top-[120%] right-0 w-[200px] bg-white border border-gray-100 shadow-xl z-50 flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-50 mb-2">
                        <span className="block text-xs font-black uppercase tracking-widest text-black">{user.name}</span>
                        <span className="block text-[10px] text-gray-400 mt-1">{user.email}</span>
                      </div>
                      <Link href="/profile?tab=overview" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                        <UserIcon size={14} /> My Profile
                      </Link>
                      <Link href="/profile?tab=orders" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                        <Package size={14} /> My Orders
                      </Link>
                      <Link href="/profile?tab=addresses" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                        <MapPin size={14} /> Address Book
                      </Link>
                      <Link href="/profile?tab=security" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                        <ShieldCheck size={14} /> Security
                      </Link>
                      <div className="h-px bg-gray-50 my-2"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : !loadingAuth && !user ? (
              <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} aria-label="Login / Register" className="flex items-center gap-2 text-black hover:opacity-60 transition-opacity">
                <span className="hidden lg:inline text-[12px] font-bold uppercase tracking-widest whitespace-nowrap">Login / Register</span>
                <svg className="lg:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            ) : (
              <div className="w-[120px] h-[20px] animate-pulse bg-gray-100 rounded"></div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search bar */}
      {searchOpen && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
          }
        }} className="border-t border-gray-100 px-10 xl:px-16 py-3 bg-gray-50">
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

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Menu</span>
            <button
              onClick={() => { setMobileMenuOpen(false); setMobileExpandedSlug(null); }}
              aria-label="Close menu"
              className="text-black hover:opacity-60 transition-opacity p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col px-5 py-2">
            {navLinks.map((link) => {
              const cat = navTreeBySlug.get(link.slug);
              const hasChildren = cat && cat.children.length > 0;
              const isExpanded = mobileExpandedSlug === link.slug;

              return (
                <div key={link.label} className="border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      onClick={() => { setMobileMenuOpen(false); setMobileExpandedSlug(null); }}
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
                            onClick={() => { setMobileMenuOpen(false); setMobileExpandedSlug(null); }}
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
                                  onClick={() => { setMobileMenuOpen(false); setMobileExpandedSlug(null); }}
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
    </header>
  );
}
