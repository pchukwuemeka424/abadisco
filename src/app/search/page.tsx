'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BusinessCard } from '@/components/BusinessCard';
import { supabase } from '@/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const PAGE_SIZE = 7;
  const mainRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Fetch businesses with pagination
  const fetchBusinesses = async (reset = false) => {
    if (isLoading || isLoadingMore) return;
    if (!hasMore && !reset) return;
    if (reset) {
      setPage(1);
      setHasMore(true);
    }
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || 'all';
    if (reset) {
      setSearchQuery(query);
      setSelectedCategory(category);
    }
    let supabaseQuery = supabase.from('users').select('*').range((reset ? 0 : (page - 1) * PAGE_SIZE), (reset ? PAGE_SIZE - 1 : page * PAGE_SIZE - 1));
    if (query) {
      supabaseQuery = supabaseQuery.or(`business_type.ilike.%${query}%,description.ilike.%${query}%,services.ilike.%${query}%,category.ilike.%${query}%`);
    } else if (category && category !== 'all') {
      supabaseQuery = supabaseQuery.ilike('categories', `%${category}%`);
    }
    const { data, error } = await supabaseQuery;
    if (reset) {
      setBusinesses(data || []);
      setFilteredBusinesses(data || []);
    } else {
      setBusinesses((prev) => [...prev, ...(data || [])]);
      setFilteredBusinesses((prev) => [...prev, ...(data || [])]);
    }
    // Set hasMore based on returned data length
    if (!data || data.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);
    if (reset) setIsLoading(false);
    else setIsLoadingMore(false);
  };

  // Initial fetch and on searchParams change
  useEffect(() => {
    setPage(1); // Always reset to 1
    fetchBusinesses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current || isLoadingMore || isLoading || !hasMore) return;
      const { bottom } = mainRef.current.getBoundingClientRect();
      if (bottom <= window.innerHeight + 200) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, isLoading, hasMore]);

  // Fetch more when page increases
  useEffect(() => {
    if (page > 1 && hasMore && !isLoading && !isLoadingMore) {
      fetchBusinesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const categories = [
    'All Categories',
    'Food & Dining',
    'Shopping',
    'Health & Beauty',
    'Services',
    'Entertainment',
    'Education',
    'Automotive',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const filtered = businesses.filter((business) => {
        const matchesQuery =
          searchQuery.trim() === '' ||
          (business.name && business.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (business.business_type && business.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (business.address && business.address.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory =
          selectedCategory === 'all' ||
          (business.category && business.category.toLowerCase() === selectedCategory.replace('-', ' '));
        const matchesRating = business.rating >= minRating;
        return matchesQuery && matchesCategory && matchesRating;
      });
      setFilteredBusinesses(filtered);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded shadow border border-gray-200"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <aside
          className={`w-full md:w-72 bg-white rounded-lg shadow-sm p-6 mb-8 md:mb-0 fixed md:static z-40 top-0 left-0 h-full md:h-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          style={{ maxWidth: 320 }}
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Keyword Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Search for businesses, services, or categories"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category.toLowerCase().replace(' & ', '-').replace(' ', '-')}>{category}</option>
                ))}
              </select>
            </div>
            {/* Rating Filter */}
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <select
                id="rating"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            {/* Placeholder for Advanced Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Air Condition</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Bedding</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Internet</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Balcony</span>
                {/* Add more as needed */}
              </div>
            </div>
            {/* Placeholder for Price Moderation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <div className="flex gap-2">
                <span className="px-2 py-1 border rounded text-xs">$</span>
                <span className="px-2 py-1 border rounded text-xs">$$</span>
                <span className="px-2 py-1 border rounded text-xs">$$$</span>
              </div>
            </div>
            <button type="submit" className="w-full py-2 px-4 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              Apply & Filter
            </button>
          </form>
        </aside>
        {/* Main Grid */}
        <main className="flex-1" ref={mainRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{filteredBusinesses.length} Results</h2>
            <div>
              <label className="mr-2 text-sm text-gray-700">Sort By:</label>
              <select className="px-2 py-1 border rounded">
                <option>Most Rated</option>
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <div key={business.id} className="flex flex-col h-full">
                  <Link href={`/search/${business.id}`}>
                    <div className="cursor-pointer flex-1 flex flex-col">
                      <BusinessCard business={business} />
                    </div>
                  </Link>
                </div>
              ))}
              {/* Map section spanning all 3 columns */}
            
              {isLoadingMore && (
                <div className="md:col-span-3 flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                </div>
              )}
              {!hasMore && !isLoadingMore && (
                <div className="md:col-span-3 flex justify-center py-6 text-gray-500 text-sm">
                  No more content to load.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}