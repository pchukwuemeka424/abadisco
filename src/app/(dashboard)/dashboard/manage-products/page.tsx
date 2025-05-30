"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FaBox, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCloudUploadAlt,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaImage,
  FaPlus
} from 'react-icons/fa';

// Product type definition
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category_id: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  image_urls: string | null;
  owner_id: string;
  market_id: string | null;
  views_count: number;
  is_featured: boolean;
  quantity: number | null;
  condition: string | null;
  category_name?: string;
  market_name?: string;
}

export default function ManageProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get('id');
  
  // State variables
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Fetch products data
  useEffect(() => {
    if (!user) return;
    
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate pagination ranges
        const from = (currentPage - 1) * productsPerPage;
        const to = from + productsPerPage - 1;
        
        // Start building the query
        let query = supabase
          .from('products')
          .select(`
            *,
            categories:category_id (name),
            markets:market_id (name)
          `, { count: 'exact' })
          .eq('owner_id', user.id);
        
        // Apply search if provided
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
          query = query.eq('category_id', categoryFilter);
        }
        
        // Apply sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        
        // Apply pagination
        query = query.range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) {
          throw new Error(`Error fetching products: ${error.message}`);
        }
        
        // Process the data to extract nested values
        const processedData = data?.map(item => ({
          ...item,
          category_name: item.categories?.name || 'Uncategorized',
          market_name: item.markets?.name || 'No Market'
        })) || [];
        
        setProducts(processedData);
        setTotalProducts(count || 0);
        
        // If we have a product ID from URL, select that product
        if (productIdFromUrl) {
          const selectedProd = processedData.find(p => p.id === productIdFromUrl);
          if (selectedProd) {
            setSelectedProduct(selectedProd);
            setIsEditMode(true);
          }
        }
        
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [user, currentPage, productsPerPage, searchQuery, sortField, sortOrder, statusFilter, categoryFilter, productIdFromUrl]);
  
  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
          
        if (error) {
          throw new Error(`Error fetching categories: ${error.message}`);
        }
        
        setCategories(data || []);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handleSort = (field: string) => {
    // If clicking on the current sort field, toggle the order
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking on a different field, set it as the new sort field with default desc order
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };
  
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    // Update URL with product ID for sharing/bookmarking
    router.push(`/dashboard/manage-products?id=${product.id}`);
  };
  
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
        
      if (error) {
        throw new Error(`Error deleting product: ${error.message}`);
      }
      
      // Remove the product from the list
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      
      // If we're in edit mode, exit edit mode and clear URL
      if (isEditMode) {
        setIsEditMode(false);
        router.push('/dashboard/manage-products');
      }
      
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    }
  };
  
  const handleCancelEdit = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
    router.push('/dashboard/manage-products');
  };
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  // Get the image URL for a product
  const getProductImageUrl = (product: Product) => {
    if (!product.image_urls) return '/images/logo.png';
    const urls = product.image_urls.split(',');
    return urls[0] || '/images/logo.png';
  };
  
  // Format price for display
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Not specified';
    return `₦${price.toLocaleString()}`;
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render edit product form - simplified version redirecting to full editor
  const renderEditForm = () => {
    if (!selectedProduct) return null;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Edit Product</h2>
          <button 
            onClick={handleCancelEdit}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="aspect-square w-full relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src={getProductImageUrl(selectedProduct)}
                alt={selectedProduct.name || 'Product'}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/logo.png';
                }}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                For full editing capabilities, please use the dedicated product editor.
              </p>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-800 mb-1">{selectedProduct.name}</h3>
              <p className="text-slate-600">{selectedProduct.description || 'No description provided.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500">Price</p>
                <p className="text-base font-semibold text-slate-800">{formatPrice(selectedProduct.price)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Category</p>
                <p className="text-base font-semibold text-slate-800">{selectedProduct.category_name || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Market</p>
                <p className="text-base font-semibold text-slate-800">{selectedProduct.market_name || 'No Market'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedProduct.status)}`}>
                  {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link 
                href={`/dashboard/upload-products?edit=${selectedProduct.id}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <FaEdit className="inline-block mr-2" /> Edit in Full Editor
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <FaTrash className="inline-block mr-2" /> Delete Product
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manage Products</h1>
          <p className="mt-2 text-slate-500">
            View, edit, and manage all your products in the marketplace.
          </p>
        </div>
        
        {/* Alert for errors */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        {/* Edit product form (when in edit mode) */}
        {isEditMode && renderEditForm()}
        
        {/* Product management tools */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Your Products <span className="text-sm font-normal text-slate-500">({totalProducts} total)</span>
              </h2>
              <Link 
                href="/dashboard/upload-products" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <FaPlus className="mr-2" /> Add New Product
              </Link>
            </div>
          </div>
          
          {/* Filters and search bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap gap-3">
                <div className="w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="block w-full py-2 pl-3 pr-10 border border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="w-full md:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                    className="block w-full py-2 pl-3 pr-10 border border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-auto">
                  <button
                    onClick={() => handleSort(sortField)}
                    className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50"
                  >
                    {sortOrder === 'asc' ? <FaSortAmountUp className="text-slate-500" /> : <FaSortAmountDown className="text-slate-500" />}
                    <span className="text-sm">{sortField === 'created_at' ? 'Date' : 'Name'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : products.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('price')}
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Date Added
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="rounded-md object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/logo.png';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 truncate max-w-xs">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {product.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.quantity && (
                          <div className="text-xs text-slate-500">
                            Qty: {product.quantity}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {product.category_name || 'Uncategorized'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.market_name || 'No Market'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(product.status)}`}>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit product"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete product"
                          >
                            <FaTrash />
                          </button>
                          <Link
                            href={`/products/${product.id}`}
                            className="text-green-600 hover:text-green-900"
                            title="View product"
                          >
                            <FaEye />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FaBox className="text-slate-400 h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No products found</h3>
                <p className="text-slate-500 text-center mb-6">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You haven't added any products yet. Add your first product to start selling."}
                </p>
                <Link 
                  href="/dashboard/upload-products" 
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <FaCloudUploadAlt className="mr-2" /> 
                  Upload Your First Product
                </Link>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)}</span>{' '}
                    to <span className="font-medium">{Math.min(currentPage * productsPerPage, totalProducts)}</span>{' '}
                    of <span className="font-medium">{totalProducts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <FaChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      
                      // Show current page, first, last, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      
                      // Show ellipsis for skipped pages
                      if (
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <FaChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-indigo-50 mr-4">
                <FaBox className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Products</p>
                <h3 className="text-xl font-bold text-slate-800">{totalProducts}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-50 mr-4">
                <FaEye className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Views</p>
                <h3 className="text-xl font-bold text-slate-800">
                  {products.reduce((sum, product) => sum + (product.views_count || 0), 0)}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-amber-50 mr-4">
                <FaImage className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Featured Products</p>
                <h3 className="text-xl font-bold text-slate-800">
                  {products.filter(product => product.is_featured).length}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setIsDeleteModalOpen(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white p-6 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Delete Product</h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">
                        Are you sure you want to delete the product "{selectedProduct.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}