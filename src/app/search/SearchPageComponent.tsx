'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BusinessCard from '@/components/BusinessCard';
import { supabase } from '@/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

// Types for our data
interface BusinessCategory {
  id: number;
  title: string;
  description: string;
  image_path: string;
  icon_type: string;
  count: number | null;
  link_path: string;
}

interface Business {
  id: number;
  name: string;
  description?: string;
  address?: string;
  logo_url?: string;
  cover_image?: string;
  category_id?: number;
  category_name?: string;
  rating?: string;
  price_range?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
    social_media?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  highlights?: string[];
}

interface Market {
  id: number;
  name: string;
  location: string;
  description?: string;
  image_url?: string;
  operating_hours?: string;
  is_active: boolean;
  created_at: string;
}

// Enhanced filter options for search
interface SearchFilters {
  category?: string;
  priceRange?: string;
  rating?: string;
  location?: string;
  sortBy?: string;
}

// Pagination interface
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

const SearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for search results and UI
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: string}>({});
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 12,
    totalItems: 0
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'businesses' | 'markets'>('businesses');
  
  // Reference for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize search from URL parameters
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const priceRange = searchParams.get('price') || '';
    const rating = searchParams.get('rating') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');

    setSearchQuery(query);
    setFilters({ category, priceRange, rating, location, sortBy });
    setPagination(prev => ({ ...prev, currentPage: page }));
    
    // Update selected filters for UI
    setSelectedFilters({
      category,
      priceRange,
      rating,
      location,
      sortBy
    });

    // Perform search with URL parameters or load all businesses initially
    if (query || category || priceRange || rating || location) {
      performSearch(query, { category, priceRange, rating, location, sortBy }, page);
    } else {
      // Load all businesses when no search parameters are present
      performSearch('', { sortBy }, page);
    }
  }, [searchParams]);

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('title');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const performSearch = async (query: string, currentFilters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);
    setNoResults(false);

    try {
      const offset = (page - 1) * pagination.itemsPerPage;
      
      // Search businesses
      let businessQuery = supabase
        .from('businesses')
        .select(`
          *,
          business_categories(title)
        `, { count: 'exact' })
        .eq('status', 'active')  // Only show active businesses
        .range(offset, offset + pagination.itemsPerPage - 1);

      // Apply search query filter
      if (query) {
        businessQuery = businessQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply category filter - use category_id instead of join table title
      if (currentFilters.category && currentFilters.category !== '') {
        // Find category ID by title first
        const { data: categoryData } = await supabase
          .from('business_categories')
          .select('id')
          .eq('title', currentFilters.category)
          .single();
        
        if (categoryData) {
          businessQuery = businessQuery.eq('category_id', categoryData.id);
        }
      }

      // Apply price range filter
      if (currentFilters.priceRange && currentFilters.priceRange !== '') {
        businessQuery = businessQuery.eq('price_range', currentFilters.priceRange);
      }

      // Apply rating filter
      if (currentFilters.rating && currentFilters.rating !== '') {
        businessQuery = businessQuery.gte('rating', currentFilters.rating);
      }

      // Apply location filter
      if (currentFilters.location && currentFilters.location !== '') {
        businessQuery = businessQuery.ilike('address', `%${currentFilters.location}%`);
      }

      // Apply sorting
      switch (currentFilters.sortBy) {
        case 'name':
          businessQuery = businessQuery.order('name', { ascending: true });
          break;
        case 'rating':
          businessQuery = businessQuery.order('rating', { ascending: false });
          break;
        case 'newest':
          businessQuery = businessQuery.order('created_at', { ascending: false });
          break;
        default:
          businessQuery = businessQuery.order('name', { ascending: true });
      }

      const { data: businessData, error: businessError, count: businessCount } = await businessQuery;
      
      if (businessError) throw businessError;

      // Search markets
      let marketQuery = supabase
        .from('markets')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (query) {
        marketQuery = marketQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
      }

      const { data: marketData, error: marketError, count: marketCount } = await marketQuery;
      
      if (marketError) throw marketError;

      // Process results
      const transformedBusinesses: Business[] = businessData?.map(business => ({
        ...business,
        category_name: business.business_categories?.title || 'Uncategorized',
        highlights: business.highlights || []
      })) || [];

      setBusinesses(transformedBusinesses);
      setMarkets(marketData || []);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems: businessCount || 0,
        totalPages: Math.ceil((businessCount || 0) / prev.itemsPerPage)
      }));

      // Check if no results
      const hasResults = transformedBusinesses.length > 0 || marketData?.length > 0;
      setNoResults(!hasResults && (query !== '' || Object.values(currentFilters).some(f => f !== '')));

    } catch (err: any) {
      console.error('Error performing search:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.priceRange) params.set('price', filters.priceRange);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.location) params.set('location', filters.location);
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
    
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setSelectedFilters(prev => ({ ...prev, [filterType]: value }));
    
    // Update URL with new filters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.priceRange) params.set('price', newFilters.priceRange);
    if (newFilters.rating) params.set('rating', newFilters.rating);
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') params.set('sort', newFilters.sortBy);
    
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedFilters({});
    router.push(`/search${searchQuery ? `?q=${searchQuery}` : ''}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search?${params.toString()}`);
  };

  // Filter options
  const priceRanges = ['$', '$$', '$$$', '$$$$'];
  const ratings = ['4.0+', '3.5+', '3.0+', '2.5+'];
  const locations = ['Ariaria', 'Aba Main Market', 'Eziukwu', 'Uratta', 'Cemetery Market'];
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search businesses, markets, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Filters Row */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <select
                value={selectedFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>

              {/* Price Range Filter */}
              <select
                value={selectedFilters.priceRange || ''}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Any Price</option>
                {priceRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>

              {/* Rating Filter */}
              <select
                value={selectedFilters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                {ratings.map((rating) => (
                  <option key={rating} value={rating.replace('+', '')}>
                    {rating} Stars
                  </option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={selectedFilters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Any Location</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={selectedFilters.sortBy || 'relevance'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {Object.values(selectedFilters).some(filter => filter !== '') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-red-600 hover:text-red-800 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Results Header */}
        {!loading && (searchQuery || Object.values(selectedFilters).some(f => f !== '')) && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Search Results'}
            </h1>
            <p className="text-gray-600">
              Found {pagination.totalItems} {activeTab === 'businesses' ? 'businesses' : 'markets'}
              {Object.values(selectedFilters).some(f => f !== '') && (
                <span> with applied filters</span>
              )}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        {(businesses.length > 0 || markets.length > 0 || loading) && (
          <div className="mb-6">
            <nav className="flex space-x-8 border-b">
              <button
                onClick={() => setActiveTab('businesses')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'businesses'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Businesses ({businesses.length})
              </button>
              <button
                onClick={() => setActiveTab('markets')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'markets'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Markets ({markets.length})
              </button>
            </nav>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* No Results State */}
        {noResults && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results Display */}
        {!loading && !error && (
          <>
            {/* Businesses Tab */}
            {activeTab === 'businesses' && businesses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => {
                  // Map to BusinessProps for BusinessCard
                  const businessCardProps = {
                    id: String(business.id),
                    name: business.name,
                    description: business.description || null,
                    logo_url: business.logo_url || null,
                    category: business.category_name ? { title: business.category_name, icon_type: '' } : null,
                    market: null, // Markets data not available in this context
                    contact_phone: business.contact_phone || business.contact_info?.phone || null,
                    contact_email: business.contact_email || business.contact_info?.email || null,
                    address: business.address || null,
                  };
                  return (
                    <BusinessCard key={business.id} business={businessCardProps} />
                  );
                })}
              </div>
            )}

            {/* Empty state for businesses tab */}
            {activeTab === 'businesses' && businesses.length === 0 && !noResults && !loading && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses available</h3>
                <p className="text-gray-600 mb-4">
                  There are currently no businesses listed. Check back later or try searching for something specific.
                </p>
              </div>
            )}

            {/* Markets Tab */}
            {activeTab === 'markets' && markets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((market) => (
                  <div key={market.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <Image
                        src={market.image_url || '/images/ariaria-market.png'}
                        alt={market.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{market.name}</h3>
                      <p className="text-gray-600 mb-2">{market.location}</p>
                      {market.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{market.description}</p>
                      )}
                      {market.operating_hours && (
                        <p className="text-gray-500 text-sm mb-3">Hours: {market.operating_hours}</p>
                      )}
                      <Link
                        href={`/markets/${market.id}`}
                        className="inline-flex items-center text-red-600 hover:text-red-800 font-medium"
                      >
                        View Market
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && activeTab === 'businesses' && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md ${
                          pageNum === pagination.currentPage
                            ? 'bg-red-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Default Content for Fresh Page Load */}
        {!loading && !searchQuery && !Object.values(selectedFilters).some(f => f !== '') && businesses.length === 0 && markets.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Aba's Business Directory</h2>
            <p className="text-gray-600 mb-6">
              Find businesses, markets, and services across Aba's vibrant commercial landscape.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.title)}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SearchPageComponent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
