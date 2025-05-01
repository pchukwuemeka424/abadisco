"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ServicesManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("types");
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [generalServices, setGeneralServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [specificServices, setSpecificServices] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<"type" | "general" | "category" | "specific">("type");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form state for adding new items
  const [newServiceType, setNewServiceType] = useState({ name: "", description: "", icon: "" });
  const [newGeneralService, setNewGeneralService] = useState({ name: "", description: "", icon: "" });
  const [newServiceCategory, setNewServiceCategory] = useState({ 
    name: "", 
    service_type_id: "", 
    description: "", 
    is_subcategory: false,
    parent_category_id: null 
  });
  const [newSpecificService, setNewSpecificService] = useState({ 
    name: "", 
    category_id: "", 
    description: "", 
    is_active: true 
  });

  // Fetch all service data on component mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Fetch service types
        const { data: types, error: typesError } = await supabase
          .from('service_types')
          .select('*')
          .order('name');
          
        if (typesError) throw new Error(`Error fetching service types: ${typesError.message}`);
        setServiceTypes(types || []);
        
        // Fetch general services
        const { data: general, error: generalError } = await supabase
          .from('general_services')
          .select('*')
          .order('name');
          
        if (generalError) throw new Error(`Error fetching general services: ${generalError.message}`);
        setGeneralServices(general || []);
        
        // Fetch service categories with service type name
        const { data: categories, error: categoriesError } = await supabase
          .from('service_categories')
          .select(`
            *,
            service_types:service_type_id (name),
            parent_category:parent_category_id (name)
          `)
          .order('name');
          
        if (categoriesError) throw new Error(`Error fetching service categories: ${categoriesError.message}`);
        setServiceCategories(categories || []);
        
        // Fetch specific services with category name
        const { data: specific, error: specificError } = await supabase
          .from('specific_services')
          .select(`
            *,
            service_categories:category_id (name, service_type_id, service_types:service_type_id(name))
          `)
          .order('name');
          
        if (specificError) throw new Error(`Error fetching specific services: ${specificError.message}`);
        setSpecificServices(specific || []);
        
      } catch (err: any) {
        console.error("Error fetching services data:", err);
        setError(err.message || "Failed to load services data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  // Handlers for adding new items
  const handleAddServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const { data, error } = await supabase
        .from('service_types')
        .insert([
          { 
            name: newServiceType.name, 
            description: newServiceType.description || null,
            icon: newServiceType.icon || null
          }
        ])
        .select();
        
      if (error) throw new Error(`Error adding service type: ${error.message}`);
      
      setServiceTypes([...serviceTypes, data![0]]);
      setNewServiceType({ name: "", description: "", icon: "" });
      setSuccess("Service type added successfully!");
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error adding service type:", err);
      setError(err.message || "Failed to add service type");
    }
  };
  
  const handleAddGeneralService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const { data, error } = await supabase
        .from('general_services')
        .insert([
          { 
            name: newGeneralService.name, 
            description: newGeneralService.description || null,
            icon: newGeneralService.icon || null
          }
        ])
        .select();
        
      if (error) throw new Error(`Error adding general service: ${error.message}`);
      
      setGeneralServices([...generalServices, data![0]]);
      setNewGeneralService({ name: "", description: "", icon: "" });
      setSuccess("General service added successfully!");
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error adding general service:", err);
      setError(err.message || "Failed to add general service");
    }
  };
  
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
            service_type_id: newServiceCategory.service_type_id || null,
            description: newServiceCategory.description || null,
            is_subcategory: newServiceCategory.is_subcategory,
            parent_category_id: newServiceCategory.is_subcategory ? newServiceCategory.parent_category_id : null
          }
        ])
        .select();
        
      if (error) throw new Error(`Error adding service category: ${error.message}`);
      
      // Refresh categories data to include the relationship data
      const { data: updatedCategory, error: fetchError } = await supabase
        .from('service_categories')
        .select(`
          *,
          service_types:service_type_id (name),
          parent_category:parent_category_id (name)
        `)
        .eq('id', data![0].id)
        .single();
        
      if (fetchError) throw new Error(`Error fetching updated category: ${fetchError.message}`);
      
      setServiceCategories([...serviceCategories, updatedCategory]);
      setNewServiceCategory({ 
        name: "", 
        service_type_id: "", 
        description: "", 
        is_subcategory: false,
        parent_category_id: null 
      });
      setSuccess("Service category added successfully!");
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error adding service category:", err);
      setError(err.message || "Failed to add service category");
    }
  };
  
  const handleAddSpecificService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const { data, error } = await supabase
        .from('specific_services')
        .insert([
          { 
            name: newSpecificService.name, 
            category_id: newSpecificService.category_id || null,
            description: newSpecificService.description || null,
            is_active: newSpecificService.is_active
          }
        ])
        .select();
        
      if (error) throw new Error(`Error adding specific service: ${error.message}`);
      
      // Refresh specific services data to include the relationship data
      const { data: updatedService, error: fetchError } = await supabase
        .from('specific_services')
        .select(`
          *,
          service_categories:category_id (name, service_type_id, service_types:service_type_id(name))
        `)
        .eq('id', data![0].id)
        .single();
        
      if (fetchError) throw new Error(`Error fetching updated service: ${fetchError.message}`);
      
      setSpecificServices([...specificServices, updatedService]);
      setNewSpecificService({ 
        name: "", 
        category_id: "", 
        description: "", 
        is_active: true 
      });
      setSuccess("Specific service added successfully!");
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error adding specific service:", err);
      setError(err.message || "Failed to add specific service");
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
      if (table === 'service_types') {
        setServiceTypes(serviceTypes.filter(item => item.id !== id));
      } else if (table === 'general_services') {
        setGeneralServices(generalServices.filter(item => item.id !== id));
      } else if (table === 'service_categories') {
        setServiceCategories(serviceCategories.filter(item => item.id !== id));
      } else if (table === 'specific_services') {
        setSpecificServices(specificServices.filter(item => item.id !== id));
      }
      
      setSuccess(`Item deleted successfully!`);
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error deleting item:", err);
      setError(err.message || "Failed to delete item");
    }
  };

  // Handlers for editing items
  const handleOpenEditModal = (type: "type" | "general" | "category" | "specific", item: any) => {
    setEditModalType(type);
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };
  
  const handleUpdateServiceType = async (updatedItem: any) => {
    setError("");
    setSuccess("");
    
    try {
      const { error } = await supabase
        .from('service_types')
        .update({
          name: updatedItem.name,
          description: updatedItem.description || null,
          icon: updatedItem.icon || null
        })
        .eq('id', updatedItem.id);
        
      if (error) throw new Error(`Error updating service type: ${error.message}`);
      
      // Update state
      setServiceTypes(
        serviceTypes.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
      
      setSuccess("Service type updated successfully!");
      handleCloseEditModal();
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error updating service type:", err);
      setError(err.message || "Failed to update service type");
    }
  };
  
  const handleUpdateGeneralService = async (updatedItem: any) => {
    setError("");
    setSuccess("");
    
    try {
      const { error } = await supabase
        .from('general_services')
        .update({
          name: updatedItem.name,
          description: updatedItem.description || null,
          icon: updatedItem.icon || null
        })
        .eq('id', updatedItem.id);
        
      if (error) throw new Error(`Error updating general service: ${error.message}`);
      
      // Update state
      setGeneralServices(
        generalServices.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
      
      setSuccess("General service updated successfully!");
      handleCloseEditModal();
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error updating general service:", err);
      setError(err.message || "Failed to update general service");
    }
  };
  
  const handleUpdateServiceCategory = async (updatedItem: any) => {
    setError("");
    setSuccess("");
    
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({
          name: updatedItem.name,
          service_type_id: updatedItem.service_type_id || null,
          description: updatedItem.description || null,
          is_subcategory: updatedItem.is_subcategory,
          parent_category_id: updatedItem.is_subcategory ? updatedItem.parent_category_id : null
        })
        .eq('id', updatedItem.id);
        
      if (error) throw new Error(`Error updating service category: ${error.message}`);
      
      // Refresh the updated category with relationships
      const { data: updatedCategory, error: fetchError } = await supabase
        .from('service_categories')
        .select(`
          *,
          service_types:service_type_id (name),
          parent_category:parent_category_id (name)
        `)
        .eq('id', updatedItem.id)
        .single();
        
      if (fetchError) throw new Error(`Error fetching updated category: ${fetchError.message}`);
      
      // Update state with the refreshed data
      setServiceCategories(
        serviceCategories.map(item => item.id === updatedItem.id ? updatedCategory : item)
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
  
  const handleUpdateSpecificService = async (updatedItem: any) => {
    setError("");
    setSuccess("");
    
    try {
      const { error } = await supabase
        .from('specific_services')
        .update({
          name: updatedItem.name,
          category_id: updatedItem.category_id || null,
          description: updatedItem.description || null,
          is_active: updatedItem.is_active
        })
        .eq('id', updatedItem.id);
        
      if (error) throw new Error(`Error updating specific service: ${error.message}`);
      
      // Refresh the updated service with relationships
      const { data: updatedService, error: fetchError } = await supabase
        .from('specific_services')
        .select(`
          *,
          service_categories:category_id (name, service_type_id, service_types:service_type_id(name))
        `)
        .eq('id', updatedItem.id)
        .single();
        
      if (fetchError) throw new Error(`Error fetching updated service: ${fetchError.message}`);
      
      // Update state with the refreshed data
      setSpecificServices(
        specificServices.map(item => item.id === updatedItem.id ? updatedService : item)
      );
      
      setSuccess("Specific service updated successfully!");
      handleCloseEditModal();
      
      // Refresh the data
      router.refresh();
      
    } catch (err: any) {
      console.error("Error updating specific service:", err);
      setError(err.message || "Failed to update specific service");
    }
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
            onClick={() => setActiveTab("types")}
            className={`py-2 px-3 font-medium ${
              activeTab === "types"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Service Types
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-3 font-medium ${
              activeTab === "general"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            General Services
          </button>
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
            onClick={() => setActiveTab("specific")}
            className={`py-2 px-3 font-medium ${
              activeTab === "specific"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Specific Services
          </button>
        </nav>
      </div>
      
      {/* Service Types Tab Content */}
      {!loading && activeTab === "types" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Service Types</h2>
          <p className="text-gray-600">These are the main categories of services such as Restaurant, Bar, Cafe, etc.</p>
          
          {/* Add New Service Type Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New Service Type</h3>
            <form onSubmit={handleAddServiceType} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newServiceType.name}
                    onChange={(e) => setNewServiceType({...newServiceType, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newServiceType.description}
                    onChange={(e) => setNewServiceType({...newServiceType, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                  <input
                    type="text"
                    value={newServiceType.icon}
                    onChange={(e) => setNewServiceType({...newServiceType, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Service Type
              </button>
            </form>
          </div>
          
          {/* Service Types Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.icon ? <img src={type.icon} alt={type.name} className="h-6 w-6" /> : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(type.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal('type', type)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('service_types', type.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {serviceTypes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No service types found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* General Services Tab Content */}
      {!loading && activeTab === "general" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">General Services</h2>
          <p className="text-gray-600">These are common services that can apply to multiple service types, such as Delivery, Takeaway, etc.</p>
          
          {/* Add New General Service Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New General Service</h3>
            <form onSubmit={handleAddGeneralService} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newGeneralService.name}
                    onChange={(e) => setNewGeneralService({...newGeneralService, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newGeneralService.description}
                    onChange={(e) => setNewGeneralService({...newGeneralService, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                  <input
                    type="text"
                    value={newGeneralService.icon}
                    onChange={(e) => setNewGeneralService({...newGeneralService, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add General Service
              </button>
            </form>
          </div>
          
          {/* General Services Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generalServices.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.icon ? <img src={service.icon} alt={service.name} className="h-6 w-6" /> : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal('general', service)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('general_services', service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {generalServices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No general services found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Service Categories Tab Content */}
      {!loading && activeTab === "categories" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Service Categories</h2>
          <p className="text-gray-600">Categories specific to each service type, such as "Local Dishes" for restaurants.</p>
          
          {/* Add New Service Category Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New Service Category</h3>
            <form onSubmit={handleAddServiceCategory} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    value={newServiceCategory.service_type_id}
                    onChange={(e) => setNewServiceCategory({...newServiceCategory, service_type_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a Service Type</option>
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
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
                <div className="flex flex-col">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="is_subcategory"
                      checked={newServiceCategory.is_subcategory}
                      onChange={(e) => setNewServiceCategory({...newServiceCategory, is_subcategory: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_subcategory" className="ml-2 block text-sm text-gray-900">
                      Is Subcategory
                    </label>
                  </div>
                  {newServiceCategory.is_subcategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                      <select
                        value={newServiceCategory.parent_category_id || ""}
                        onChange={(e) => setNewServiceCategory({
                          ...newServiceCategory, 
                          parent_category_id: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required={newServiceCategory.is_subcategory}
                      >
                        <option value="">Select a Parent Category</option>
                        {serviceCategories
                          .filter(cat => !cat.is_subcategory && cat.service_type_id === parseInt(newServiceCategory.service_type_id))
                          .map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is Subcategory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.service_types ? category.service_types.name : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.is_subcategory ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.parent_category ? category.parent_category.name : "-"}
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
                {serviceCategories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No service categories found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Specific Services Tab Content */}
      {!loading && activeTab === "specific" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Specific Services</h2>
          <p className="text-gray-600">Individual services that belong to specific categories, such as "Jollof Rice" in the "Local Dishes" category.</p>
          
          {/* Add New Specific Service Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add New Specific Service</h3>
            <form onSubmit={handleAddSpecificService} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newSpecificService.name}
                    onChange={(e) => setNewSpecificService({...newSpecificService, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newSpecificService.category_id}
                    onChange={(e) => setNewSpecificService({...newSpecificService, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a Category</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} {category.service_types ? `(${category.service_types.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newSpecificService.description}
                    onChange={(e) => setNewSpecificService({...newSpecificService, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newSpecificService.is_active}
                    onChange={(e) => setNewSpecificService({...newSpecificService, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Is Active
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Specific Service
              </button>
            </form>
          </div>
          
          {/* Specific Services Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {specificServices.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.service_categories ? service.service_categories.name : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.service_categories?.service_types?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal('specific', service)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('specific_services', service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {specificServices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No specific services found. Add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    {editModalType === 'type' && 'Edit Service Type'}
                    {editModalType === 'general' && 'Edit General Service'}
                    {editModalType === 'category' && 'Edit Service Category'}
                    {editModalType === 'specific' && 'Edit Specific Service'}
                  </h3>
                  
                  <div className="mt-4">
                    {/* Edit Service Type Form */}
                    {editModalType === 'type' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateServiceType(selectedItem);
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                            <input
                              type="text"
                              value={selectedItem.icon || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, icon: e.target.value})}
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
                    
                    {/* Edit General Service Form */}
                    {editModalType === 'general' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateGeneralService(selectedItem);
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                            <input
                              type="text"
                              value={selectedItem.icon || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, icon: e.target.value})}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <select
                              value={selectedItem.service_type_id || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, service_type_id: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select a Service Type</option>
                              {serviceTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
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
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="edit_is_subcategory"
                              checked={selectedItem.is_subcategory}
                              onChange={(e) => setSelectedItem({...selectedItem, is_subcategory: e.target.checked})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="edit_is_subcategory" className="ml-2 block text-sm text-gray-900">
                              Is Subcategory
                            </label>
                          </div>
                          {selectedItem.is_subcategory && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                              <select
                                value={selectedItem.parent_category_id || ""}
                                onChange={(e) => setSelectedItem({
                                  ...selectedItem, 
                                  parent_category_id: e.target.value ? parseInt(e.target.value) : null
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required={selectedItem.is_subcategory}
                              >
                                <option value="">Select a Parent Category</option>
                                {serviceCategories
                                  .filter(cat => !cat.is_subcategory && cat.service_type_id === parseInt(selectedItem.service_type_id) && cat.id !== selectedItem.id)
                                  .map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                  ))
                                }
                              </select>
                            </div>
                          )}
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
                    
                    {/* Edit Specific Service Form */}
                    {editModalType === 'specific' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateSpecificService(selectedItem);
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={selectedItem.category_id || ""}
                              onChange={(e) => setSelectedItem({...selectedItem, category_id: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select a Category</option>
                              {serviceCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name} {category.service_types ? `(${category.service_types.name})` : ""}
                                </option>
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
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="edit_is_active"
                              checked={selectedItem.is_active}
                              onChange={(e) => setSelectedItem({...selectedItem, is_active: e.target.checked})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-900">
                              Is Active
                            </label>
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