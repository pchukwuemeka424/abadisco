'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaChartBar, FaPlusCircle, FaTasks, FaSignOutAlt, FaUserPlus, FaList, FaBars, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export function AgentSidebar() {
  const pathname = usePathname();
  // Use clientSide state to avoid hydration mismatch
  const [currentPath, setCurrentPath] = useState('');
  // Add state for mobile menu visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set the path after hydration to avoid mismatch
  useEffect(() => {
    setCurrentPath(pathname || '');
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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
    // {
    //   name: 'Add Listing',
    //   href: '/agent/add-listing',
    //   icon: <FaPlusCircle className="w-5 h-5" />,
    // },
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
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Stop propagation to prevent closing when clicking inside the sidebar */}
          <div 
            className="bg-white w-64 h-full overflow-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 font-barlow">Agent Portal</h2>
              <div className="space-y-1">
                {navItems.map((item) => {
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
        </div>
      )}

      {/* Desktop Sidebar */}
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
    </>
  );
}