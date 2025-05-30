"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../supabaseClient";

type SidebarLink = {
  href: string;
  label: string;
  icon: string;
  badge?: number | string;
};

const sidebarLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/update-password", label: "Update Password", icon: "🔒" },
  { href: "/dashboard/manage-uploads", label: "Manage Uploads", icon: "📤" },
  // Removed Favorites, Notifications, and Settings items
];

export default function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Theme toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Placeholder user info
  const user = { name: "Jane Doe", avatar: "/images/logo.svg" };

  // Placeholder logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200 text-gray-600 hover:text-rose-600 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed md:sticky top-0 left-0 z-30 h-full ${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Collapse/Expand button (desktop) */}
        <button
          className="hidden md:flex absolute top-4 right-[-12px] w-6 h-6 bg-white border rounded-full shadow items-center justify-center text-gray-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
          style={{ zIndex: 31 }}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-sm">{collapsed ? '▶' : '◀'}</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 h-16 border-b border-gray-100 px-4">
          <div className="relative flex-shrink-0">
            <Image 
              src={user.avatar} 
              alt="avatar" 
              width={40}
              height={40}
              className="rounded-full bg-gray-100 border border-gray-200 object-cover" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-medium text-gray-700 leading-tight">{user.name}</span>
              <span className="text-xs text-gray-500">Active now</span>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && <span className="text-xs text-gray-500">Theme:</span>}
          <button
            className={`rounded-full p-2 transition-colors ${
              theme === 'light' 
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all relative group ${
                pathname === link.href 
                  ? 'bg-rose-50 text-rose-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setOpen(false)}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
              {!collapsed && (
                <>
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && link.badge && (
                <span className="absolute top-0 right-0 -mr-1 -mt-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-rose-600 border-t border-gray-100 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={handleLogout}
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-auto p-4 text-xs text-gray-400 border-t border-gray-100 text-center">
            © {new Date().getFullYear()} Aba Directory
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
