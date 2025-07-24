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
  features?: string[];
  phone?: string;
  website?: string;
  email?: string;
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-white">
    <div className="text-center">
      <div className="w-24 h-24 mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-full border-t-4 border-rose-500 animate-spin"></div>
        <div className="absolute inset-3 rounded-full border-2 border-gray-100"></div>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Discovering Aba's Finest</h1>
      <p className="text-gray-500">Loading search results for you...</p>
    </div>
  </div>
);

// Main component with search functionality that safely uses useSearchParams inside Suspense
function SearchPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const PAGE_SIZE = 8;

  // Fetch business categories from database
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('business_categories')
      .select('*')
      .order('title');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    // Add "All Categories" option
    const allOption: BusinessCategory = {
      id: 0,
      title: 'All Categories',
      description: 'View all businesses',
      image_path: '/images/logo.png',
      icon_type: 'view-grid',
      count: null,
      link_path: '/search'
    };
    
    setCategories([allOption, ...(data || [])]);
  };

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
    
    // Base query for fetching businesses
    let supabaseQuery = supabase
      .from('businesses')
      .select(`
        *,
        business_categories!inner (
          id,
          title
        )
      `)
      .range((reset ? 0 : (page - 1) * PAGE_SIZE), (reset ? PAGE_SIZE - 1 : page * PAGE_SIZE - 1));
    
    // Apply search query filter if provided
    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%, description.ilike.%${query}%, address.ilike.%${query}%`);
    }
    
    // Apply category filter if selected
    if (category && category !== 'all') {
      supabaseQuery = supabaseQuery.eq('business_categories.id', category);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Error fetching businesses:', error);
    }
    
    const processedData = data ? data.map(item => ({
      ...item,
      category_name: item.business_categories?.title || 'Uncategorized'
    })) : [];
    
    if (reset) {
      setBusinesses(processedData);
      setFilteredBusinesses(processedData);
    } else {
      setBusinesses((prev) => [...prev, ...processedData]);
      setFilteredBusinesses((prev) => [...prev, ...processedData]);
    }
    
    // Set hasMore based on returned data length
    if (!data || data.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);
    
    if (reset) setIsLoading(false);
    else setIsLoadingMore(false);
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply filters
    const filtered = businesses.filter((business) => {
      const matchesQuery =
        searchQuery.trim() === '' ||
        (business.name && business.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (business.description && business.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (business.address && business.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory =
        selectedCategory === 'all' ||
        (business.category_id && business.category_id.toString() === selectedCategory);
      
      // For demonstration, we'll just assume all features match since we don't have this data
      const matchesFeatures = true;
      
      return matchesQuery && matchesCategory && matchesFeatures;
    });
    
    setFilteredBusinesses(filtered);
    setFiltersOpen(false);
    setIsMobileFilterOpen(false);
    
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
            className="w-full py-3 pl-12 pr-4 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 shadow-sm bg-white text-gray-800"
            placeholder="Search businesses, services, categories..."
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="px-4 py-3 bg-white hover:bg-gray-50 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-200 flex-grow"
            aria-label="Open filters"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters</span>
            {(selectedCategory !== 'all') && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 rounded-full">
                {selectedCategory !== 'all' ? 1 : 0}
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
      </form>
    );
  };

  // Render Categories as Visual Filter
  const renderCategoryVisualFilter = () => {
    if (categories.length === 0) return null;

    return (
      <div className="mt-6 overflow-x-auto hide-scrollbar pb-2">
        <div className="flex space-x-4">
          {categories.map((category) => (
            <div 
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id === 0 ? 'all' : String(category.id));
                const params = new URLSearchParams(searchParams.toString());
                if (category.id === 0) {
                  params.delete('category');
                } else {
                  params.set('category', String(category.id));
                }
                router.push(`/search?${params.toString()}`);
              }}
              className={`flex-shrink-0 cursor-pointer transition-all duration-300 transform ${
                selectedCategory === (category.id === 0 ? 'all' : String(category.id)) 
                  ? 'scale-105 ring-2 ring-rose-500' 
                  : 'hover:scale-105'
              }`}
            >
              <div className="relative w-28 h-28 rounded-xl overflow-hidden group">
                <Image
                  src={category.image_path}
                  alt={category.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                  <h3 className="text-white text-sm font-medium">{category.title}</h3>
                  {category.count !== null && (
                    <p className="text-gray-300 text-xs">{category.count} businesses</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render mobile filter panel
  const renderMobileFilterPanel = () => {
    return (
      <>
        {/* Removed the black background overlay */}
        <div 
          className={`fixed left-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto pt-20 ${
            isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-labelledby="filter-heading"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 id="filter-heading" className="text-xl font-semibold text-gray-900">Filter & Sort</h2>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
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
                      onClick={() => setSelectedCategory(category.id === 0 ? 'all' : String(category.id))}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedCategory === (category.id === 0 ? 'all' : String(category.id))
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      <div className="w-6 h-6 relative flex-shrink-0">
                        <Image
                          src={category.image_path}
                          alt={category.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <span className="truncate">{category.title}</span>
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
    if (selectedCategory === 'all' && !searchQuery) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {selectedCategory !== 'all' && (
          <span className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm">
            {categories.find(c => c.id.toString() === selectedCategory)?.title || 'Category'}
            <button 
              onClick={() => {
                setSelectedCategory('all');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('category');
                router.push(`/search?${params.toString()}`);
              }}
              className="ml-1 hover:text-rose-500 transition-colors"
              aria-label={`Remove ${categories.find(c => c.id.toString() === selectedCategory)?.title || 'Category'} filter`}
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
      </div>
    );
  };

  // Render businesses listing
  const renderBusinesses = () => {
    if (filteredBusinesses.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => {
            // Ensure business has a valid name for alt text
            if (!business.name) {
              business.name = 'Business';
            }
            // Map to BusinessProps for BusinessCard
            const businessCardProps = {
              id: String(business.id),
              name: business.name,
              description: business.description || null,
              logo_url: business.logo_url || null,
              category: business.category_name ? { title: business.category_name, icon_type: '' } : null,
              market: null,
              contact_phone: business.phone || null,
              contact_email: business.email || null,
              address: business.address || null,
            };
            return (
              <BusinessCard key={business.id} business={businessCardProps} />
            );
          })}
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

  // Render business results section
  const renderBusinessResults = () => {
    // Results header with count
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
        {renderBusinesses()}
        
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white">
      {/* Split screen layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left side: Search container (fixed on desktop) */}
        <div className="lg:w-1/2 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:overflow-y-auto bg-white shadow-md p-6">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900  md:mt-20 mb-2">Find Businesses in Aba</h1>
            <p className="text-gray-500 mb-6">Discover top businesses and services from all markets</p>
            
            {renderSearchFilters()}
            {renderFilterTags()}
            {renderCategoryVisualFilter()}
            
            {/* Mobile filters panel */}
            {renderMobileFilterPanel()}
            
            {/* Additional search information for desktop */}
            <div className="mt-10 hidden lg:block">
              <div className="rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 p-6">
                <h3 className="font-medium text-rose-800 text-lg mb-2">Looking for something specific?</h3>
                <p className="text-rose-700 text-sm mb-4">Our search tool helps you find businesses, services, and products from all markets in Aba.</p>
                <div className="space-y-2">
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
                    <span>Find businesses near you</span>
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

// Main component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}