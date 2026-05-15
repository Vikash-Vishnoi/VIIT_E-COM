import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12 px-6 md:px-10 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        
        {/* Brand & Socials */}
        <div className="flex flex-col gap-5">
          <h2 
            className="text-3xl font-black uppercase tracking-tight text-black"
            style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
          >
            VIIT
          </h2>
          <div className="flex gap-5 items-center">
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-black transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            {/* TikTok */}
            <a href="#" aria-label="TikTok" className="text-gray-500 hover:text-black transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-black transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            {/* Twitter / X */}
            <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-black transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-8 md:gap-16 text-xs tracking-wider font-semibold uppercase text-gray-500">
          <div className="flex flex-col gap-4">
            <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-black transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-black transition-colors">Cookie Policy</Link>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="#" className="hover:text-black transition-colors">Contact Us</Link>
            <Link href="#" className="hover:text-black transition-colors">About VIIT</Link>
            <Link href="#" className="hover:text-black transition-colors">Careers</Link>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="#" className="hover:text-black transition-colors">Shipping & Returns</Link>
            <Link href="#" className="hover:text-black transition-colors">Store Locator</Link>
            <Link href="#" className="hover:text-black transition-colors">FAQs</Link>
          </div>
        </div>

      </div>

      <div className="mt-16 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-medium">
        &copy; {new Date().getFullYear()} VIIT. All rights reserved.
      </div>
    </footer>
  );
}
