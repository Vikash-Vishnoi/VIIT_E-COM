"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditName(data.data.name);
        setEditMobile(data.data.mobile || "");
      } else {
        router.push("/login?returnTo=/profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, mobile: editMobile })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
        setProfile(data.data);
        window.dispatchEvent(new Event('auth-change'));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Profile...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">Personal Details</h2>
      
      <form onSubmit={handleUpdateOverview} className="max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Email Address</label>
          <input 
            type="email" 
            value={profile.email}
            disabled
            className="w-full border-b-2 border-gray-100 py-2 text-sm text-gray-400 bg-transparent cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Full Name</label>
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Mobile Number</label>
          <input 
            type="text" 
            value={editMobile}
            onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))}
            className="w-full border-b-2 border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-transparent"
            placeholder="Enter mobile number"
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="mt-4 w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors md:self-start"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
