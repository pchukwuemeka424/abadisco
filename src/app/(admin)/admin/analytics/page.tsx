'use client';

import { useState, useEffect } from 'react';
import { FaChartBar, FaUsers, FaStore, FaShoppingCart, FaCalendarAlt } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30'); // For the chart time range
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeBusinesses: 0,
    productsListed: 0,
    newUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState([]);

  // Fetch user statistics from the users table
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        
        // Fetch total users count
        const { count: totalUsers, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        // Fetch active business owners (users with role 2)
        const { count: businessOwners, error: businessError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 2);
          
        // Count products
        const { count: products, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        
        // Get current date and 30 days ago for new users count
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Count users created in the last 30 days
        const { count: newUsers, error: newUserError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', thirtyDaysAgo.toISOString());
        
        if (userError || businessError || productsError || newUserError) {
          console.error('Error fetching stats:', { userError, businessError, productsError, newUserError });
        } else {
          setUserStats({
            totalUsers: totalUsers || 0,
            activeBusinesses: businessOwners || 0,
            productsListed: products || 0,
            newUsers: newUsers || 0
          });
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, []);
  
  // Fetch user activity based on time range
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        // Calculate the start date based on selected time range
        const startDate = new Date();
        const daysToSubtract = parseInt(timeRange, 10);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        
        // Fetch recent user activities
        const { data, error } = await supabase
          .from('user_activity')
          .select('id, user_id, action, created_at, ip_address, users(full_name)')
          .gt('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching user activity:', error);
        } else if (data) {
          setUserActivity(data);
        }
      } catch (error) {
        console.error('Error in fetchUserActivity:', error);
      }
    };
    
    // If there's a user_activity table, fetch data
    // This is a mock since we don't know if the table exists
    // fetchUserActivity();
    
    // Mock activity data for demonstration
    const mockActivity = [
      { id: 1, user: 'John Doe', action: 'Profile update', date: 'April 26, 2025', ip_address: '192.168.1.10' },
      { id: 2, user: 'Jane Smith', action: 'Product added', date: 'April 25, 2025', ip_address: '192.168.1.20' },
      { id: 3, user: 'Robert Johnson', action: 'Profile update', date: 'April 24, 2025', ip_address: '192.168.1.30' },
      { id: 4, user: 'Emily Davis', action: 'Product added', date: 'April 23, 2025', ip_address: '192.168.1.40' },
      { id: 5, user: 'Michael Wilson', action: 'Login', date: 'April 22, 2025', ip_address: '192.168.1.50' },
    ];
    
    setUserActivity(mockActivity);
  }, [timeRange]);

  // Handle time range change for charts
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  return (
    <div>
      {/* Header with page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform statistics and user engagement metrics</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={loading ? "Loading..." : userStats.totalUsers.toLocaleString()} 
          change="+12%" 
          icon={<FaUsers className="text-blue-500" size={24} />} 
        />
        <StatCard 
          title="Active Businesses" 
          value={loading ? "Loading..." : userStats.activeBusinesses.toLocaleString()} 
          change="+5%" 
          icon={<FaStore className="text-green-500" size={24} />} 
        />
        <StatCard 
          title="Products Listed" 
          value={loading ? "Loading..." : userStats.productsListed.toLocaleString()} 
          change="+18%" 
          icon={<FaShoppingCart className="text-purple-500" size={24} />} 
        />
        <StatCard 
          title="New Users (30d)" 
          value={loading ? "Loading..." : userStats.newUsers.toLocaleString()} 
          change="+8%" 
          icon={<FaCalendarAlt className="text-orange-500" size={24} />} 
        />
      </div>
      
      {/* Main chart section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Growth Trend</h2>
            <select 
              className="border rounded-lg px-3 py-1"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-80">
            <div className="text-center">
              <FaChartBar size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chart visualization would appear here</p>
              <p className="text-sm text-gray-400">Displaying data for the last {timeRange} days</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">User Demographics</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">User Types</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-gray-500">Pie chart would appear here</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Markets Distribution</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-gray-500">Pie chart would appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User activity section */}
      <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent User Activity</h2>
          <p className="text-sm text-gray-500">Latest actions from users across the platform</p>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{activity.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{activity.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{activity.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{activity.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({ title, value, change, icon }) {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold mt-2 mb-1">{value}</p>
          <span className={`inline-flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
            <span className="ml-1">{isPositive ? '↑' : '↓'}</span>
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}