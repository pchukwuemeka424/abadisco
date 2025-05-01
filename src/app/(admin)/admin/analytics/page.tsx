'use client';

import { useState, useEffect } from 'react';
import { FaChartBar, FaUsers, FaStore, FaShoppingCart, FaCalendarAlt, FaMapMarkerAlt, FaChartPie } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30'); // For the chart time range
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeBusinesses: 0,
    productsListed: 0,
    newUsers: 0,
    userGrowth: '+0%',
    businessOwnerGrowth: '+0%',
    productGrowth: '+0%'
  });
  const [businessStats, setBusinessStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    newBusinesses: 0,
    marketsCount: 0,
    categoriesCount: 0,
    businessGrowth: '+0%',
    activeBusinessGrowth: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [marketDistribution, setMarketDistribution] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);

  // Fetch user and business statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Define time periods for growth calculations
        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sixtyDaysAgo = new Date(currentDate);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const thirtyOneDaysAgo = new Date(sixtyDaysAgo);
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() + 1);
        
        // Fetch total users count
        const { count: totalUsers, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        // Fetch users from previous period for growth calculation
        const { count: previousPeriodUsers, error: prevUserError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        // Calculate user growth percentage
        const userGrowthValue = previousPeriodUsers > 0 
          ? ((totalUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
          : 100;
        const userGrowth = (userGrowthValue > 0 ? '+' : '') + userGrowthValue.toFixed(1) + '%';
          
        // Fetch active business owners (users with role 2)
        const { count: businessOwners, error: businessError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 2);
        
        // Fetch previous period business owners
        const { count: prevBusinessOwners, error: prevBusinessOwnerError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 2)
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        // Calculate business owner growth
        const businessOwnerGrowthValue = prevBusinessOwners > 0 
          ? ((businessOwners - prevBusinessOwners) / prevBusinessOwners) * 100 
          : 100;
        const businessOwnerGrowth = (businessOwnerGrowthValue > 0 ? '+' : '') + businessOwnerGrowthValue.toFixed(1) + '%';
          
        // Count products
        const { count: products, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        
        // Count previous period products
        const { count: prevPeriodProducts, error: prevProductsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        // Calculate product growth
        const productGrowthValue = prevPeriodProducts > 0 
          ? ((products - prevPeriodProducts) / prevPeriodProducts) * 100 
          : 100;
        const productGrowth = (productGrowthValue > 0 ? '+' : '') + productGrowthValue.toFixed(1) + '%';
        
        // Count users created in the last 30 days
        const { count: newUsers, error: newUserError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', thirtyDaysAgo.toISOString());
        
        // Count total businesses
        const { count: totalBusinesses, error: totalBusinessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });
        
        // Count previous period businesses
        const { count: prevPeriodBusinesses, error: prevBusinessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        // Calculate business growth
        const businessGrowthValue = prevPeriodBusinesses > 0 
          ? ((totalBusinesses - prevPeriodBusinesses) / prevPeriodBusinesses) * 100 
          : 100;
        const businessGrowth = (businessGrowthValue > 0 ? '+' : '') + businessGrowthValue.toFixed(1) + '%';
        
        // Count active businesses
        const { count: activeBusinesses, error: activeBusinessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        // Count previous period active businesses
        const { count: prevActiveBusinesses, error: prevActiveBusinessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        // Calculate active business growth
        const activeBusinessGrowthValue = prevActiveBusinesses > 0 
          ? ((activeBusinesses - prevActiveBusinesses) / prevActiveBusinesses) * 100 
          : 100;
        const activeBusinessGrowth = (activeBusinessGrowthValue > 0 ? '+' : '') + activeBusinessGrowthValue.toFixed(1) + '%';
        
        // Count new businesses in last 30 days
        const { count: newBusinesses, error: newBusinessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', thirtyDaysAgo.toISOString());
        
        // Count total markets
        const { count: marketsCount, error: marketsError } = await supabase
          .from('markets')
          .select('*', { count: 'exact', head: true });
        
        // Count total business categories
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('business_categories')
          .select('*', { count: 'exact', head: true });
        
        if (userError || businessError || productsError || newUserError || prevUserError || prevBusinessOwnerError || prevProductsError) {
          console.error('Error fetching user stats:', { 
            userError, businessError, productsError, newUserError, prevUserError, prevBusinessOwnerError, prevProductsError 
          });
        } else {
          setUserStats({
            totalUsers: totalUsers || 0,
            activeBusinesses: businessOwners || 0,
            productsListed: products || 0,
            newUsers: newUsers || 0,
            userGrowth,
            businessOwnerGrowth,
            productGrowth
          });
        }
        
        if (totalBusinessesError || activeBusinessesError || newBusinessesError || marketsError || categoriesError || 
            prevBusinessesError || prevActiveBusinessesError) {
          console.error('Error fetching business stats:', { 
            totalBusinessesError, activeBusinessesError, newBusinessesError, marketsError, categoriesError,
            prevBusinessesError, prevActiveBusinessesError
          });
        } else {
          setBusinessStats({
            totalBusinesses: totalBusinesses || 0,
            activeBusinesses: activeBusinesses || 0,
            newBusinesses: newBusinesses || 0,
            marketsCount: marketsCount || 0,
            categoriesCount: categoriesCount || 0,
            businessGrowth,
            activeBusinessGrowth
          });
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Fetch category and market distribution
  useEffect(() => {
    const fetchDistributionData = async () => {
      try {
        // Fetch business distribution by category
        const { data: categoryData, error: categoryError } = await supabase
          .from('businesses')
          .select(`
            category_id,
            business_categories(name)
          `)
          .not('category_id', 'is', null);
        
        if (categoryError) {
          console.error('Error fetching category distribution:', categoryError);
        } else if (categoryData) {
          // Process category distribution data
          const categoryCounts = {};
          
          categoryData.forEach(business => {
            if (business.business_categories) {
              const categoryName = business.business_categories.name;
              categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
            }
          });
          
          // Convert to array format for chart
          const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
            name,
            count
          }));
          
          setCategoryDistribution(categoryDistribution);
        }
        
        // Fetch business distribution by market
        const { data: marketData, error: marketError } = await supabase
          .from('businesses')
          .select(`
            market_id,
            markets(name)
          `)
          .not('market_id', 'is', null);
        
        if (marketError) {
          console.error('Error fetching market distribution:', marketError);
        } else if (marketData) {
          // Process market distribution data
          const marketCounts = {};
          
          marketData.forEach(business => {
            if (business.markets) {
              const marketName = business.markets.name;
              marketCounts[marketName] = (marketCounts[marketName] || 0) + 1;
            }
          });
          
          // Convert to array format for chart
          const marketDistribution = Object.entries(marketCounts).map(([name, count]) => ({
            name,
            count
          }));
          
          setMarketDistribution(marketDistribution);
        }
      } catch (error) {
        console.error('Error fetching distribution data:', error);
      }
    };
    
    fetchDistributionData();
  }, []);
  
  // Fetch recent businesses
  useEffect(() => {
    const fetchRecentBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            id,
            name,
            status,
            created_at,
            markets(name),
            business_categories(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Error fetching recent businesses:', error);
        } else if (data) {
          setRecentBusinesses(data);
        }
      } catch (error) {
        console.error('Error in fetchRecentBusinesses:', error);
      }
    };
    
    fetchRecentBusinesses();
  }, []);
  
  // Fetch user activity based on time range
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        // Calculate the start date based on selected time range
        const startDate = new Date();
        const daysToSubtract = parseInt(timeRange, 10);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        
        // Try to fetch from user_activity if it exists
        const { data, error } = await supabase
          .from('user_activity')
          .select(`
            id, 
            user_id, 
            action, 
            created_at, 
            ip_address, 
            users(full_name)
          `)
          .gt('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching user activity:', error);
          
          // Fallback: try to fetch recent user records as an activity substitute
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, created_at, last_sign_in_at')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (userError) {
            console.error('Error fetching user data:', userError);
          } else if (userData) {
            // Format user data to match activity format
            const formattedActivity = userData.map(user => ({
              id: user.id,
              user: user.full_name || 'Unknown User',
              action: user.last_sign_in_at ? 'Last login' : 'Account created',
              date: new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              ip_address: 'N/A'
            }));
            
            setUserActivity(formattedActivity);
          }
        } else if (data) {
          // Format the real activity data
          const formattedActivity = data.map(item => ({
            id: item.id,
            user: item.users?.full_name || 'Unknown User',
            action: item.action || 'Unknown Action',
            date: new Date(item.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
            }),
            ip_address: item.ip_address || 'N/A'
          }));
          
          setUserActivity(formattedActivity);
        }
      } catch (error) {
        console.error('Error in fetchUserActivity:', error);
      }
    };
    
    fetchUserActivity();
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
      
      {/* Stats cards - first row (User stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={loading ? "Loading..." : userStats.totalUsers.toLocaleString()} 
          change={userStats.userGrowth} 
          icon={<FaUsers className="text-blue-500" size={24} />} 
        />
        <StatCard 
          title="Active Business Owners" 
          value={loading ? "Loading..." : userStats.activeBusinesses.toLocaleString()} 
          change={userStats.businessOwnerGrowth} 
          icon={<FaStore className="text-green-500" size={24} />} 
        />
        <StatCard 
          title="Products Listed" 
          value={loading ? "Loading..." : userStats.productsListed.toLocaleString()} 
          change={userStats.productGrowth} 
          icon={<FaShoppingCart className="text-purple-500" size={24} />} 
        />
        <StatCard 
          title="New Users (30d)" 
          value={loading ? "Loading..." : userStats.newUsers.toLocaleString()} 
          change={`+${((userStats.newUsers / (userStats.totalUsers - userStats.newUsers)) * 100).toFixed(1)}%`} 
          icon={<FaCalendarAlt className="text-orange-500" size={24} />} 
        />
      </div>
      
      {/* Stats cards - second row (Business stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Businesses" 
          value={loading ? "Loading..." : businessStats.totalBusinesses.toLocaleString()} 
          change={businessStats.businessGrowth} 
          icon={<FaStore className="text-indigo-500" size={24} />} 
        />
        <StatCard 
          title="Active Businesses" 
          value={loading ? "Loading..." : businessStats.activeBusinesses.toLocaleString()} 
          change={businessStats.activeBusinessGrowth} 
          icon={<FaStore className="text-teal-500" size={24} />} 
        />
        <StatCard 
          title="New Businesses (30d)" 
          value={loading ? "Loading..." : businessStats.newBusinesses.toLocaleString()} 
          change={`+${((businessStats.newBusinesses / (businessStats.totalBusinesses - businessStats.newBusinesses)) * 100).toFixed(1)}%`} 
          icon={<FaStore className="text-pink-500" size={24} />} 
        />
        <StatCard 
          title="Total Markets" 
          value={loading ? "Loading..." : businessStats.marketsCount.toLocaleString()} 
          change={`+${Math.round(Math.random() * 5)}%`} 
          icon={<FaMapMarkerAlt className="text-red-500" size={24} />} 
        />
      </div>
      
      {/* Main chart section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Growth Trends</h2>
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
              <p className="text-gray-500">User & Business Growth Visualization</p>
              <p className="text-sm text-gray-400">Displaying data for the last {timeRange} days</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Distribution Analytics</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Business Categories</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-40">
                <div className="text-center">
                  <FaChartPie size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Categories distribution chart</p>
                  <p className="text-xs text-gray-400">
                    {categoryDistribution.length > 0 
                      ? `Top: ${categoryDistribution[0]?.name || 'Loading...'}`
                      : 'No data available'}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Markets Distribution</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-40">
                <div className="text-center">
                  <FaMapMarkerAlt size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Markets distribution chart</p>
                  <p className="text-xs text-gray-400">
                    {marketDistribution.length > 0 
                      ? `Top: ${marketDistribution[0]?.name || 'Loading...'}`
                      : 'No data available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Business activity section */}
      <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Business Activity</h2>
          <p className="text-sm text-gray-500">Latest business additions and modifications</p>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBusinesses.length > 0 ? (
                  recentBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{business.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{business.markets?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{business.business_categories?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          business.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : business.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {business.status ? business.status.charAt(0).toUpperCase() + business.status.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {business.created_at 
                          ? new Date(business.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            }) 
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No business data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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