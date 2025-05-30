'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaEye, FaTrash, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductDetailsModal from './ProductDetailsModal';

type Product = {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  image_urls: string | null;
};

interface ProductsTableProps {
  searchTerm?: string;
}

export default function ProductsTable({ searchTerm = '' }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Fetch products when page changes or search term changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);

      // First get count for pagination
      const countQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: false });
      
      if (searchTerm) {
        countQuery.ilike('title', `%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting count:', countError);
        setError(`Error getting count: ${countError.message}`);
        return;
      }

      setTotalCount(count || 0);

      // Now fetch the data for current page
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search filter if provided
      if (searchTerm) {
        query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        setError(`Error fetching products: ${error.message}`);
        return;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error('Exception fetching products:', error);
      setError(`Exception: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        // Start loading indicator
        setLoading(true);

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        // Remove from local state
        setProducts(products.filter(product => product.id !== productId));
        
        // Refresh count
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true });
          
        setTotalCount(count || 0);
        
        // If we deleted the last item on the page, go back one page (unless we're on first page)
        if (products.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        console.error('Error deleting product:', error);
        // Improved error handling
        const errorMessage = error.message || (error.details ? error.details : 'Unknown error occurred');
        setError(`Error deleting product: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mb-2" />
          <p>Loading products data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p className="font-bold mb-2">Error loading products:</p>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => fetchProducts()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Empty state warning */}
      {products.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'No products match your search' : 'No products found'}
          </h3>
          <p className="mb-4">
            {searchTerm
              ? `We couldn't find any products matching "${searchTerm}"`
              : 'The products table is empty. Start by adding a new product.'}
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add New Product
          </button>
        </div>
      )}

      {/* Products table */}
      {products.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.image_urls ? (
                            <img
                              src={extractFirstImageUrl(product.image_urls)}
                              alt={product.title || 'Product image'}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/logo.png';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">No img</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.title || 'Untitled Product'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono text-xs">
                        {product.user_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => handleViewDetails(product)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Product"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{' '}
              of <span className="font-medium">{totalCount}</span> products
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <FaChevronLeft size={14} />
              </button>
              
              {generatePaginationButtons()}
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
          onProductUpdated={(updatedProduct) => {
            // Update the product in the local state
            setProducts(
              products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            );
          }}
        />
      )}
    </div>
  );

  // Helper function to extract first image URL from image_urls string
  function extractFirstImageUrl(imageUrls: string): string {
    try {
      // First try to parse as JSON array
      if (imageUrls.startsWith('[')) {
        const parsed = JSON.parse(imageUrls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }
      
      // If not JSON, try as comma-separated string
      if (imageUrls.includes(',')) {
        return imageUrls.split(',')[0].trim();
      }
      
      // Otherwise return as is
      return imageUrls;
    } catch (e) {
      // If parsing fails, return as is
      return imageUrls;
    }
  }

  // Helper function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  // Helper function to generate pagination buttons
  function generatePaginationButtons() {
    const buttons = [];
    const maxButtonsToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    // Adjust startPage if we're near the end
    startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    
    // Show first page if not included
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-3 py-1">
            ...
          </span>
        );
      }
    }
    
    // Add numbered buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Show last page if not included
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="dots2" className="px-3 py-1">
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key="last"
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  }
}