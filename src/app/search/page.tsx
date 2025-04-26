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
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const PAGE_SIZE = 8;

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
      if (!mainRef.current || isLoadingMore || isLoading || !hasMore || viewMode === 'map') return;
      const { bottom } = mainRef.current.getBoundingClientRect();
      if (bottom <= window.innerHeight + 200) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, isLoading, hasMore, viewMode]);

  // Fetch more when page increases
  useEffect(() => {
    if (page > 1 && hasMore && !isLoading && !isLoadingMore) {
      fetchBusinesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'food-dining', name: 'Food & Dining' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'health-beauty', name: 'Health & Beauty' },
    { id: 'services', name: 'Services' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'education', name: 'Education' },
    { id: 'automotive', name: 'Automotive' },
  ];

  const features = [
    'Air Condition',
    'Wifi',
    'Parking',
    'Delivery',
    'Outdoor Seating',
    'Accessible',
    'Pet Friendly',
    'Card Payment'
  ];

  const togglePriceFilter = (price: string) => {
    setPriceFilter(prev => 
      prev.includes(price)
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply filters
    const filtered = businesses.filter((business) => {
      const matchesQuery =
        searchQuery.trim() === '' ||
        (business.name && business.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (business.business_type && business.category && business.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (business.address && business.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory =
        selectedCategory === 'all' ||
        (business.category && business.category.toLowerCase().includes(selectedCategory.replace(/-/g, ' ')));
      
      const matchesRating = business.rating >= minRating;
      
      const matchesPrice = 
        priceFilter.length === 0 || 
        (business.price && priceFilter.includes(business.price));
      
      // For demonstration, we'll just assume all features match since we don't have this data
      const matchesFeatures = selectedFeatures.length === 0 || true;
      
      return matchesQuery && matchesCategory && matchesRating && matchesPrice && matchesFeatures;
    });
    
    setFilteredBusinesses(filtered);
    setFiltersOpen(false);
    
    // Update URL query parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    
    router.push(`/search?${params.toString()}`);
  };

  // Render search and filter components
  const renderSearchFilters = () => {
    return (
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="Search businesses, services, categories..."
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 border border-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="hidden sm:inline">Filters</span>
          {(selectedCategory !== 'all' || minRating > 0 || priceFilter.length > 0 || selectedFeatures.length > 0) && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 rounded-full">
              {(selectedCategory !== 'all' ? 1 : 0) + 
               (minRating > 0 ? 1 : 0) + 
               (priceFilter.length > 0 ? 1 : 0) + 
               (selectedFeatures.length > 0 ? 1 : 0)}
            </span>
          )}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg"
        >
          Search
        </button>
        <div className="hidden sm:flex border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'} rounded-l-lg`}
            title="Grid view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`p-2 ${viewMode === 'map' ? 'bg-gray-200' : 'bg-white'} rounded-r-lg`}
            title="Map view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
      </form>
    );
  };

  // Render filter panel
  const renderFilterPanel = () => {
    return (
      <>
        <div 
          className={`fixed inset-0 z-20 bg-black bg-opacity-30 transition-opacity duration-300 ${filtersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setFiltersOpen(false)}
        />
        <div 
          className={`fixed right-0 top-0 z-40 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto ${
            filtersOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rating Filter */}
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex items-center justify-between">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
                        minRating === rating ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {rating === 0 ? (
                        'Any'
                      ) : (
                        <>
                          {rating}+ 
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  {['$', '$$', '$$$'].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => togglePriceFilter(price)}
                      className={`flex-1 px-2 py-2 rounded-md text-sm font-medium ${
                        priceFilter.includes(price)
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {price}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Features Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm flex items-center gap-2 ${
                        selectedFeatures.includes(feature)
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {selectedFeatures.includes(feature) && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full py-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors font-medium"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setMinRating(0);
                    setPriceFilter([]);
                    setSelectedFeatures([]);
                  }}
                  className="w-full py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Render the active filter tags
  const renderFilterTags = () => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedCategory !== 'all' && (
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm flex items-center gap-1">
            {categories.find(c => c.id === selectedCategory)?.name}
            <button 
              onClick={() => setSelectedCategory('all')}
              className="ml-1 hover:text-rose-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {minRating > 0 && (
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm flex items-center gap-1">
            {minRating}+ Stars
            <button 
              onClick={() => setMinRating(0)}
              className="ml-1 hover:text-rose-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {searchQuery && (
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm flex items-center gap-1">
            &quot;{searchQuery}&quot;
            <button 
              onClick={() => setSearchQuery('')}
              className="ml-1 hover:text-rose-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
      </div>
    );
  };

  // Render grid view of businesses
  const renderBusinessGrid = () => {
    if (filteredBusinesses.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBusinesses.map((business) => (
            <div key={business.id} className="flex flex-col h-full">
              <Link href={`/search/${business.id}`} className="h-full">
                <div className="h-full cursor-pointer">
                  <BusinessCard business={business} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="col-span-full py-16 text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100">
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="mt-4 text-xl font-medium text-gray-900">No results found</h3>
        <p className="mt-2 text-gray-500">Try adjusting your search or filter to find what you&apos;re looking for.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setMinRating(0);
              setPriceFilter([]);
              setSelectedFeatures([]);
              router.push('/search');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  };

  // Render map view
  const renderMapView = () => {
    return (
      <div className="bg-gray-200 rounded-lg overflow-hidden h-[80vh] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Map view</h3>
            <p className="mt-1 text-gray-500">Interactive map implementation would be placed here.</p>
          </div>
        </div>
        <div className="absolute left-4 top-4 bg-white shadow-md rounded-md p-4 max-w-xs max-h-[70vh] overflow-y-auto">
          <h3 className="font-medium mb-3">Businesses in view ({filteredBusinesses.length})</h3>
          <div className="space-y-3">
            {filteredBusinesses.slice(0, 5).map((business) => (
              <div key={business.id} className="flex gap-3 border-b pb-3 last:border-0">
                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={business.image || '/images/logo.png'}
                    fill
                    className="object-cover"
                    alt={business.business_name || 'Business'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{business.name || business.business_name}</h4>
                  <div className="flex items-center text-xs text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3 h-3 ${i < Math.floor(business.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    ))}
                    <span className="ml-1 text-gray-600">{business.rating}</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{business.address}</p>
                </div>
              </div>
            ))}
            {filteredBusinesses.length > 5 && (
              <p className="text-xs text-gray-500">+ {filteredBusinesses.length - 5} more businesses</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search and filters toggle */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {renderSearchFilters()}
        </div>
      </div>
      
      {/* Filters panel */}
      {renderFilterPanel()}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" ref={mainRef}>
        {/* Results header with count and sort options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'Result' : 'Results'}
            </h2>
            {renderFilterTags()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">Sort by:</span>
            <select className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
              <option value="relevance">Relevance</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <button 
              className="sm:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center border border-gray-300"
              onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rose-500"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-rose-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? renderBusinessGrid() : renderMapView()}
          </>
        )}
        
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        )}
        
        {/* No more results indicator */}
        {!hasMore && !isLoadingMore && filteredBusinesses.length > 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            You&apos;ve seen all available listings
          </div>
        )}
      </div>
    </div>
  );
}