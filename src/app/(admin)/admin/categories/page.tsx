'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSync, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import CategoryStats from '../components/CategoryStats';
import CategoriesTable from '../components/CategoriesTable';
import CategoryModal from '../components/CategoryModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import type { Category } from '../components/CategoriesTable';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the stored function to get categories with stats
      const { data, error } = await supabase.rpc('admin_get_business_categories_with_stats');

      if (error) {
        throw new Error(error.message);
      }

      setCategories(data as Category[]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryCounts = async () => {
    setIsLoading(true);
    try {
      // First, get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('business_categories')
        .select('id, title');
      
      if (categoriesError) throw new Error(categoriesError.message);
      
      // For each category, count the businesses
      for (const category of categories) {
        // Count businesses in this category
        const { count, error: countError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        if (countError) throw new Error(countError.message);
        
        // Update the count in the category table
        const { error: updateError } = await supabase
          .from('business_categories')
          .update({ count: count || 0 })
          .eq('id', category.id);
        
        if (updateError) throw new Error(updateError.message);
        
        // Check if we have a stats record, if not create one
        const { data: statsData, error: statsError } = await supabase
          .from('business_categories_stats')
          .select('*')
          .eq('category_id', category.id);
        
        if (statsError) throw new Error(statsError.message);
        
        if (!statsData || statsData.length === 0) {
          // Create stats record
          const { error: insertError } = await supabase
            .from('business_categories_stats')
            .insert({
              category_id: category.id,
              total_businesses: count || 0,
              total_views: 0,
              total_clicks: 0,
              last_updated: new Date().toISOString()
            });
          
          if (insertError) throw new Error(insertError.message);
        } else {
          // Update existing stats record
          const { error: updateStatsError } = await supabase
            .from('business_categories_stats')
            .update({
              total_businesses: count || 0,
              last_updated: new Date().toISOString()
            })
            .eq('category_id', category.id);
          
          if (updateStatsError) throw new Error(updateStatsError.message);
        }
      }
      
      // Refresh categories to show updated counts
      await fetchCategories();
    } catch (err) {
      console.error('Error updating category counts:', err);
      setError('Failed to update category counts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setIsDeleteModalOpen(true);
  };

  const saveCategory = async (category: Category) => {
    try {
      if (category.id) {
        // Update existing category
        const { error } = await supabase.rpc('admin_update_business_category', {
          p_category_id: category.id,
          p_title: category.title,
          p_description: category.description,
          p_image_path: category.image_path,
          p_icon_type: category.icon_type || '',
          p_link_path: category.link_path || ''
        });

        if (error) throw new Error(error.message);
      } else {
        // Create new category
        const { error } = await supabase.rpc('admin_create_business_category', {
          p_title: category.title,
          p_description: category.description,
          p_image_path: category.image_path,
          p_icon_type: category.icon_type || '',
          p_link_path: category.link_path || ''
        });

        if (error) throw new Error(error.message);
      }

      // Refresh categories
      await fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      throw err;
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('admin_delete_business_category', {
        p_category_id: categoryToDelete
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh categories
      await fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      // Improved error handling to ensure we always have a meaningful message
      const errorMessage = err.message || (err.details ? err.details : 'Unknown error occurred');
      setError(`Failed to delete category: ${errorMessage}`);
      // Remove alert and use the error state instead
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Categories Management</h1>
        <p className="mt-1 text-gray-600">
          Manage the business categories displayed on the marketplace
        </p>
      </div>
      
      <CategoryStats />

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center text-sm text-blue-800 bg-blue-50 p-3 rounded-lg mb-4">
          <FaInfoCircle className="mr-2 text-blue-500" />
          <p>
            Business categories are used to organize businesses in the marketplace. 
            Each category can have a title, description, image, and icon.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-between items-center mb-4">
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Category
          </button>
          
          <button
            onClick={updateCategoryCounts}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Update Category Counts
          </button>
        </div>
      </div>
      
      <CategoriesTable
        categories={categories}
        isLoading={isLoading}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        refreshData={fetchCategories}
      />
      
      {isModalOpen && (
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={saveCategory}
          category={currentCategory || undefined}
        />
      )}
      
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteCategory}
          title="Delete Category"
          message={`Are you sure you want to delete this category? This action cannot be undone, and any businesses in this category will be affected.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}