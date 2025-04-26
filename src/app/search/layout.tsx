import { Navbar } from '@/components/Navbar';
import React from 'react';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">

      <div >
        <div className="flex items-center justify-between mb-8">
          {/* Search input */}
          <form action="/search" method="get" className="flex-1 max-w-lg relative">
            <input
              type="text"
              name="query"
              placeholder="Search businesses..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 pr-12"
              autoComplete="off"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700 p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
          {/* Auth links */}
          <div className="ml-4 flex gap-2">
            <a href="/auth/login" className="text-rose-600 font-semibold hover:underline">Login</a>
            <a href="/auth/signup" className="text-blue-600 font-semibold hover:underline">Sign Up</a>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
