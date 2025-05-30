'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTimes, FaSpinner } from 'react-icons/fa';

type Product = {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  image_urls: string | null;
};

type ProductDetailsModalProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated?: (product: Product) => void;
};

export default function ProductDetailsModal({ 
  product, 
  isOpen, 
  onClose,
  onProductUpdated
}: ProductDetailsModalProps) {
  const [productData, setProductData] = useState<Product>(product);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .update({
          title: productData.title,
        })
        .eq('id', productData.id)
        .select()
        .single();

      if (error) throw error;

      setIsEditing(false);
      
      // If the parent component provided onProductUpdated callback
      if (onProductUpdated && data) {
        onProductUpdated(data);
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Parse and process image URLs for display
  const getImageUrls = (): string[] => {
    if (!productData.image_urls) return [];

    try {
      // Try to parse as JSON if it looks like JSON
      if (productData.image_urls.startsWith('[')) {
        const parsed = JSON.parse(productData.image_urls);
        return Array.isArray(parsed) ? parsed : [productData.image_urls];
      } 
      
      // If it contains commas, treat as comma-separated list
      if (productData.image_urls.includes(',')) {
        return productData.image_urls.split(',').map(url => url.trim());
      }
      
      // Otherwise treat as single URL
      return [productData.image_urls];
    } catch (e) {
      // If JSON parsing fails, just return the string as a single URL
      return [productData.image_urls];
    }
  };

  const imageUrls = getImageUrls();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Product' : 'Product Details'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Images column */}
            <div className="lg:col-span-1">
              {imageUrls.length > 0 ? (
                <div className="space-y-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-auto object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-10 flex items-center justify-center">
                  <p className="text-gray-500">No product images</p>
                </div>
              )}
            </div>

            {/* Details column */}
            <div className="lg:col-span-2">
              {/* Product Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Product Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="title"
                        value={productData.title || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter product title"
                      />
                    ) : (
                      <p className="text-gray-900 p-2 bg-gray-50 rounded">{productData.title || 'No title provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded font-mono text-xs">
                      {productData.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded font-mono text-xs">
                      {productData.user_id || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
                    <p className="text-gray-900 p-2 bg-gray-50 rounded">
                      {new Date(productData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center gap-2"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setProductData(product); // Reset to original data
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}