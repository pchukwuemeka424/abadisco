'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaFilter, FaDownload, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import ActivityTable from '../../components/ActivityTable';
import ActivityFilterModal from '../../components/ActivityFilterModal';

// Define types for better type safety
interface ActivityUser {
  email: string;
  full_name: string;
  role: string;
}

interface Activity {
  id: string;
  created_at: string;
  action_type: string;
  description: string;
  ip_address?: string;
  user_type: string;
  users?: ActivityUser;
}

interface FilterOptions {
  actionType: string;
  userType: string;
  dateRange: string;
}

export default function AdminActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    actionType: 'all',
    userType: 'all',
    dateRange: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Check if activities table exists on component mount
  useEffect(() => {
    checkActivitiesTable();
  }, []);

  // Fetch activities when filters change (but only if table exists)
  useEffect(() => {
    if (!error) {
      fetchActivities();
    }
  }, [filterOptions, error, searchQuery]);

  const checkActivitiesTable = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if the activities table exists
      const { error: tableError } = await supabase
        .from('activities')
        .select('id')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01') { // Table doesn't exist error
          setError("The activities table doesn't exist in the database. Please run the SQL setup script first.");
        } else {
          setError(`Database error: ${tableError.message}`);
        }
        return;
      }
      
      // Table exists, fetch activities
      fetchActivities();
    } catch (err) {
      const error = err as Error;
      setError(`Failed to check activities table: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start building the query
      let query = supabase
        .from('activities')
        .select('*, users(email, full_name, role)');
      
      // Apply filters
      if (filterOptions.actionType !== 'all') {
        query = query.eq('action_type', filterOptions.actionType);
      }
      
      if (filterOptions.userType !== 'all') {
        query = query.eq('user_type', filterOptions.userType);
      }
      
      if (filterOptions.dateRange !== 'all') {
        const today = new Date();
        let startDate;
        
        switch (filterOptions.dateRange) {
          case 'today':
            startDate = new Date().setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date(today.setDate(today.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }
      
      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%,users.full_name.ilike.%${searchQuery}%`);
      }
      
      // Add final ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error: queryError } = await query;
      
      if (queryError) {
        // Check for specific errors
        if (queryError.code === '42P01') {
          throw new Error("Activities table doesn't exist. Please run the database setup script first.");
        } else if (queryError.code === '42703') {
          throw new Error("Column doesn't exist in the activities table. The table schema may need to be updated.");
        } else {
          throw new Error(queryError.message || JSON.stringify(queryError));
        }
      }
      
      setActivities(data || []);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching activities:', error);
      setError(`Failed to fetch activities: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilterOptions: FilterOptions) => {
    setFilterOptions(newFilterOptions);
    setShowFilterModal(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivities();
  };

  const handleExportCSV = () => {
    if (!activities.length) return;
    
    // Format activities for CSV
    const csvContent = [
      // Header
      ['ID', 'Date', 'User', 'Email', 'Action', 'Details', 'IP Address'],
      
      // Data rows
      ...activities.map(activity => [
        activity.id,
        new Date(activity.created_at).toLocaleString(),
        activity.users?.full_name || 'N/A',
        activity.users?.email || 'N/A',
        activity.action_type,
        activity.description,
        activity.ip_address || 'N/A'
      ])
    ]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admin-activity-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Activity Log</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            disabled={!!error}
          >
            <FaFilter className="mr-2" />
            Filter
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
            disabled={!activities.length || !!error}
          >
            <FaDownload className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Activities
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">
                  <button
                    onClick={() => {
                      setError(null);
                      checkActivitiesTable();
                    }}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by user, action, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <FaClock />
            <span>Showing most recent activities first</span>
          </div>
          
          <ActivityTable activities={activities} loading={loading} />
        </div>
      )}
      
      {showFilterModal && (
        <ActivityFilterModal
          currentFilters={filterOptions}
          onApply={handleFilterChange}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}