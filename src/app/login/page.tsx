"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill all required fields");
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        window.dispatchEvent(new Event('auth-change'));
        // Find where to redirect the user back to
        let returnUrl = '/';
        const searchParams = new URLSearchParams(window.location.search);
        const returnToParam = searchParams.get('returnTo');

        if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//')) {
          returnUrl = returnToParam;
        } else if (document.referrer) {
          try {
            const referrerUrl = new URL(document.referrer);
            // Check if referrer is from the same site and isn't just the login/register page
            if (referrerUrl.origin === window.location.origin && !referrerUrl.pathname.includes('/login') && !referrerUrl.pathname.includes('/register')) {
              returnUrl = referrerUrl.pathname + referrerUrl.search;
            }
          } catch (err) {}
        }

        router.push(returnUrl);
        router.refresh(); // Refresh the layout to trigger any server-side auth checks
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20">
      <div className="w-full max-w-md bg-white p-10 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black uppercase tracking-widest text-black text-center mb-6">
          Sign In
        </h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-[11px] font-bold text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
              <button 
                type="button"
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  const returnTo = searchParams.get('returnTo');
                  router.push(`/forgot-password${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-black text-white text-[12px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get('returnTo');
                router.push(`/register${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
              }}
              className="text-black font-bold uppercase tracking-widest hover:underline underline-offset-4"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
