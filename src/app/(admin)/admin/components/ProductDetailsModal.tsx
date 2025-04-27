'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTimes } from 'react-icons/fa';

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

type ProductDetailsModalProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const [productData, setProductData] = useState(product);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category
        })
        .eq('id', productData.id);
        
      if (error) throw error;
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const imageUrls = productData.image_urls ? productData.image_urls.split(',') : [];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
        
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
            
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Product Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="name"
                        value={productData.name || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{productData.name || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={productData.description || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{productData.description || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="price"
                          value={productData.price || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{productData.price ? `₦${productData.price}` : 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="category"
                          value={productData.category || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{productData.category || 'Uncategorized'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <p className="text-gray-900">{productData.business?.business_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <p className="text-gray-900">{productData.business?.full_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
                    <p className="text-gray-900">
                      {new Date(productData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
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