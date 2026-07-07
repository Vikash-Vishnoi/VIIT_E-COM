"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  User as UserIcon, 
  MapPin, 
  Package, 
  ShieldCheck, 
  LogOut
} from "lucide-react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[20px] md:pt-[40px] pb-20 px-4 md:px-6 xl:px-16">
      <div className="max-w-[1200px] mx-auto">
        {/* Breadcrumb */}
        <div className="hidden md:block mb-8 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Profile</span>
        </div>

        {/* Header */}
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black mb-2">My Account</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-4 py-3 md:py-4 transition-colors whitespace-nowrap ${
                  pathname === '/profile' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black border border-gray-100 lg:border-transparent lg:border-b-gray-100'
                }`}
              >
                <UserIcon size={18} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Overview</span>
              </Link>
              <Link
                href="/profile/orders"
                className={`flex items-center gap-3 px-4 py-3 md:py-4 transition-colors whitespace-nowrap ${
                  pathname === '/profile/orders' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black border border-gray-100 lg:border-transparent lg:border-b-gray-100'
                }`}
              >
                <Package size={18} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">My Orders</span>
              </Link>
              <Link
                href="/profile/addresses"
                className={`flex items-center gap-3 px-4 py-3 md:py-4 transition-colors whitespace-nowrap ${
                  pathname === '/profile/addresses' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black border border-gray-100 lg:border-transparent lg:border-b-gray-100'
                }`}
              >
                <MapPin size={18} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Address Book</span>
              </Link>
              <Link
                href="/profile/password-change"
                className={`flex items-center gap-3 px-4 py-3 md:py-4 transition-colors whitespace-nowrap ${
                  pathname === '/profile/password-change' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black border border-gray-100 lg:border-transparent lg:border-b-gray-100'
                }`}
              >
                <ShieldCheck size={18} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Security</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 md:py-4 transition-colors whitespace-nowrap bg-white text-red-500 hover:bg-red-50 border border-gray-100 lg:border-transparent lg:border-b-gray-100"
              >
                <LogOut size={18} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-100 p-4 md:p-8 min-h-[400px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
