"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    return matchesStatus && matchesType && matchesCategory;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 rounded-lg bg-white shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 font-medium">Loading your business listings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">Error Loading Data</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if all listings are registration completed
  const allListingsCompleted =
    listings.length === 0 || listings.every(l => (imageCounts[l.id] || 0) >= 6);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2 text-rose-600">🏬</span> Manage Business Listings
            </h1>
            <div className="mt-2 sm:mt-0 flex flex-col items-end">
              <button
                onClick={() => router.push('/agent/add-listing')}
                className={`px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors flex items-center ${!allListingsCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!allListingsCompleted}
                title={!allListingsCompleted ? 'Complete registration for your existing listing(s) before adding another.' : ''}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add New Listing
              </button>
              {!allListingsCompleted && listings.length > 0 && (
                <span className="text-xs text-rose-600 mt-1">You must complete registration for your existing listing(s) before adding another.</span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="status-filter"
                className="w-full rounded-md border border-gray-300 py-2 px-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {statusTypes.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Business Type
              </label>
              <select
                id="type-filter"
                className="w-full rounded-md border border-gray-300 py-2 px-3"
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="category-filter"
                className="w-full rounded-md border border-gray-300 py-2 px-3"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categoryIds.map(categoryId => (
                  <option key={categoryId} value={categoryId}>
                    {categoryNames[categoryId] || `Category ${categoryId}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center">
                <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700 mr-2">
                  Show
                </label>
                <select
                  id="items-per-page"
                  className="rounded-md border border-gray-300 py-1 px-2 text-sm"
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
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M9.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {totalPages <= 7 ? (
                  // If less than 7 pages, show all page buttons
                  Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => paginate(index + 1)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === index + 1 ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))
                ) : (
                  // For more than 7 pages, implement an ellipsis strategy
                  <>
                    {/* Show first page */}
                    {currentPage > 3 && (
                      <button
                        onClick={() => paginate(1)}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        1
                      </button>
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
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === pageNumber ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ) : null;
                    }).filter(Boolean)}
                    
                    {/* Show ellipsis if needed */}
                    {currentPage < totalPages - 3 && (
                      <span className="px-3 py-1 text-sm text-gray-500">...</span>
                    )}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 2 && (
                      <button
                        onClick={() => paginate(totalPages)}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        {totalPages}
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l-4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="text-sm text-gray-500 mt-3 sm:mt-0">
              Showing {filteredListings.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredListings.length)} of {filteredListings.length} entries
            </div>
          </div>

          {/* No listings state */}
          {listings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21H5a2 2 0 01-2-2V6a2 2 0 012-2h7l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Business Listings</h3>
              <p className="mt-1 text-gray-500">You haven't created any business listings yet.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/agent/add-listing')}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Create Your First Listing
                </button>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Matching Listings</h3>
              <p className="mt-1 text-gray-500">No listings match your current filters.</p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setBusinessTypeFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-4 text-rose-600 hover:text-rose-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {currentItems.map((listing) => {
                const imgCount = imageCounts[listing.id] || 0;
                const registrationStatus =
                  imgCount >= 6 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                      Registration Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                      Pending ({imgCount}/6)
                    </span>
                  );
                return (
                  <li key={listing.id} className="px-6 py-5 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border border-gray-200">
                          {listing.logo_url ? (
                            <Image 
                              src={listing.logo_url} 
                              alt={listing.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                              <span className="text-2xl">🏬</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            {listing.name}
                            {registrationStatus}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {listing.business_type}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              listing.status === "Now Open" 
                                ? "bg-green-100 text-green-800" 
                                : listing.status === "Closed" 
                                ? "bg-red-100 text-red-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {listing.status}
                            </span>
                            {listing.market_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {marketNames[listing.market_id] || listing.market_id}
                              </span>
                            )}
                            {listing.category_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {categoryNames[listing.category_id] || `Category ${listing.category_id}`}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Added on {formatDate(listing.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                        <button
                          onClick={() => handleEditListing(listing.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => router.push(`/agent/upload-images/${listing.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"></path>
                          </svg>
                          Images
                        </button>
                        {confirmDelete === listing.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={deleteLoading}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              {deleteLoading ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteConfirm(listing.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{listing.description || "No description provided."}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}