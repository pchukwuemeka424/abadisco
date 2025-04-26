import Image from 'next/image';
import { FiSearch, FiLogIn, FiUserPlus } from 'react-icons/fi';

export function TopNavbar() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full z-50 pt-4 max-w-7xl px-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Logo and Auth links row */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo */}
          <div className="flex items-center min-w-[120px]">
            <a href="/">
              <Image src="/images/logo.png" alt="Logo" width={180} height={80} className="w-full rounded" />
            </a>
          </div>
          {/* Auth links (mobile only) */}
          <div className="flex gap-2 min-w-[120px] justify-end md:hidden">
            <a href="/auth/login" className="flex items-center gap-1 text-blue-600 font-semibold hover:underline px-3 py-1 rounded transition hover:bg-blue-50">
              <FiLogIn className="w-4 h-4" /> Login
            </a>
            <a href="/auth/signup" className="flex items-center gap-1 text-white font-semibold bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">
              <FiUserPlus className="w-4 h-4" /> Sign Up
            </a>
          </div>
        </div>
        {/* Search input - below in mobile, centered in md+ */}
        <form action="/search" method="get" className="w-full mt-4 md:mt-0 md:mx-8 md:flex-1 md:max-w-xl">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              name="query"
              placeholder="Search businesses..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-800 bg-white shadow-sm pr-12 text-base md:text-sm"
              autoComplete="off"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow transition flex items-center justify-center" aria-label="Search">
              <FiSearch className="w-5 h-5" />
            </button>
          </div>
        </form>
        {/* Auth links (desktop only) */}
        <div className="hidden md:flex gap-2 min-w-[120px] justify-end">
          <a href="/auth/login" className="flex items-center gap-1 text-blue-600 font-semibold hover:underline px-3 py-1 rounded transition hover:bg-blue-50">
            <FiLogIn className="w-4 h-4" /> Login
          </a>
          <a href="/auth/signup" className="flex items-center gap-1 text-white font-semibold bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">
            <FiUserPlus className="w-4 h-4" /> Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
