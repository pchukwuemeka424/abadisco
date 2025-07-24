"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSignInAlt, FaUserPlus, FaBars, FaTimes } from "react-icons/fa";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Markets", href: "/markets" },
    { label: "Businesses", href: "/search" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 mb-40 bg-white shadow-md`}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-[120px]" aria-label="Go to homepage">
          <div className="relative w-36 h-10 md:w-48 md:h-14">
            <Image
              src="/images/logo.png"
              alt="Aba Traders Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-700 hover:text-rose-600 font-medium px-2 py-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2 min-w-[180px] justify-end">
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <FaSignInAlt className="h-4 w-4" />
            <span>Login</span>
          </Link>
          <Link
            href="/auth/signup"
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-semibold rounded-lg transition-colors border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <FaUserPlus className="h-4 w-4" />
            <span>Sign Up</span>
          </Link>
        </div>

        {/* Mobile Hamburger + Auth Buttons */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/auth/login"
            className="flex items-center gap-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            style={{ minWidth: 0 }}
          >
            <FaSignInAlt className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Login</span>
          </Link>
          <Link
            href="/auth/signup"
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            style={{ minWidth: 0 }}
          >
            <FaUserPlus className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Sign Up</span>
          </Link>
          <button
            className="flex items-center justify-center p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="Open menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <FaBars className="w-7 h-7 text-rose-600" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <aside
          id="mobile-menu"
          className={`absolute left-0 top-0 h-full w-4/5 max-w-xs bg-white shadow-xl p-6 flex flex-col gap-8 transform transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
          tabIndex={menuOpen ? 0 : -1}
          aria-modal="true"
          role="dialog"
        >
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 text-rose-600 hover:text-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <FaTimes className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => setMenuOpen(false)}>
            <div className="relative w-10 h-10">
              <Image src="/images/logo.png" alt="Aba Traders Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-extrabold text-rose-600 tracking-tight">Aba Traders</span>
          </Link>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-rose-600 font-semibold text-lg px-2 py-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-8">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 text-base font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              onClick={() => setMenuOpen(false)}
            >
              <FaSignInAlt className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-base font-semibold rounded-lg transition-colors border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              onClick={() => setMenuOpen(false)}
            >
              <FaUserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </Link>
          </div>
        </aside>
      </div>
      <style jsx>{`
        .transition-transform {
          transition-property: transform;
        }
      `}</style>
    </header>
  );
}