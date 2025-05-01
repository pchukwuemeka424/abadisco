"use client";

import { 
  FaHome, FaUsers, FaBox, FaIdCard, FaChartBar, FaClock,
  FaCog, FaBell, FaSignOutAlt, FaBars, FaTimes, FaUserSecret, FaChartLine,
  FaTags, FaStore, FaConciergeBell
} from 'react-icons/fa';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabaseClient';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: <FaHome /> },
  { name: 'Users', href: '/admin/users', icon: <FaUsers /> },
  { name: 'Agents', href: '/admin/agents', icon: <FaUserSecret /> },
  { name: 'Agent Performance', href: '/admin/agents/performance', icon: <FaChartBar /> },
  { name: 'Agent Analytics', href: '/admin/agents/analytics', icon: <FaChartLine /> },
  { name: 'Markets', href: '/admin/markets', icon: <FaStore /> },
  { name: 'Categories', href: '/admin/categories', icon: <FaTags /> },
  { name: 'Products', href: '/admin/products', icon: <FaBox /> },
  { name: 'Services', href: '/admin/services', icon: <FaConciergeBell /> },
  { name: 'KYC Verification', href: '/admin/kyc', icon: <FaIdCard /> },
  { name: 'Activity', href: '/admin/activity', icon: <FaClock /> },
  { name: 'Analytics', href: '/admin/analytics', icon: <FaChartBar /> },
  { name: 'Settings', href: '/admin/settings', icon: <FaCog /> },
  { name: 'Notifications', href: '/admin/notifications', icon: <FaBell /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      // Direct implementation using Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      
      // Manually navigate to login page after successful logout
      router.push('/auth/login');
    } catch (error) {
      console.error('Exception during logout:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white min-h-screen shadow-xl">
        {renderSidebarContent()}
      </div>
      
      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl" onClick={e => e.stopPropagation()}>
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );

  function renderSidebarContent() {
    return (
      <>
        <div className="p-5 border-b border-blue-700">
          <div className="flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Aba Markets Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="ml-3 text-xl font-bold">Admin Panel</span>
          </div>
        </div>
        
        <div className="flex-grow py-5 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-white text-blue-700 shadow-md font-medium'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={`text-lg ${active ? 'text-blue-600' : 'text-blue-200'}`}>
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.name}</span>
                  {active && (
                    <span className="ml-auto h-2 w-2 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-blue-700 space-y-2">
          <Link
            href="/"
            className="flex items-center px-4 py-3 text-blue-100 hover:bg-blue-700 rounded-lg transition-all duration-200"
          >
            <FaHome />
            <span className="ml-3">Back to Site</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-blue-100 hover:bg-red-600 rounded-lg transition-all duration-200"
          >
            <FaSignOutAlt />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </>
    );
  }
}