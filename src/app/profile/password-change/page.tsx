"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { validatePassword, passwordErrorMsg } from "@/lib/validation";

export default function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (!validatePassword(newPassword)) {
      return toast.error(passwordErrorMsg);
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Change Password</h2>
      
      <form onSubmit={handleChangePassword} className="max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Current Password</label>
          <input 
            type="password" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">New Password</label>
          <input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Confirm New Password</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="mt-4 w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors md:self-start"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
