"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAuthRedirectUrl } from "@/lib/authRedirect";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all required fields");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        window.dispatchEvent(new Event('auth-change'));
        const returnUrl = getAuthRedirectUrl();

        toast.success("Successfully logged in!");
        router.push(returnUrl);
        router.refresh(); // Refresh the layout to trigger any server-side auth checks
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 px-4 md:px-6 pt-[20px] pb-10 md:items-center md:pt-20 md:pb-20">
      <div className="w-full max-w-md bg-white px-6 pt-6 pb-2 md:px-10 md:pt-10 md:pb-0 shadow-sm border border-gray-100">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-black text-center mb-6">
          Sign In
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Password</label>
              <button 
                type="button"
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  const returnTo = searchParams.get('returnTo');
                  router.push(`/forgot-password${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
                }}
                className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 md:py-4 bg-black text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors mt-4"
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
