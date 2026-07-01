"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validatePassword, passwordErrorMsg } from "@/lib/validation";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  // Form Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOTP = async () => {
    if (!email) return toast.error("Please enter your registered email");
    if (cooldown > 0) return;
    
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCooldown(60);
        toast.success(`A 5-digit reset code has been sent to ${email}`);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword || !otp) {
      return toast.error("Please fill all required fields");
    }
    if (otp.length !== 5) {
      return toast.error("OTP must be exactly 5 digits");
    }
    if (!validatePassword(newPassword)) {
      return toast.error(passwordErrorMsg);
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password reset successfully!");
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
            // Check if referrer is from the same site and isn't just an auth page
            if (referrerUrl.origin === window.location.origin && !referrerUrl.pathname.includes('/login') && !referrerUrl.pathname.includes('/register') && !referrerUrl.pathname.includes('/forgot-password')) {
              returnUrl = referrerUrl.pathname + referrerUrl.search;
            }
          } catch (e) {}
        }

        router.push(returnUrl); 
        router.refresh();
      } else {
        toast.error(data.message || "Password reset failed");
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
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-black text-center mb-2">
          Reset Password
        </h1>
        <p className="text-[10px] md:text-xs text-gray-500 text-center mb-8 uppercase tracking-widest">
          Secure Account Recovery
        </p>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
          
          {/* Email & OTP Request */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Registered Email</label>
            <div className="flex flex-row gap-2 items-end">
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
                disabled={otpLoading || cooldown > 0 || !email}
                className="px-3 md:px-4 py-2 bg-black text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap min-w-[90px] md:min-w-[120px]"
              >
                {otpLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>

          {/* Hidden fields that reveal after OTP is sent */}
          {otpSent && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">5-Digit Reset Code</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only numbers
                  required
                  className="w-full border-b-2 border-gray-200 py-2 text-sm tracking-[0.5em] focus:outline-none focus:border-black transition-colors bg-transparent"
                  placeholder="00000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
                  placeholder="••••••••"
                />
                <div className="mt-1 p-3 bg-gray-50/80 border border-gray-100 rounded-lg text-[10px] md:text-[11px] font-medium text-gray-500 leading-relaxed">
                  {passwordErrorMsg}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 md:py-4 bg-black text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
              >
                {loading ? "Resetting Password..." : "Reset Password & Login"}
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 flex justify-center gap-2">
            <button 
              type="button"
              onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get('returnTo');
                router.push(`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
              }}
              className="text-black font-bold uppercase tracking-widest hover:underline underline-offset-4"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
