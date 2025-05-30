"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { ReactNode } from "react";
import { supabase } from '../../supabaseClient';
import { AuthProvider, useAuth } from '../../context/auth-context';
import { useRouter } from 'next/navigation';
import { FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';

// Move all logic that uses useAuth into a child component of AuthProvider
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
    window.location.href = "/";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 w-full max-w-full">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-2 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-800 shadow-md border-b sticky top-0 z-20 w-full">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            {collapsed ? <FiMenu size={20}/> : <FiX size={20}/>}
          </button>
          <div className="text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">Aba Dashboard</div>
          <div className="hidden md:block">
            <input type="text" placeholder="Search..." className="px-4 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none"/>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Search for small screens */}
          <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </button>
          {/* Theme Toggle */}
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {darkMode ? <FiSun size={20} className="text-yellow-400"/> : <FiMoon size={20} className="text-gray-600"/>}
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
      <div className="flex flex-1 w-full max-w-full overflow-hidden">
        <div className={`${collapsed ? 'w-12 sm:w-16' : 'w-48 sm:w-64'} transition-width duration-300 min-w-fit flex-shrink-0 hidden sm:block`}>
          <DashboardSidebar collapsed={collapsed} />
        </div>
        {/* Main content */}
        <main className="flex-1 min-h-screen p-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-800 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-3 sm:py-4 border-t bg-white dark:bg-gray-800 w-full max-w-full">© {new Date().getFullYear()} Aba Directory. All rights reserved.</footer>
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