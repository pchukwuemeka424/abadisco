"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { ReactNode } from "react";
import { supabase } from '../../supabaseClient';
import { AuthProvider, useAuth } from '../../context/auth-context';
import { useRouter } from 'next/navigation';

// Move all logic that uses useAuth into a child component of AuthProvider
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };
    if (user) getUser();
  }, [user]);

  useEffect(() => {
    async function ensureUserInTable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        // Check if user already exists by Auth UID
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();
        if (!existingUser) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
          });
        }
      }
    }
    if (user) ensureUserInTable();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="text-xl font-bold text-rose-600 tracking-tight">Aba Dashboard</div>
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-gray-100">
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </button>
          {/* User Avatar */}
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)} className="flex items-center gap-2 focus:outline-none">
              <img src={profile?.logo_url || "/images/logo.svg"} alt="avatar" className="w-8 h-8 rounded-full border" />
              <span className="hidden md:inline text-sm font-medium text-gray-700">{profile?.full_name || "User"}</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-30">
                <a href="/dashboard/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                <a href="/dashboard/update-password" className="block px-4 py-2 hover:bg-gray-100">Settings</a>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-rose-600">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 min-h-screen p-4 md:p-8 bg-gray-50">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 border-t bg-white">© {new Date().getFullYear()} Aba Directory. All rights reserved.</footer>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}