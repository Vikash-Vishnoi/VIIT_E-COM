"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validatePassword, passwordErrorMsg } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  
  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOTP = async () => {
    if (!email) return setError("Please enter your email before requesting an OTP");
    if (cooldown > 0) return;

    
    setOtpLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCooldown(60);
        setSuccessMsg(`A 5-digit code has been sent to ${email}`);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password || !otp) {
      return setError("Please fill all required fields");
    }
    if (otp.length !== 5) {
      return setError("OTP must be exactly 5 digits");
    }
    if (!validatePassword(password)) {
      return setError(passwordErrorMsg);
    }
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, mobile: `+91${mobile}`, password }),
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
          } catch (e) {}
        }

        router.push(returnUrl); 
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20">
      <div className="w-full max-w-lg bg-white p-10 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black uppercase tracking-widest text-black text-center mb-6">
          Create Account
        </h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-[11px] font-bold text-center uppercase tracking-wider">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 text-green-700 text-[11px] font-bold text-center uppercase tracking-wider">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                placeholder="Priya Sharma"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mobile Number</label>
              <div className="flex items-center border-b-2 border-gray-200 focus-within:border-black transition-colors">
                <span className="text-sm font-medium text-gray-800 pr-2">+91</span>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={10}
                  className="w-full py-2 text-sm focus:outline-none bg-transparent"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
            <div className="flex gap-2 items-end">
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false); // Reset OTP status if email changes
                }}
                required
                className="flex-1 border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                placeholder="you@example.com"
              />
              <button 
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading || cooldown > 0}
                className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap min-w-[120px]"
              >
                {otpLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">5-Digit OTP</label>
            <input 
              type="text" 
              maxLength={5}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only numbers
              required
              className="w-full border-b-2 border-gray-200 py-2 text-sm tracking-[0.5em] focus:outline-none focus:border-black transition-colors bg-transparent"
              placeholder="00000"
            />
            {otpSent && <span className="text-[10px] font-bold text-gray-400 mt-1">Please check your email for the code.</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
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
            className="w-full py-4 bg-black text-white text-[12px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get('returnTo');
                router.push(`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
              }}
              className="text-black font-bold uppercase tracking-widest hover:underline underline-offset-4"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
