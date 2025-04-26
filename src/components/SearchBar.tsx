'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const categories = [
  { name: 'Hotel & Spa', link: '/Hotel%20%26%20Spa', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { name: 'Markets', link: '/markets', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )},
  { name: 'Shopping', link: '/Shopping', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )},
  { name: 'Restaurants', link: '/Restaurants', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )}
];

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for businesses, markets, restaurants..."
          className={`w-full px-3 py-3 sm:py-4 sm:px-5 pl-12 pr-24 text-gray-900 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 text-base sm:text-lg border ${isFocused ? 'border-rose-400' : 'border-gray-200'} transition-all duration-300`}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 px-5 sm:px-6 text-white bg-rose-500 rounded-r-full hover:bg-rose-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-2 text-base sm:text-lg font-medium flex items-center gap-2"
        >
          Search
        </button>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 justify-center">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.link}
            className="px-4 py-2 bg-white/20 hover:bg-rose-500/30 text-white rounded-full transition-all duration-200 text-sm sm:text-base border border-white/30 hover:border-rose-300 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <span className="bg-white/20 p-1.5 rounded-full">{category.icon}</span>
            {category.name}
          </Link>
        ))}
      </div>
    </form>
  );
}