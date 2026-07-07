"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User as UserIcon, MapPin, Package, ShieldCheck, LogOut } from "lucide-react";
import SearchBar from "./SearchBar";
import { useStore } from "../../store/useStore";

export default function UserActions() {
  const { cartCount, wishlistCount, user, loadingAuth, setWishlistData, setCartCount, setUser, setLoadingAuth } = useStore();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const fetchWishlistCount = () => {
    fetch('/api/user/wishlist/ids')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Backend now returns a flat array of strings: ['id1', 'id2']
          const ids = data.data.map((item: any) => typeof item === 'string' ? item : (item.productId?._id || item.productId));
          setWishlistData(ids);
        }
      })
      .catch(() => {});
  };

  const fetchCartCount = () => {
    fetch('/api/user/cart/count')
      .then(res => res.json())
      .then(data => {
        if (data.success && typeof data.count === 'number') {
          setCartCount(data.count);
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
            
            const pendingProductId = sessionStorage.getItem('pendingWishlistAction');
            if (pendingProductId) {
              sessionStorage.removeItem('pendingWishlistAction');
              try {
                await fetch('/api/user/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: pendingProductId })
                });
              } catch (err) {}
            }

            const pendingCartAction = sessionStorage.getItem('pendingCartAction');
            if (pendingCartAction) {
              sessionStorage.removeItem('pendingCartAction');
              try {
                await fetch('/api/user/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: pendingCartAction
                });
              } catch (err) {}
            }
            
            fetchWishlistCount();
            fetchCartCount();
          } else {
            setUser(null);
            setWishlistData([]);
            setCartCount(0);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAuth(false));
    };

    fetchAuth();
  }, [setUser, setWishlistData, setCartCount, setLoadingAuth]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setWishlistData([]);
    setCartCount(0);
    setProfileMenuOpen(false);
    router.push('/');
  };

  return (
    <div className="col-start-3 flex items-center gap-4 md:gap-5 flex-shrink-0">
      
      {/* Search */}
      <SearchBar />

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
                <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                  <UserIcon size={14} /> My Profile
                </Link>
                <Link href="/profile/orders" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                  <Package size={14} /> My Orders
                </Link>
                <Link href="/profile/addresses" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
                  <MapPin size={14} /> Address Book
                </Link>
                <Link href="/profile/password-change" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
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
  );
}
