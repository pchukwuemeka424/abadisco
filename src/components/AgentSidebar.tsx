'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaChartBar, FaPlusCircle, FaTasks, FaSignOutAlt, FaUserPlus, FaList } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export function AgentSidebar() {
  const pathname = usePathname();
  // Use clientSide state to avoid hydration mismatch
  const [currentPath, setCurrentPath] = useState('');

  // Set the path after hydration to avoid mismatch
  useEffect(() => {
    setCurrentPath(pathname || '');
  }, [pathname]);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/agent',
      icon: <FaChartBar className="w-5 h-5" />,
    },
    {
      name: 'Profile',
      href: '/agent/profile',
      icon: <FaUser className="w-5 h-5" />,
    },
    {
      name: 'Add Listing',
      href: '/agent/add-listing',
      icon: <FaPlusCircle className="w-5 h-5" />,
    },
    {
      name: 'Manage Listings',
      href: '/agent/manage-listing',
      icon: <FaList className="w-5 h-5" />,
    },
    {
      name: 'Weekly Tasks',
      href: '/agent/tasks',
      icon: <FaTasks className="w-5 h-5" />,
    },
    {
      name: 'Analytics',
      href: '/agent/analytics',
      icon: <FaChartBar className="w-5 h-5" />,
    },
  ];

  const handleSignOut = async () => {
    // Implement sign out functionality using Supabase
    // Example: await supabase.auth.signOut()
    window.location.href = '/auth/login';
  };

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white shadow-md z-10 hidden md:block">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6 font-barlow">Agent Portal</h2>
        <div className="space-y-1">
          {navItems.map((item) => {
            // Use startsWith to match current path more reliably
            // Only apply exact match for the dashboard to avoid conflicts
            const isActive = 
              item.href === '/agent' 
                ? currentPath === '/agent'
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-3 text-sm rounded-md transition-colors w-full text-left text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-3">
              <FaSignOutAlt className="w-5 h-5" />
            </span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}