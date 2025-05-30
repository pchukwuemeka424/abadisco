'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaSpinner, FaTimes, FaUpload, FaStore, FaUtensils, FaShoppingBag, FaHammer, FaCar, FaHome, FaTshirt, FaMobile, FaBook, FaPalette, FaGem, FaLeaf } from 'react-icons/fa';
import Image from 'next/image';

interface Category {
  id: number;
  title: string;
  description: string;
  image_path: string;
  icon_type: string;
  link_path: string;
  count?: number;
  total_businesses?: number;
  total_views?: number;
  total_clicks?: number;
  created_at?: string;
  updated_at?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => Promise<void>;
  category?: Category;
}

// Icon options for the dropdown
const iconOptions = [
  { value: 'store', label: 'General Store', icon: <FaStore /> },
  { value: 'food', label: 'Food & Restaurants', icon: <FaUtensils /> },
  { value: 'shopping', label: 'Shopping', icon: <FaShoppingBag /> },
  { value: 'tools', label: 'Hardware & Tools', icon: <FaHammer /> },
  { value: 'automotive', label: 'Automotive', icon: <FaCar /> },
  { value: 'realestate', label: 'Real Estate', icon: <FaHome /> },
  { value: 'fashion', label: 'Fashion & Clothing', icon: <FaTshirt /> },
  { value: 'electronics', label: 'Electronics', icon: <FaMobile /> },
  { value: 'books', label: 'Books & Stationery', icon: <FaBook /> },
  { value: 'art', label: 'Art & Crafts', icon: <FaPalette /> },
  { value: 'jewelry', label: 'Jewelry', icon: <FaGem /> },
  { value: 'produce', label: 'Fresh Produce', icon: <FaLeaf /> },
];

// Pre-defined category suggestions
const categorySuggestions = [
  'Food & Dining',
  'Clothing & Apparel',
  'Electronics',
  'Home & Garden',
  'Beauty & Personal Care',
  'Health & Wellness',
  'Automotive',
  'Sports & Outdoors',
  'Books & Stationery',
  'Toys & Games',
  'Jewelry & Accessories',
  'Art & Crafts',
  'Fresh Produce',
  'Hardware & Tools',
];

export default function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    title: '',
    description: '',
    image_path: '',
    icon_type: '',
    link_path: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    if (category) {
      setFormData({
        title: category.title || '',
        description: category.description || '',
        image_path: category.image_path || '',
        icon_type: category.icon_type || '',
        link_path: category.link_path || '',
      });
      
      if (category.image_path) {
        setImagePreview(category.image_path);
      }
    } else {
      // Reset form for new category
      setFormData({
        title: '',
        description: '',
        image_path: '',
        icon_type: '',
        link_path: '',
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setErrors({});
  }, [category, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Show suggestions when typing in title field
    if (name === 'title' && value.length > 0) {
      setShowSuggestions(true);
    } else if (name === 'title') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, title: suggestion }));
    setShowSuggestions(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
      
      // Clear error if any
      if (errors['image_path']) {
        setErrors((prev) => ({ ...prev, image_path: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 255) {
      newErrors.description = 'Description cannot exceed 255 characters';
    }
    
    if (!imagePreview && !formData.image_path) {
      newErrors.image_path = 'Image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_path;
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const filePath = `${fileName}.${fileExt}`;
    
    // Upload to the "category" bucket instead of "public"
    const { error: uploadError, data } = await supabase.storage
      .from('category')
      .upload(filePath, imageFile);
      
    if (uploadError) {
      throw new Error(`Error uploading image: ${uploadError.message}`);
    }
    
    // Get the public URL from the "category" bucket
    const { data: { publicUrl } } = supabase.storage
      .from('category')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Handle image upload if there's a new file
      let imagePath = formData.image_path;
      if (imageFile) {
        imagePath = await uploadImage();
      }
      
      // Create the final category object to save
      const categoryToSave: Category = {
        ...(category || { id: 0 }),  // Include id if updating
        ...formData,
        image_path: imagePath || '',
      };
      
      await onSave(categoryToSave);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isLoading}
                  maxLength={50}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
                
                {/* Category suggestions dropdown */}
                {showSuggestions && formData.title && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {categorySuggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(formData.title!.toLowerCase()))
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 text-sm hover:bg-blue-100 cursor-pointer"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isLoading}
                  maxLength={255}
                />
                {errors.description ? (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description?.length || 0}/255 characters
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="icon_type" className="block text-sm font-medium text-gray-700">
                  Icon Type
                </label>
                <div className="mt-1 relative">
                  <select
                    id="icon_type"
                    name="icon_type"
                    value={formData.icon_type}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="">Select an icon</option>
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Icon preview */}
                {formData.icon_type && (
                  <div className="mt-2 flex items-center">
                    <span className="mr-2">Selected icon:</span>
                    <span className="text-blue-600">
                      {iconOptions.find(opt => opt.value === formData.icon_type)?.icon}
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Choose an icon that represents this category.
                </p>
              </div>
              
              <div>
                <label htmlFor="link_path" className="block text-sm font-medium text-gray-700">
                  Link Path
                </label>
                <input
                  type="text"
                  id="link_path"
                  name="link_path"
                  value={formData.link_path}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  maxLength={100}
                  placeholder="/markets?category=your-category-slug"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional. Custom URL for this category.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image <span className="text-red-500">*</span>
              </label>
              
              <div
                className={`border-2 border-dashed ${
                  errors.image_path ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-4 text-center hover:bg-gray-50 transition-colors`}
              >
                {imagePreview ? (
                  <div className="relative h-48 mb-4">
                    <Image
                      src={imagePreview}
                      alt="Category preview"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center mb-4">
                    <FaUpload size={40} className="text-gray-400" />
                  </div>
                )}
                
                <label
                  htmlFor="image"
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="sr-only"
                    disabled={isLoading}
                  />
                </label>
                
                {errors.image_path && (
                  <p className="mt-2 text-sm text-red-600">{errors.image_path}</p>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  Recommended size: 800x600px. PNG or JPG format.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="inline mr-2 animate-spin" />
                  {category ? 'Updating...' : 'Creating...'}
                </>
              ) : category ? (
                'Update Category'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}