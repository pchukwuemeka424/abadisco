'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  FiSearch, FiFilter, FiDownload, FiEye, FiEdit, FiTrash2,
  FiMapPin, FiTag, FiCalendar, FiUsers, FiTrendingUp
} from 'react-icons/fi';

// Types
interface Business {
  id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo_url: string;
  status: string;
  category: string;
  services: string;
  market: string;
  rating: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  agent_user_id: string;
  business_name: string;
  business_type: string;
  registration_number: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  custom_services: string[];
  full_name: string;
  image: string;
  role: string;
  last_sign_in_at: string;
}

interface BusinessStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BusinessStats>({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    address: '',
    status: 'active',
    facebook: '',
    instagram: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Fetch businesses data
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test if businesses table is accessible first
      let isTableAccessible = false;
      try {
        const testResponse = await supabase
          .from('businesses')
          .select('count')
          .limit(1);
        
        isTableAccessible = !testResponse.error;
      } catch (testError) {
        console.log('Table access test failed:', testError);
        isTableAccessible = false;
      }

      if (!isTableAccessible) {
        console.log('Businesses table is not accessible');
        setError('Businesses table is not accessible. Please check database configuration.');
        setBusinesses([]);
        calculateStats([]);
        return;
      }

      // Fetch real businesses data from businesses table
      let data = null;
      let error = null;

      try {
        const response = await supabase
          .from('businesses')
          .select(`
            id,
            name,
            description,
            market_id,
            category_id,
            owner_id,
            contact_phone,
            contact_email,
            address,
            logo_url,
            website,
            facebook,
            instagram,
            created_by,
            status,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });
        
        data = response.data;
        error = response.error;
      } catch (fetchError) {
        console.log('Direct business fetch failed, trying alternative approach:', fetchError);
        // Try simpler query
        try {
          const simpleResponse = await supabase
            .from('businesses')
            .select('id, name, contact_email, contact_phone, created_at')
            .limit(10);
          
          data = simpleResponse.data;
          error = simpleResponse.error;
        } catch (altError) {
          console.log('Alternative business fetch also failed:', altError);
          error = altError;
        }
      }

      if (error) {
        console.error('Error fetching businesses:', error.message || error);
        setError(`Failed to load businesses data: ${error.message || 'Unknown error'}`);
        setBusinesses([]);
        calculateStats([]);
        return;
      }

      // Transform the data to match our Business interface
      const transformedBusinesses: Business[] = (data || []).map(item => ({
        id: item.id,
        name: item.name || 'Unnamed Business',
        business_name: item.name || 'Unnamed Business',
        description: item.description || 'No description available',
        phone: item.contact_phone || 'No phone available',
        email: item.contact_email || 'No email available',
        website: item.website || '',
        address: item.address || 'No address available',
        logo_url: item.logo_url || '',
        status: item.status || 'active',
        category: 'General', // Will be fetched separately if needed
        services: 'General Services', // Will be fetched separately if needed
        market: 'Unknown Market', // Will be fetched separately if needed
        rating: '0', // Not in businesses table
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        created_by: item.created_by || 'Unknown',
        agent_user_id: item.created_by || 'Unknown', // Using created_by as agent_user_id
        business_type: 'retail', // Not in businesses table
        registration_number: 'N/A', // Not in businesses table
        facebook: item.facebook || '',
        instagram: item.instagram || '',
        whatsapp: '', // Not in businesses table
        custom_services: [], // Not in businesses table
        full_name: 'Business Owner', // Will be fetched from users table if needed
        image: '', // Not in businesses table
        role: 'business_owner',
        last_sign_in_at: '' // Not in businesses table
      }));

      setBusinesses(transformedBusinesses);
      calculateStats(transformedBusinesses);
    } catch (err) {
      console.error('Error in fetchBusinesses:', err);
      setError('System error occurred while fetching businesses data.');
      setBusinesses([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (businessesData: Business[]) => {
    const stats = {
      total: businessesData.length,
      active: businessesData.filter(b => b.status === 'active').length,
      pending: businessesData.filter(b => b.status === 'pending').length,
      inactive: businessesData.filter(b => b.status === 'inactive').length
    };
    setStats(stats);
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || business.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories for filter
  const categories = Array.from(new Set(businesses.map(b => b.category).filter(Boolean)));

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle business actions
  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (businessId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) {
        console.error('Error updating business status:', error);
        alert('Failed to update business status');
        return;
      }

      // Update local state
      setBusinesses(prev => prev.map(business => 
        business.id === businessId 
          ? { ...business, status: newStatus }
          : business
      ));

      alert('Business status updated successfully');
    } catch (err) {
      console.error('Error in handleUpdateStatus:', err);
      alert('Failed to update business status');
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        console.error('Error deleting business:', error);
        alert('Failed to delete business');
        return;
      }

      // Update local state
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
      alert('Business deleted successfully');
    } catch (err) {
      console.error('Error in handleDeleteBusiness:', err);
      alert('Failed to delete business');
    }
  };

  // Edit business functions
  const handleEditBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setEditForm({
      name: business.name,
      description: business.description,
      contact_phone: business.phone,
      contact_email: business.email,
      website: business.website,
      address: business.address,
      status: business.status,
      facebook: business.facebook,
      instagram: business.instagram
    });
    setShowEditModal(true);
  };

  const handleUpdateBusiness = async () => {
    if (!selectedBusiness) return;

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: editForm.name,
          description: editForm.description,
          contact_phone: editForm.contact_phone,
          contact_email: editForm.contact_email,
          website: editForm.website,
          address: editForm.address,
          status: editForm.status,
          facebook: editForm.facebook,
          instagram: editForm.instagram,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBusiness.id);

      if (error) {
        console.error('Error updating business:', error);
        alert('Failed to update business');
        return;
      }

      // Update local state
      setBusinesses(prev => prev.map(business => 
        business.id === selectedBusiness.id 
          ? {
              ...business,
              name: editForm.name,
              business_name: editForm.name,
              description: editForm.description,
              phone: editForm.contact_phone,
              email: editForm.contact_email,
              website: editForm.website,
              address: editForm.address,
              status: editForm.status,
              facebook: editForm.facebook,
              instagram: editForm.instagram,
              updated_at: new Date().toISOString()
            }
          : business
      ));

      setShowEditModal(false);
      setSelectedBusiness(null);
      alert('Business updated successfully');
    } catch (err) {
      console.error('Error in handleUpdateBusiness:', err);
      alert('Failed to update business');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedBusiness(null);
    setEditForm({
      name: '',
      description: '',
      contact_phone: '',
      contact_email: '',
      website: '',
      address: '',
      status: 'active',
      facebook: '',
      instagram: ''
    });
  };

  // Stats cards component
  const StatsCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registered Businesses</h1>
            <p className="mt-2 text-gray-600">Manage and monitor all registered businesses</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FiDownload className="mr-2 h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Businesses"
            value={stats.total}
            icon={FiUsers}
            color="bg-blue-500"
            change="+12%"
          />
          <StatsCard
            title="Active Businesses"
            value={stats.active}
            icon={FiTrendingUp}
            color="bg-green-500"
            change="+8%"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            icon={FiCalendar}
            color="bg-yellow-500"
            change="+3%"
          />
          <StatsCard
            title="Inactive"
            value={stats.inactive}
            icon={FiTag}
            color="bg-red-500"
            change="-2%"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Businesses</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Businesses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBusinesses.length > 0 ? (
                  paginatedBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {business.logo_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={business.logo_url}
                                alt={business.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {business.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={business.description}>
                              {business.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{business.email}</div>
                        <div className="text-sm text-gray-500">{business.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {business.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                          {business.market || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          business.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : business.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(business.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(business)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditBusiness(business)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                            title="Edit Business"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <select
                            value={business.status}
                            onChange={(e) => handleUpdateStatus(business.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            title="Update Status"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <button
                            onClick={() => handleDeleteBusiness(business.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Delete Business"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {filteredBusinesses.length === 0 && businesses.length > 0
                        ? 'No businesses match your search criteria'
                        : 'No businesses found'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredBusinesses.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredBusinesses.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Details Modal */}
        {showDetailsModal && selectedBusiness && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            ></div>
            
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
                <div className="px-6 pt-6 pb-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                        {selectedBusiness.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedBusiness.name}</h3>
                        <p className="text-gray-600">{selectedBusiness.category}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h4>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.business_name || selectedBusiness.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Description</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.description || 'No description provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.registration_number || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Business Type</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.business_type || 'Not specified'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.address || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Market</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.market || 'Not specified'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.email || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.phone || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Website</dt>
                          <dd className="text-sm text-gray-900">
                            {selectedBusiness.website ? (
                              <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedBusiness.website}
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">WhatsApp</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.whatsapp || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Facebook</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.facebook || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Instagram</dt>
                          <dd className="text-sm text-gray-900">{selectedBusiness.instagram || 'Not provided'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Services */}
                  {selectedBusiness.custom_services && selectedBusiness.custom_services.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBusiness.custom_services.map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status and Dates */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedBusiness.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : selectedBusiness.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedBusiness.status.charAt(0).toUpperCase() + selectedBusiness.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedBusiness.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rating</dt>
                      <dd className="text-sm text-gray-900">{selectedBusiness.rating || 'No rating'}</dd>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-3 rounded-b-xl flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditBusiness(selectedBusiness);
                    }}
                  >
                    Edit Business
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Business Modal */}
        {showEditModal && selectedBusiness && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Business</h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleUpdateBusiness(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.contact_phone}
                        onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Social Media */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={editForm.facebook}
                        onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Business'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
