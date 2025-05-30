'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <nav className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <Image 
                  src="/images/logo.png" 
                  alt="Aba Directory Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2 text-xl font-bold text-white hidden sm:inline tracking-wide drop-shadow-md">
                Aba Directory
              </span>
            </Link>
          </div>

          {/* Desktop Login/Signup */}
          <div className="hidden md:flex md:items-center space-x-3">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              <FaSignInAlt className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-transparent hover:border-rose-400"
            >
              <FaUserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </Link>
          </div>

          {/* Mobile Login/Signup Buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/auth/login"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            >
              <FaSignInAlt className="h-3 w-3" />
              <span>Login</span>
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            >
              <FaUserPlus className="h-3 w-3" />
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}