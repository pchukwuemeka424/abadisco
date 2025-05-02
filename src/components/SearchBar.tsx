'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';



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
      

    </form>
  );
}