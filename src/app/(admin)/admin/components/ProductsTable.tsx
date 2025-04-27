'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaEye, FaTrash } from 'react-icons/fa';
import ProductDetailsModal from './ProductDetailsModal';

type Product = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: string;
  image_urls: string;
  category: string;
  created_at: string;
  business: {
    business_name: string;
    full_name: string;
  } | null;
};

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            users:user_id(business_name, full_name)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);
  
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        
        if (error) throw error;
        
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };
  
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower) ||
      product.business?.business_name?.toLowerCase().includes(searchLower)
    );
  });
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading products data...</div>;
  }
  
  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products by name, description, category, business..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Business</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Date Added</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        {product.image_urls && (
                          <img
                            src={product.image_urls.split(',')[0]}
                            alt={product.name || 'Product image'}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/logo.png';
                            }}
                          />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name || 'Unnamed Product'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{product.business?.business_name || 'N/A'}</td>
                  <td className="py-3 px-4">{product.category || 'Uncategorized'}</td>
                  <td className="py-3 px-4">{product.price ? `₦${product.price}` : 'N/A'}</td>
                  <td className="py-3 px-4">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleViewDetails(product)}
                        className="text-blue-500 hover:text-blue-700"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
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
      ) : (
        <div className="text-center py-10">
          {searchTerm ? 'No products match your search criteria.' : 'No products found.'}
        </div>
      )}
      
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}