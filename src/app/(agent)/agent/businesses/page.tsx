"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Business {
  id: string;
  name: string;
  business_type: string;
  description: string;
  status: string;
  created_at: string;
  logo_url: string | null;
  market_id: string | null;
  category_id: number | null;
  created_by: string;
}

export default function AgentBusinessesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketNames, setMarketNames] = useState<{ [marketId: string]: string }>({});
  const [categoryNames, setCategoryNames] = useState<{ [categoryId: number]: string }>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!loading && user) {
      fetchBusinesses();
    } else if (!loading && !user) {
      router.push("/auth/agent-login");
    }
  }, [user, loading, router]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("created_by", user?.id);

      if (error) {
        throw error;
      }

      setBusinesses(data || []);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setError("Failed to fetch your registered businesses");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch market names
  useEffect(() => {
    async function fetchMarketNames() {
      if (!businesses.length) return;
      
      const marketIds = [...new Set(businesses.filter(b => b.market_id).map(b => b.market_id))];
      
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
  }, [businesses]);

  // Fetch category names
  useEffect(() => {
    async function fetchCategoryNames() {
      if (!businesses.length) return;
      
      const categoryIds = [...new Set(businesses.filter(b => b.category_id).map(b => b.category_id))];
      
      if (categoryIds.length === 0) return;
      
      try {
        const { data: categories, error } = await supabase
          .from('business_categories')
          .select('id, title')
          .in('id', categoryIds as number[]);
          
        if (error) {
          console.error("Error fetching category names:", error);
          return;
        }
        
        if (categories) {
          const categoryNameMap: { [categoryId: number]: string } = {};
          categories.forEach(category => {
            categoryNameMap[category.id] = category.title;
          });
          setCategoryNames(categoryNameMap);
        }
      } catch (err) {
        console.error("Error in fetchCategoryNames:", err);
      }
    }
    
    fetchCategoryNames();
  }, [businesses]);

  const categoryIds = [...new Set(businesses.filter(b => b.category_id).map(b => b.category_id))];

  const filteredBusinesses = businesses.filter(business => {
    const matchesStatus = statusFilter === "all" || business.status === statusFilter;
    const matchesType = businessTypeFilter === "all" || business.business_type === businessTypeFilter;
    const matchesCategory = categoryFilter === "all" || 
                           (business.category_id && categoryFilter === business.category_id.toString());
    
    const matchesSearch = searchQuery === "" || 
                         business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (business.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBusinesses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, businessTypeFilter, categoryFilter, searchQuery]);

  const businessTypes = [...new Set(businesses.map(business => business.business_type))];
  const statusTypes = [...new Set(businesses.map(business => business.status))];

  const handleViewBusiness = (id: string) => {
    router.push(`/search/${id}`);
  };

  const handleEditBusiness = (id: string) => {
    router.push(`/agent/edit-listing/${id}`);
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
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-indigo-500 border-r-indigo-500 border-b-indigo-500 animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-700 font-medium">Loading your registered businesses...</p>
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
              className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page title and stats banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Your Registered Businesses</h1>
              <p className="mt-2 text-indigo-100 max-w-2xl">
                View and manage all the businesses you've registered on our platform. Track their performance and ensure they're reaching potential customers effectively.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{businesses.length}</div>
                    <div className="text-xs text-indigo-100">Total Businesses</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {businesses.filter(b => b.status === "Now Open").length}
                    </div>
                    <div className="text-xs text-indigo-100">Currently Open</div>
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
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100 flex flex-wrap items-center justify-between">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gray-900 flex items-center"
            >
              <span className="mr-2 text-indigo-600">🏢</span> Business Directory
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 sm:mt-0"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/agent/add-listing')}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Register New Business
              </motion.button>
            </motion.div>
          </div>

          {/* Search and Filters */}
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
                Search & Filter Businesses
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 mt-1 md:mt-0"
              >
                {filteredBusinesses.length} of {businesses.length} businesses shown
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
                  placeholder="Search by business name, description, category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-3 w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
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
                  of {filteredBusinesses.length} items
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mt-3 sm:mt-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Showing {filteredBusinesses.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredBusinesses.length)} of {filteredBusinesses.length} entries
            </div>
          </div>

          {/* No businesses state */}
          {businesses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-md mx-auto"
              >
                <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21H5a2 2 0 01-2-2V6a2 2 0 012-2h7l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">No Businesses Registered</h3>
                <p className="mt-2 text-gray-500">You haven't registered any businesses yet.</p>
                <div className="mt-6">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/agent/add-listing')}
                    className="px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Register Your First Business
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
                <h3 className="mt-4 text-xl font-bold text-gray-900">No Matching Businesses</h3>
                <p className="mt-2 text-gray-500">No businesses match your current filters.</p>
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
                {currentItems.map((business, index) => (
                  <motion.li
                    key={business.id}
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
                          {business.logo_url ? (
                            <Image 
                              src={business.logo_url} 
                              alt={business.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                              <span className="text-2xl">🏢</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {business.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {business.business_type}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                              business.status === "Now Open" 
                                ? "bg-green-50 text-green-700 border border-green-100" 
                                : business.status === "Closed" 
                                ? "bg-red-50 text-red-700 border border-red-100" 
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {business.status === "Now Open" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>}
                              {business.status === "Closed" && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>}
                              {business.status !== "Now Open" && business.status !== "Closed" && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>}
                              {business.status}
                            </span>
                            {business.market_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {marketNames[business.market_id] || business.market_id}
                              </span>
                            )}
                            {business.category_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a1.99 1.99 0 013 0h5a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                </svg>
                                {business.category_id !== null && categoryNames[business.category_id] ? categoryNames[business.category_id] : `Category ${business.category_id}`}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Registered on {formatDate(business.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-0 sm:ml-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewBusiness(business.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <svg className="mr-2 h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditBusiness(business.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <svg className="mr-2 h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Edit
                        </motion.button>
                      </div>
                    </motion.div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                      {business.description || "No description provided."}
                    </p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-5 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  Previous
                </motion.button>
                
                {Array.from({ length: totalPages }, (_, index) => (
                  <motion.button
                    key={index + 1}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === index + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                    }`}
                  >
                    {index + 1}
                  </motion.button>
                ))}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
