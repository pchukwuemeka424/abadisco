'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 w-full z-50 bg-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32">{/* Further increased logo size for both sm and md */}
                <Image src="/images/logo.png" alt="Logo" width={320} height={160} className="w-full h-full object-contain rounded" />
              </div>
              <span className="ml-3 text-xl font-bold text-white hidden sm:inline">
                Aba Directory
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Sign Up
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Sign Up
            </Link>
          </div>

      
        </div>
      </div>
    </nav>
  );
}