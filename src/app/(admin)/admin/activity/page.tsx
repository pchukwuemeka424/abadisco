"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import ActivityTable from '../../components/ActivityTable';
import ActivityFilterModal from '../../components/ActivityFilterModal';
import { FaFilter, FaSearch } from 'react-icons/fa';

// Create proper type for activity
interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  // Add other fields as needed
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const checkActivitiesTable = async () => {
    try {
      // Check if activities table exists
      // ...existing code...
    } catch (error) {
      console.error('Error checking activities table:', error);
    }
  };

  useEffect(() => {
    checkActivitiesTable();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Fetch activities
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);
  
  // Filter activities based on type and search term
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType ? activity.activity_type === filterType : true;
    const matchesSearch = searchTerm 
      ? activity.description.toLowerCase().includes(searchTerm.toLowerCase()) 
      : true;
    return matchesType && matchesSearch;
  });

  const handleFilter = (type: string) => {
    setFilterType(type);
    setShowFilterModal(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearFilter = () => {
    setFilterType('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg"
          >
            <FaFilter className="mr-2" />
            {filterType ? `Filter: ${filterType}` : 'Filter'}
            {filterType && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFilter();
                }}
                className="ml-2 text-sm text-red-500"
              >
                ×
              </button>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading activities...</div>
      ) : filteredActivities.length > 0 ? (
        <ActivityTable activities={filteredActivities} />
      ) : (
        <div className="text-center py-10 text-gray-500">
          No activities found.
        </div>
      )}

      {showFilterModal && (
        <ActivityFilterModal
          onClose={() => setShowFilterModal(false)}
          onFilter={handleFilter}
          currentFilter={filterType}
        />
      )}
    </div>
  );
}