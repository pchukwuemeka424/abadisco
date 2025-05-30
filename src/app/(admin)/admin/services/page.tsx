"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

export default function ServicesManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("categories");
  const [loading, setLoading] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [subServiceCategories, setSubServiceCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState({
    categories: 0,
    subcategories: 0,
  });

  // Modal states for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<"category" | "subcategory">("category");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form state for adding new items
  const [newServiceCategory, setNewServiceCategory] = useState({
    name: "",
    description: "",
  });
  
  const [newSubServiceCategory, setNewSubServiceCategory] = useState({
    name: "",
    parent_id: "",
    description: "",
  });

  // Reset pagination when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Calculate pagination info for current tab
  const getCurrentTabTotalItems = () => totalItems[activeTab as keyof typeof totalItems] || 0;
  const getTotalPages = () => Math.ceil(getCurrentTabTotalItems() / itemsPerPage);

  // Get paginated data for current tab
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    switch (activeTab) {
      case 'categories':
        return serviceCategories.slice(startIndex, endIndex);
      case 'subcategories':
        return subServiceCategories.slice(startIndex, endIndex);
      default:
        return [];
    }
  };

  // Fetch all service data on component mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError("");

      try {
        // Calculate the range for pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // Fetch service categories
        if (activeTab === 'categories') {
          const { data: categories, error: categoriesError, count: categoriesCount } = await supabase
            .from('service_categories')
            .select('*', { count: 'exact' })
            .order('name')
            .range(from, to);

          if (categoriesError) throw new Error(`Error fetching service categories: ${categoriesError.message}`);
          setServiceCategories(categories || []);
          if (categoriesCount !== null) {
            setTotalItems(prev => ({ ...prev, categories: categoriesCount }));
          }
        }

        // Fetch sub-service categories with parent category name
        if (activeTab === 'subcategories') {
          const { data: subcategories, error: subcategoriesError, count: subcategoriesCount } = await supabase
            .from('sub_service_categories')
            .select(`
              *,
              service_categories:parent_id (name)
            `, { count: 'exact' })
            .order('name')
            .range(from, to);

          if (subcategoriesError) throw new Error(`Error fetching sub-service categories: ${subcategoriesError.message}`);
          setSubServiceCategories(subcategories || []);
          if (subcategoriesCount !== null) {
            setTotalItems(prev => ({ ...prev, subcategories: subcategoriesCount }));
          }
        }

      } catch (err: any) {
        console.error("Error fetching services data:", err);
        setError(err.message || "Failed to load services data");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [currentPage, itemsPerPage, activeTab]);

  // Handlers for page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= getTotalPages()) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handlers for adding new items
  const handleAddServiceCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from('service_categories')
        .insert([
          {
            name: newServiceCategory.name,
            description: newServiceCategory.description || null,
          }
        ])
        .select();

      if (error) throw new Error(`Error adding service category: ${error.message}`);

      setServiceCategories([...serviceCategories, data![0]]);
      setNewServiceCategory({ name: "", description: "" });
      setSuccess("Service category added successfully!");

      // Refresh the data
      router.refresh();

    } catch (err: any) {
      console.error("Error adding service category:", err);
      setError(err.message || "Failed to add service category");
    }
  };

  const handleAddSubServiceCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from('sub_service_categories')
        .insert([
          {
            name: newSubServiceCategory.name,
            parent_id: parseInt(newSubServiceCategory.parent_id),
            description: newSubServiceCategory.description || null,
          }
        ])
        .select();

      if (error) throw new Error(`Error adding sub-service category: ${error.message}`);

      // Refresh sub-categories data to include the relationship data
      const { data: updatedSubCategory, error: fetchError } = await supabase
        .from('sub_service_categories')
        .select(`
          *,
          service_categories:parent_id (name)
        `)
        .eq('id', data![0].id)
        .single();

      if (fetchError) throw new Error(`Error fetching updated sub-category: ${fetchError.message}`);

      setSubServiceCategories([...subServiceCategories, updatedSubCategory]);
      setNewSubServiceCategory({
        name: "",
        parent_id: "",
        description: "",
      });
      setSuccess("Sub-service category added successfully!");

      // Refresh the data
      router.refresh();

    } catch (err: any) {
      console.error("Error adding sub-service category:", err);
      setError(err.message || "Failed to add sub-service category");
    }
  };

  // Handler for deleting items
  const handleDelete = async (table: string, id: number) => {
    if (!confirm(`Are you sure you want to delete this item? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Error deleting item: ${error.message}`);

      // Update state based on which table was affected
      if (table === 'service_categories') {
        setServiceCategories(serviceCategories.filter(item => item.id !== id));
      } else if (table === 'sub_service_categories') {
        setSubServiceCategories(subServiceCategories.filter(item => item.id !== id));
      }

      setSuccess(`Item deleted successfully!`);

      // Refresh the data
      router.refresh();

    } catch (err: any) {
      console.error("Error deleting item:", err);
      // Improved error handling to ensure we always have a meaningful message
      const errorMessage = err.message || (err.details ? err.details : 'Unknown error occurred');
      setError(`Failed to delete item: ${errorMessage}`);
    }
  };

  // Handlers for editing items
  const handleOpenEditModal = (type: "category" | "subcategory", item: any) => {
    setEditModalType(type);
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleUpdateServiceCategory = async (updatedItem: any) => {
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('service_categories')
        .update({
          name: updatedItem.name,
          description: updatedItem.description || null,
        })
        .eq('id', updatedItem.id);

      if (error) throw new Error(`Error updating service category: ${error.message}`);

      // Update state
      setServiceCategories(
        serviceCategories.map(item => item.id === updatedItem.id ? updatedItem : item)
      );

      setSuccess("Service category updated successfully!");
      handleCloseEditModal();

      // Refresh the data
      router.refresh();

    } catch (err: any) {
      console.error("Error updating service category:", err);
      setError(err.message || "Failed to update service category");
    }
  };

  const handleUpdateSubServiceCategory = async (updatedItem: any) => {
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('sub_service_categories')
        .update({
          name: updatedItem.name,
          parent_id: updatedItem.parent_id,
          description: updatedItem.description || null,
        })
        .eq('id', updatedItem.id);

      if (error) throw new Error(`Error updating sub-service category: ${error.message}`);

      // Refresh the updated sub-category with relationships
      const { data: updatedSubCategory, error: fetchError } = await supabase
        .from('sub_service_categories')
        .select(`
          *,
          service_categories:parent_id (name)
        `)
        .eq('id', updatedItem.id)
        .single();

      if (fetchError) throw new Error(`Error fetching updated sub-category: ${fetchError.message}`);

      // Update state with the refreshed data
      setSubServiceCategories(
        subServiceCategories.map(item => item.id === updatedItem.id ? updatedSubCategory : item)
      );

      setSuccess("Sub-service category updated successfully!");
      handleCloseEditModal();

      // Refresh the data
      router.refresh();

    } catch (err: any) {
      console.error("Error updating sub-service category:", err);
      setError(err.message || "Failed to update sub-service category");
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, getCurrentTabTotalItems())}
              </span>{" "}
              of <span className="font-medium">{getCurrentTabTotalItems()}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                  currentPage === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                } focus:z-20 focus:outline-offset-0`}
              >
                <span className="sr-only">Previous</span>
                <FaAngleLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === page
                      ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                  currentPage === totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                } focus:z-20 focus:outline-offset-0`}
              >
                <span className="sr-only">Next</span>
                <FaAngleRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Services Management</h1>

      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("categories")}
            className={`py-2 px-3 font-medium ${
              activeTab === "categories"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Service Categories
          </button>
          <button
            onClick={() => setActiveTab("subcategories")}
            className={`py-2 px-3 font-medium ${
              activeTab === "subcategories"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sub-Service Categories
          </button>
        </nav>
      </div>

      {/* Items per page selector */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center">
          <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-700">
            Items per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Service Categories Tab Content */}
      {!loading && activeTab === "categories" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Service Categories</h2>
          <p className="text-gray-600">These are the main categories of services such as Restaurant, Hotel, Barbing Salon, etc.</p>

          {/* Add New Service Category Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New Service Category</h3>
            <form onSubmit={handleAddServiceCategory} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newServiceCategory.name}
                    onChange={(e) => setNewServiceCategory({...newServiceCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newServiceCategory.description}
                    onChange={(e) => setNewServiceCategory({...newServiceCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Service Category
              </button>
            </form>
          </div>

          {/* Service Categories Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedData().map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal('category', category)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('service_categories', category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {getPaginatedData().length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No service categories found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {renderPagination()}
        </div>
      )}

      {/* Sub-Service Categories Tab Content */}
      {!loading && activeTab === "subcategories" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Sub-Service Categories</h2>
          <p className="text-gray-600">These are subcategories for each main service category, such as "Fast Food" under Restaurant.</p>

          {/* Add New Sub-Service Category Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New Sub-Service Category</h3>
            <form onSubmit={handleAddSubServiceCategory} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newSubServiceCategory.name}
                    onChange={(e) => setNewSubServiceCategory({...newSubServiceCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                  <select
                    value={newSubServiceCategory.parent_id}
                    onChange={(e) => setNewSubServiceCategory({...newSubServiceCategory, parent_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a Parent Category</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newSubServiceCategory.description}
                    onChange={(e) => setNewSubServiceCategory({...newSubServiceCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Sub-Service Category
              </button>
            </form>
          </div>

          {/* Sub-Service Categories Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedData().map((subcategory) => (
                  <tr key={subcategory.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subcategory.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subcategory.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subcategory.service_categories ? subcategory.service_categories.name : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subcategory.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subcategory.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal('subcategory', subcategory)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('sub_service_categories', subcategory.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {getPaginatedData().length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No sub-service categories found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {renderPagination()}
        </div>
      )}

      {/* Edit Modals */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={handleCloseEditModal}
              aria-hidden="true"
            ></div>
            
            {/* Modal content */}
            <div 
              className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              onClick={(e) => e.stopPropagation()} // Prevent clicks on the modal from closing it
            >
              {/* Close button */}
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editModalType === 'category' && 'Edit Service Category'}
                    {editModalType === 'subcategory' && 'Edit Sub-Service Category'}
                  </h3>
                  
                  <div className="mt-4">
                    {/* Edit Service Category Form */}
                    {editModalType === 'category' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateServiceCategory(selectedItem);
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={selectedItem.name}
                              onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={selectedItem.description || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseEditModal}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {/* Edit Sub-Service Category Form */}
                    {editModalType === 'subcategory' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateSubServiceCategory(selectedItem);
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={selectedItem.name}
                              onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                            <select
                              value={selectedItem.parent_id || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, parent_id: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select a Parent Category</option>
                              {serviceCategories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={selectedItem.description || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseEditModal}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}