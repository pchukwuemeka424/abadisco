'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BusinessCard from '@/components/BusinessCard';
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
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 shadow-sm bg-white"
            placeholder="Search businesses, services, categories..."
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="px-4 py-3 bg-white hover:bg-gray-50 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-200 flex-grow"
            aria-label="Open filters"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters</span>
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
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl shadow-sm transition-all duration-200"
            aria-label="Search"
          >
            Search
          </button>
        </div>
        <div className="shadow-sm bg-white rounded-xl overflow-hidden flex">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-3 flex-1 ${viewMode === 'grid' ? 'bg-rose-50 text-rose-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}
            aria-label="Grid view"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-xs mt-1 block">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`p-3 flex-1 ${viewMode === 'map' ? 'bg-rose-50 text-rose-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}
            aria-label="Map view"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs mt-1 block">Map</span>
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
          className={`fixed inset-0 z-20 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${filtersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setFiltersOpen(false)}
          aria-hidden="true"
        />
        <div 
          className={`fixed right-0 top-0 z-40 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto ${
            filtersOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-labelledby="filter-heading"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 id="filter-heading" className="text-xl font-semibold text-gray-900">Filters</h2>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors duration-200"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Minimum Rating
                </label>
                <div className="flex items-center justify-between">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        minRating === rating ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                <div className="flex gap-2">
                  {['$', '$$', '$$$'].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => togglePriceFilter(price)}
                      className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        priceFilter.includes(price)
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      {price}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Features Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 ${
                        selectedFeatures.includes(feature)
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      {selectedFeatures.includes(feature) ? (
                        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0 -16 0" />
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
                  className="w-full py-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors font-medium shadow-sm"
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
                  className="w-full py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium"
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
    if (selectedCategory === 'all' && minRating === 0 && !searchQuery && priceFilter.length === 0 && selectedFeatures.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {selectedCategory !== 'all' && (
          <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            {categories.find(c => c.id === selectedCategory)?.name}
            <button 
              onClick={() => setSelectedCategory('all')}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label={`Remove ${categories.find(c => c.id === selectedCategory)?.name} filter`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {minRating > 0 && (
          <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            {minRating}+ Stars
            <button 
              onClick={() => setMinRating(0)}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label="Remove rating filter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {searchQuery && (
          <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            &quot;{searchQuery}&quot;
            <button 
              onClick={() => setSearchQuery('')}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label="Clear search query"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {selectedFeatures.length > 0 && selectedFeatures.map(feature => (
          <span key={feature} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            {feature}
            <button 
              onClick={() => toggleFeature(feature)}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label={`Remove ${feature} filter`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {priceFilter.length > 0 && (
          <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            Price: {priceFilter.join(', ')}
            <button 
              onClick={() => setPriceFilter([])}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label="Clear price filter"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Link 
              key={business.id} 
              href={`/search/${business.id}`} 
              className="h-full transform hover:scale-105 transition-transform duration-300"
            >
              <div className="h-full cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                <BusinessCard business={business} />
              </div>
            </Link>
          ))}
        </div>
      );
    }
    
    return (
      <div className="col-span-full py-16 text-center bg-white rounded-2xl shadow-sm my-6">
        <div className="mx-auto flex items-center justify-center h-28 w-28 rounded-full bg-rose-50">
          <svg className="h-14 w-14 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl font-medium text-gray-900">No results found</h3>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">We couldn't find any businesses matching your criteria. Try adjusting your search or filters.</p>
        <div className="mt-8">
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
            className="px-6 py-3 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors duration-200"
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
      <div className="bg-white rounded-2xl overflow-hidden h-[80vh] relative shadow-md my-6">
        <div className="absolute inset-0 bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Map view</h3>
              <p className="mt-2 text-gray-500">Interactive map showing all businesses in your area.</p>
            </div>
          </div>
          <div className="absolute left-4 top-4 bg-white shadow-lg rounded-xl p-5 max-w-xs max-h-[70vh] overflow-y-auto">
            <h3 className="font-medium text-lg mb-4 flex items-center justify-between">
              <span>Businesses ({filteredBusinesses.length})</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <div className="space-y-4">
              {filteredBusinesses.slice(0, 5).map((business) => (
                <Link key={business.id} href={`/search/${business.id}`} className="block">
                  <div className="flex gap-3 pb-4 border-b border-gray-100 hover:bg-gray-50 transition-colors rounded-lg p-2">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={business.image || '/images/logo.png'}
                        fill
                        className="object-cover"
                        alt={business.business_name || 'Business'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{business.name || business.business_name}</h4>
                      <div className="flex items-center text-xs text-yellow-500 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < Math.floor(business.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-gray-600">{business.rating || 'N/A'}</span>
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {business.address || 'Location not available'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredBusinesses.length > 5 && (
                <p className="text-xs text-center text-rose-600 font-medium">
                  + {filteredBusinesses.length - 5} more businesses
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render business results section
  const renderBusinessResults = () => {
    // Results header with count and sort options
    const resultsHeader = (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'Business' : 'Businesses'}
            {isLoading && (
              <svg className="animate-spin ml-3 h-5 w-5 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Showing results for your search</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 whitespace-nowrap">Sort by:</span>
          <select className="px-4 py-2 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 border-0 text-sm">
            <option value="relevance">Relevance</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
    );

    if (isLoading) {
      return (
        <>
          {resultsHeader}
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm my-6">
            <div className="text-center">
              <div className="relative mx-auto">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-rose-500"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-rose-500">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-gray-500">Loading businesses...</p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        {resultsHeader}
        {viewMode === 'grid' ? renderBusinessGrid() : renderMapView()}
        
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
              <p className="mt-2 text-sm text-gray-500">Loading more businesses...</p>
            </div>
          </div>
        )}
        
        {/* No more results indicator */}
        {!hasMore && !isLoadingMore && filteredBusinesses.length > 0 && (
          <div className="text-center py-10 border-t border-gray-200 mt-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-1 text-gray-500">You've seen all the available businesses.</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Split screen layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left side: Search container (fixed on desktop) */}
        <div className="lg:w-1/2 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:overflow-y-auto bg-white shadow-md p-6">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Businesses in Aba</h1>
            {renderSearchFilters()}
            {renderFilterTags()}
            
            {/* Filters panel */}
            {renderFilterPanel()}
            
            {/* Additional search information for desktop */}
            <div className="mt-10 hidden lg:block">
              <div className="rounded-2xl bg-rose-50 p-6">
                <h3 className="font-medium text-rose-800 text-lg mb-2">Looking for something specific?</h3>
                <p className="text-rose-700 text-sm">Our search tool helps you find businesses, services, and products from all markets in Aba.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-rose-700">
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Search by business name</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-700">
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Filter by category</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-700">
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sort by ratings</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-700">
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>View on interactive map</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Results container (scrollable) */}
        <div className="lg:w-1/2 lg:ml-auto py-6 px-4 sm:px-6" ref={mainRef}>
          <div className="max-w-3xl mx-auto">
            {renderBusinessResults()}
          </div>
        </div>
      </div>
    </div>
  );
}