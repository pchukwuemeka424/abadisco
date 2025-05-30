"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessListing {
  id: string;
  name: string; // Changed from business_name
  business_type: string;
  description: string;
  status: string;
  created_at: string;
  logo_url: string | null;
  market_id: string | null; // Changed from market
  category_id: number | null;
}

export default function ManageListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageCounts, setImageCounts] = useState<{ [listingId: string]: number }>({});
  const [marketNames, setMarketNames] = useState<{ [marketId: string]: string }>({});
  const [categoryNames, setCategoryNames] = useState<{ [categoryId: number]: string }>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (!loading && user) {
      fetchAgentId();
    } else if (!loading && !user) {
      router.push("/auth/agent-login");
    }
  }, [user, loading, router]);

  const fetchAgentId = async () => {
    try {
      // Get the agent ID from the agents table
      const { data: agentData, error } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        console.error("Error fetching agent data:", error);
        setError("Failed to fetch agent profile. Please try again.");
        setIsLoading(false);
        return;
      }
      
      if (agentData) {
        setAgentId(agentData.id);
        fetchListings(agentData.id);
      } else {
        setError("Agent profile not found. Please register as an agent first.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error fetching agent ID:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const fetchListings = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses") // Changed from "users"
        .select("*")
        .eq("created_by", user?.id);

      if (error) {
        throw error;
      }

      setListings(data || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch your business listings");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch image counts for all listings
  useEffect(() => {
    async function fetchImageCounts() {
      if (!listings.length) return;
      const counts: { [listingId: string]: number } = {};
      await Promise.all(
        listings.map(async (listing) => {
          const { count, error } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("user_id", listing.id);
          counts[listing.id] = count || 0;
        })
      );
      setImageCounts(counts);
    }
    fetchImageCounts();
  }, [listings]);

  // Fetch market names for all listings
  useEffect(() => {
    async function fetchMarketNames() {
      if (!listings.length) return;
      
      // Get unique market IDs from listings
      const marketIds = [...new Set(listings.filter(l => l.market_id).map(l => l.market_id))];
      
      if (marketIds.length === 0) return;
      
      try {
        const { data: markets, error } = await supabase
          .from('markets')
          .select('id, name')
          .in('id', marketIds as string[]);
          
        if (error) {
          console.error("Error fetching market names:", error);
          return;
        }
        
        if (markets) {
          const marketNameMap: { [marketId: string]: string } = {};
          markets.forEach(market => {
            marketNameMap[market.id] = market.name;
          });
          setMarketNames(marketNameMap);
        }
      } catch (err) {
        console.error("Error in fetchMarketNames:", err);
      }
    }
    
    fetchMarketNames();
  }, [listings]);

  // Fetch category names for all listings
  useEffect(() => {
    async function fetchCategoryNames() {
      if (!listings.length) return;
      
      // Get unique category IDs from listings
      const categoryIds = [...new Set(listings.filter(l => l.category_id).map(l => l.category_id))];
      
      if (categoryIds.length === 0) return;
      
      try {
        const { data: categories, error } = await supabase
          .from('business_categories')
          .select('id, title') // Changed from 'id, name' to 'id, title'
          .in('id', categoryIds as number[]);
          
        if (error) {
          console.error("Error fetching category names:", error);
          return;
        }
        
        if (categories) {
          const categoryNameMap: { [categoryId: number]: string } = {};
          categories.forEach(category => {
            categoryNameMap[category.id] = category.title; // Changed from category.name to category.title
          });
          setCategoryNames(categoryNameMap);
        }
      } catch (err) {
        console.error("Error in fetchCategoryNames:", err);
      }
    }
    
    fetchCategoryNames();
  }, [listings]);

  // Get a list of unique categories from the listings data
  const categoryIds = [...new Set(listings.filter(l => l.category_id).map(l => l.category_id))];

  const filteredListings = listings.filter(listing => {
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    const matchesType = businessTypeFilter === "all" || listing.business_type === businessTypeFilter;
    const matchesCategory = categoryFilter === "all" || 
                           (listing.category_id && categoryFilter === listing.category_id.toString());
    
    // Handle search query matching
    const matchesSearch = searchQuery === "" || 
                         listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (listing.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredListings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  // Function to change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Function to handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [statusFilter, businessTypeFilter]);

  const businessTypes = [...new Set(listings.map(listing => listing.business_type))];
  const statusTypes = [...new Set(listings.map(listing => listing.status))];

  const handleEditListing = (id: string) => {
    router.push(`/agent/edit-listing/${id}`);
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmDelete(id);
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const handleDeleteListing = async (id: string) => {
    try {
      setDeleteLoading(true);
      
      // First, get the business name before deletion for activity logging
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")  // Changed from "users"
        .select("name")  // Changed from "business_name"
        .eq("id", id)
        .single();
      
      if (businessError) {
        console.error("Error fetching business data:", businessError.message || businessError);
        throw new Error(businessError.message || "Failed to fetch business data");
      }
      
      const businessName = businessData?.name || 'Unknown business';
      
      // First, delete all products associated with this listing to avoid foreign key constraint violation
      const { error: productsError } = await supabase
        .from("products")
        .delete()
        .eq("user_id", id);
        
      if (productsError) {
        console.error("Error deleting related products:", productsError.message || productsError);
        throw new Error(productsError.message || "Failed to delete related products");
      }
      
      // Now we can safely delete the business listing
      const { error } = await supabase
        .from("businesses")  // Changed from "users"
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting listing:", error.message || error);
        throw new Error(error.message || "Failed to delete listing");
      }
      
      setListings(listings.filter(listing => listing.id !== id));
      setConfirmDelete(null);
    } catch (err: any) {
      console.error("Error deleting listing:", err.message || err);
      setError(err.message || "Failed to delete listing. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-xl bg-white shadow-xl"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-rose-500 border-r-rose-500 border-b-rose-500 animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-700 font-medium">Loading your business listings...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-xl bg-white shadow-xl max-w-md w-full"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-800">Error Loading Data</h2>
            <p className="mt-3 text-gray-600">{error}</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-6 px-5 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine if all listings are registration completed
  const allListingsCompleted =
    listings.length === 0 || listings.every(l => (imageCounts[l.id] || 0) >= 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page title and stats banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Your Listings</h1>
              <p className="mt-2 text-indigo-100 max-w-2xl">
                Create, edit and manage all your business listings from this dashboard. Complete all steps to ensure maximum visibility to potential customers.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{listings.length}</div>
                    <div className="text-xs text-indigo-100">Total Listings</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {listings.filter(l => (imageCounts[l.id] || 0) >= 6).length}
                    </div>
                    <div className="text-xs text-indigo-100">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-rose-100 flex flex-wrap items-center justify-between">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gray-900 flex items-center"
            >
              <span className="mr-2 text-rose-600">🏬</span> Manage Business Listings
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 sm:mt-0 flex flex-col items-end"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/agent/add-listing')}
                className={`px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md flex items-center ${!allListingsCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!allListingsCompleted}
                title={!allListingsCompleted ? 'Complete registration for your existing listing(s) before adding another.' : ''}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add New Listing
              </motion.button>
              {!allListingsCompleted && listings.length > 0 && (
                <span className="text-xs text-rose-600 mt-1 font-medium">You must complete registration for your existing listing(s) first.</span>
              )}
            </motion.div>
          </div>

          {/* Search and Filters Area */}
          <div className="px-6 py-5 border-b border-gray-200 bg-white">
            <div className="md:flex md:items-center md:justify-between mb-4">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-medium text-gray-900 flex items-center"
              >
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Search & Filter Listings
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 mt-1 md:mt-0"
              >
                {filteredListings.length} of {listings.length} listings shown
              </motion.p>
            </div>
            
            {/* Search input */}
            <div className="mb-5">
              <div className="relative drop-shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, description, category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="pl-10 pr-4 py-3 w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            
            {/* Filter tips */}
            <div className="bg-indigo-50 p-3 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-indigo-700">
                    Use filters to narrow down results or search for specific listings.
                    {filteredListings.length < listings.length && (
                      <button 
                        onClick={() => {
                          setStatusFilter("all");
                          setBusinessTypeFilter("all");
                          setCategoryFilter("all");
                          setSearchQuery("");
                        }} 
                        className="ml-2 text-indigo-900 underline hover:text-indigo-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Filter by Status
                </label>
                <div className="relative">
                  <select
                    id="status-filter"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none shadow-sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Statuses</option>
                    {statusTypes.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Filter by Business Type
                </label>
                <div className="relative">
                  <select
                    id="type-filter"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none shadow-sm"
                    value={businessTypeFilter}
                    onChange={(e) => {
                      setBusinessTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Types</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Filter by Category
                </label>
                <div className="relative">
                  <select
                    id="category-filter"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none shadow-sm"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categoryIds.filter(id => id !== null).map(categoryId => (
                      <option key={categoryId} value={categoryId}>
                        {categoryNames[categoryId!] || `Category ${categoryId}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-wrap items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center">
                <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700 mr-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Show
                </label>
                <select
                  id="items-per-page"
                  className="rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  {[5, 10, 15, 20, 50].map(count => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
                <span className="ml-2 text-sm text-gray-600">
                  of {filteredListings.length} items
                </span>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M9.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                
                {totalPages <= 7 ? (
                  // If less than 7 pages, show all page buttons
                  Array.from({ length: totalPages }, (_, index) => (
                    <motion.button
                      key={index + 1}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => paginate(index + 1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === index + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                      }`}
                    >
                      {index + 1}
                    </motion.button>
                  ))
                ) : (
                  // For more than 7 pages, implement an ellipsis strategy
                  <>
                    {/* Show first page */}
                    {currentPage > 3 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => paginate(1)}
                        className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        1
                      </motion.button>
                    )}
                    
                    {/* Show ellipsis if needed */}
                    {currentPage > 4 && (
                      <span className="px-3 py-1 text-sm text-gray-500">...</span>
                    )}
                    
                    {/* Show pages around current page */}
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      // Show current page and 1 page before and after it
                      return (pageNumber === 1 || 
                             pageNumber === totalPages || 
                             (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) ? (
                        <motion.button
                          key={pageNumber}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === pageNumber ? "bg-indigo-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                          }`}
                        >
                          {pageNumber}
                        </motion.button>
                      ) : null;
                    }).filter(Boolean)}
                    
                    {/* Show ellipsis if needed */}
                    {currentPage < totalPages - 3 && (
                      <span className="px-3 py-1 text-sm text-gray-500">...</span>
                    )}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 2 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => paginate(totalPages)}
                        className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        {totalPages}
                      </motion.button>
                    )}
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </div>
            )}
            
            <div className="text-sm text-gray-600 mt-3 sm:mt-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Showing {filteredListings.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredListings.length)} of {filteredListings.length} entries
            </div>
          </div>
          
          {/* Status Bar */}
          {filteredListings.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></span>
                  <span className="text-sm text-gray-700">
                    {listings.filter(l => l.status === "Now Open").length} Open
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-1.5"></span>
                  <span className="text-sm text-gray-700">
                    {listings.filter(l => l.status === "Closed").length} Closed
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-amber-500 rounded-full mr-1.5"></span>
                  <span className="text-sm text-gray-700">
                    {listings.filter(l => l.status !== "Now Open" && l.status !== "Closed").length} Other
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {listings.filter(l => (imageCounts[l.id] || 0) >= 6).length} of {listings.length} listings completed
              </div>
            </div>
          )}

          {/* No listings state */}
          {listings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-md mx-auto"
              >
                <div className="w-24 h-24 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21H5a2 2 0 01-2-2V6a2 2 0 012-2h7l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">No Business Listings</h3>
                <p className="mt-2 text-gray-500">You haven't created any business listings yet.</p>
                <div className="mt-6">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/agent/add-listing')}
                    className="px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                  >
                    Create Your First Listing
                  </motion.button>
                </div>
              </motion.div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-md mx-auto"
              >
                <div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">No Matching Listings</h3>
                <p className="mt-2 text-gray-500">No listings match your current filters.</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setStatusFilter("all");
                    setBusinessTypeFilter("all");
                    setCategoryFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-6 px-5 py-2.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                >
                  Clear All Filters
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              <AnimatePresence>
                {currentItems.map((listing, index) => {
                  const imgCount = imageCounts[listing.id] || 0;
                  const registrationStatus =
                    imgCount >= 6 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 shadow-sm">
                        <span className="mr-1 text-green-500">✓</span> Registration Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ml-2 shadow-sm">
                        <svg className="w-3 h-3 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Pending ({imgCount}/6)
                      </span>
                    );
                  return (
                    <motion.li
                      key={listing.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-5 hover:bg-gray-50 transition-colors"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            {listing.logo_url ? (
                              <Image 
                                src={listing.logo_url} 
                                alt={listing.name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                <span className="text-2xl">🏬</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              {listing.name}
                              {registrationStatus}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {listing.business_type}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                                listing.status === "Now Open" 
                                  ? "bg-green-50 text-green-700 border border-green-100" 
                                  : listing.status === "Closed" 
                                  ? "bg-red-50 text-red-700 border border-red-100" 
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {listing.status === "Now Open" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>}
                                {listing.status === "Closed" && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>}
                                {listing.status !== "Now Open" && listing.status !== "Closed" && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>}
                                {listing.status}
                              </span>
                              {listing.market_id && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {marketNames[listing.market_id] || listing.market_id}
                                </span>
                              )}
                              {listing.category_id && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a1.99 1.99 0 013 0h5a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                  </svg>
                                  {listing.category_id !== null && categoryNames[listing.category_id] ? categoryNames[listing.category_id] : `Category ${listing.category_id}`}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500 flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Added on {formatDate(listing.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-0 sm:ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditListing(listing.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <svg className="mr-2 h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/agent/upload-images/${listing.id}`)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <svg className="mr-2 h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Images
                            <span className="ml-1 bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full">
                              {imageCounts[listing.id] || 0}/6
                            </span>
                          </motion.button>
                          {confirmDelete === listing.id ? (
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteListing(listing.id)}
                                disabled={deleteLoading}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-colors"
                              >
                                {deleteLoading ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                  </>
                                ) : "Confirm"}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDeleteCancel}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-colors"
                              >
                                Cancel
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteConfirm(listing.id)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <svg className="mr-2 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                        {listing.description || "No description provided."}
                      </p>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </motion.div>
        
        {/* Help Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 mb-4 bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tips for Managing Your Listings
            </h2>
          </div>
          
          <div className="px-6 py-5 text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Get Started Quickly</h3>
                </div>
                <p>Create a new listing using the "Add New Listing" button. Complete all required information and upload at least 6 images to ensure your listing is fully visible to potential customers.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Maximize Visibility</h3>
                </div>
                <p>Keep your listing information up-to-date and ensure your business status is correctly set. Listings with complete information and high-quality images receive more customer attention.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Complete Registration</h3>
                </div>
                <p>Upload all required images through the "Images" button. You must have at least 6 images to complete your listing's registration and make it fully visible to potential customers.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}