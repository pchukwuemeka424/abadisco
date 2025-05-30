'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaChartBar, FaUsers, FaStore, FaMapMarkerAlt, FaTags, FaChartLine, FaPercentage, FaArrowUp, FaArrowDown, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

// Define interfaces for our analytics data
interface MonthlyData {
  month: string;
  count: number;
}

interface MarketData {
  market: string;
  count: number; 
}

interface CategoryData {
  category: string;
  count: number;
}

interface AnalyticsState {
  totalUsers: number;
  usersByMonth: MonthlyData[];
  usersByMarket: MarketData[];
  usersByCategory: CategoryData[];
  businessConversionRate: number;
  totalBusinesses: number;
}

export default function AgentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalUsers: 0,
    usersByMonth: [],
    usersByMarket: [],
    usersByCategory: [],
    businessConversionRate: 0,
    totalBusinesses: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '3m' | '6m'>('6m');
  const [activeTab, setActiveTab] = useState<'overview' | 'markets' | 'categories'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  async function fetchAnalyticsData() {
    try {
      setLoading(true);
      
      // Get agent ID from the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        setError('Authentication error. Please sign in again.');
        return;
      }
      
      const agentId = user?.id;
      
      if (!agentId) {
        console.error('No agent ID found in authenticated user');
        setError('Unable to identify your agent profile. Please sign in again.');
        return;
      }
      
      console.log('Fetching data for agent ID:', agentId);
      
      // Fetch total registrations by this agent
      const { data: totalRegistrations, error: totalError } = await supabase
        .from('businesses')
        .select('id', { count: 'exact' })
        .eq('created_by', agentId);
      
      if (totalError) {
        console.error('Error fetching total registrations:', totalError);
        throw totalError;
      }
      
      // Fetch total completed businesses
      const { data: totalBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select('id', { count: 'exact' })
        .eq('created_by', agentId)
        .not('name', 'is', null);
      
      if (businessError) {
        console.error('Error fetching total businesses:', businessError);
        throw businessError;
      }
      
      // Calculate the business conversion rate
      const totalUsersCount = totalRegistrations?.length || 0;
      const totalBusinessesCount = totalBusinesses?.length || 0;
      const businessConversionRate = totalUsersCount > 0 
        ? (totalBusinessesCount / totalUsersCount * 100).toFixed(1) 
        : "0";
      
      // Get registrations by month for the last 6 months
      const monthlyData: MonthlyData[] = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(now.getMonth() - i);
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
        
        const { data: monthRegistrations, error: monthError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());
        
        if (monthError) {
          console.error('Error fetching monthly data:', monthError);
          throw monthError;
        }
        
        const monthName = monthStart.toLocaleString('default', { month: 'short' });
        monthlyData.push({
          month: `${monthName} ${monthStart.getFullYear()}`,
          count: monthRegistrations?.length || 0
        });
      }
      
      // Use a different approach for market and category data
      try {
        // Fetch all businesses with market data
        const { data: businessesWithMarket, error: marketError } = await supabase
          .from('businesses')
          .select('market_id, markets(name)')
          .eq('created_by', agentId)
          .not('market_id', 'is', null);
        
        if (marketError) {
          console.error('Error fetching businesses with market:', marketError);
          throw marketError;
        }
        
        // Group market data in JavaScript
        const marketCounts: Record<string, number> = {};
        businessesWithMarket?.forEach(business => {
          if (business.markets && business.markets.name) {
            const marketName = business.markets.name;
            marketCounts[marketName] = (marketCounts[marketName] || 0) + 1;
          }
        });
        
        const marketData: MarketData[] = Object.entries(marketCounts).map(([market, count]) => ({
          market,
          count
        })).sort((a, b) => b.count - a.count);
        
        // Fetch all businesses with category data
        const { data: businessesWithCategory, error: categoryError } = await supabase
          .from('businesses')
          .select('category_id, business_categories(title)')
          .eq('created_by', agentId)
          .not('category_id', 'is', null);
        
        if (categoryError) {
          console.error('Error fetching businesses with category:', categoryError.message);
          throw categoryError;
        }
        
        // Group category data in JavaScript - Updated to use the correct field name
        const categoryCounts: Record<string, number> = {};
        businessesWithCategory?.forEach(business => {
          if (business.business_categories && business.business_categories.title) {
            const categoryName = business.business_categories.title;
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
          }
        });
        
        const categoryData: CategoryData[] = Object.entries(categoryCounts).map(([category, count]) => ({
          category,
          count
        })).sort((a, b) => b.count - a.count);
        
        setAnalytics({
          totalUsers: totalUsersCount,
          usersByMonth: monthlyData,
          usersByMarket: marketData || [],
          usersByCategory: categoryData || [],
          businessConversionRate: parseFloat(businessConversionRate),
          totalBusinesses: totalBusinessesCount
        });
      } catch (innerError: any) {
        console.error('Inner error with market/category queries:', innerError);
        setError(`Error loading market or category data: ${innerError.message || 'Unknown error'}`);
        
        // Fallback to a simplified approach if the queries fail
        setAnalytics({
          totalUsers: totalUsersCount,
          usersByMonth: monthlyData,
          usersByMarket: [],
          usersByCategory: [],
          businessConversionRate: parseFloat(businessConversionRate),
          totalBusinesses: totalBusinessesCount
        });
      }
      
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      console.error('Error details:', JSON.stringify(error));
      setError(`Failed to load analytics data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  // Filter data based on selected timeframe
  const getFilteredMonthlyData = () => {
    if (selectedTimeframe === 'all') {
      return analytics.usersByMonth;
    } else {
      const monthsToShow = selectedTimeframe === '3m' ? 3 : 6;
      return analytics.usersByMonth.slice(-monthsToShow);
    }
  };

  const filteredMonthlyData = getFilteredMonthlyData();

  // Calculate trend: is the current month better than the previous one?
  const calculateTrend = () => {
    const data = analytics.usersByMonth;
    if (data.length < 2) return { change: 0, isPositive: false };
    
    const currentMonth = data[data.length - 1].count;
    const previousMonth = data[data.length - 2].count;
    
    if (previousMonth === 0) return { change: 100, isPositive: true };
    
    const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;
    return {
      change: Math.abs(Math.round(percentChange)),
      isPositive: percentChange >= 0
    };
  };

  const trend = calculateTrend();

  // Helper function to get colors for charts
  const getMarketChartColors = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-red-500', 'bg-orange-500',
      'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
      'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-sky-500'
    ];
    return colors[index % colors.length];
  };

  // Calculate the market with highest registrations
  const topMarket = analytics.usersByMarket.length > 0 ? analytics.usersByMarket[0].market : 'None';
  
  // Calculate the category with highest registrations
  const topCategory = analytics.usersByCategory.length > 0 ? analytics.usersByCategory[0].category : 'None';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM36 0V4h-2V0h-4v2h4v4h2V0h4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V0H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
            <div className="px-8 py-10 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="bg-white rounded-full p-3 mr-5 shadow-md">
                    <FaChartBar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                    <p className="text-blue-100 mt-1">Track your registration metrics and performance</p>
                  </div>
                </div>
                <div className="flex items-center bg-white bg-opacity-20 rounded-lg overflow-hidden">
                  <button 
                    className={`px-4 py-2 text-sm font-medium ${selectedTimeframe === '3m' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-10'}`}
                    onClick={() => setSelectedTimeframe('3m')}
                  >
                    3 Months
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium ${selectedTimeframe === '6m' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-10'}`}
                    onClick={() => setSelectedTimeframe('6m')}
                  >
                    6 Months
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium ${selectedTimeframe === 'all' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-10'}`}
                    onClick={() => setSelectedTimeframe('all')}
                  >
                    All Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-700">Loading analytics data...</p>
              <p className="text-sm text-gray-500">Please wait while we compile your statistics</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaExclamationCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchAnalyticsData();
              }} 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Registrations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 flex items-center border-b border-gray-100">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4">
                    <FaUsers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Registrations</h3>
                    <p className="text-sm text-gray-500">All time</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</div>
                    <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                      {trend.change}% {trend.isPositive ? 'more' : 'less'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 flex items-center border-b border-gray-100">
                  <div className="bg-purple-50 p-3 rounded-lg mr-4">
                    <FaPercentage className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
                    <p className="text-sm text-gray-500">Registration to business</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-3xl font-bold text-gray-900">{analytics.businessConversionRate}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(analytics.businessConversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Top Market */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 flex items-center border-b border-gray-100">
                  <div className="bg-green-50 p-3 rounded-lg mr-4">
                    <FaMapMarkerAlt className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Top Market</h3>
                    <p className="text-sm text-gray-500">Highest registrations</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-xl font-bold text-gray-900 truncate" title={topMarket}>
                    {topMarket}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {analytics.usersByMarket[0]?.count || 0} registrations
                  </div>
                </div>
              </div>

              {/* Top Category */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 flex items-center border-b border-gray-100">
                  <div className="bg-amber-50 p-3 rounded-lg mr-4">
                    <FaTags className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Top Category</h3>
                    <p className="text-sm text-gray-500">Highest registrations</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-xl font-bold text-gray-900 truncate" title={topCategory}>
                    {topCategory}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {analytics.usersByCategory[0]?.count || 0} registrations
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-md ${activeTab === 'overview' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('markets')}
                    className={`py-4 px-1 border-b-2 font-medium text-md ${activeTab === 'markets' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Markets
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`py-4 px-1 border-b-2 font-medium text-md ${activeTab === 'categories' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Categories
                  </button>
                </nav>
              </div>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Monthly Registration Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                  <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Monthly Registration Trend</h3>
                      <p className="text-sm text-gray-500">Registrations over time</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <FaChartLine className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="h-80">
                      {filteredMonthlyData.length > 0 ? (
                        <div className="flex h-full items-end space-x-2">
                          {filteredMonthlyData.map((item, index) => {
                            const maxValue = Math.max(...filteredMonthlyData.map(i => i.count), 1);
                            const height = Math.max((item.count / maxValue) * 250, 4);
                            const isCurrentMonth = index === filteredMonthlyData.length - 1;
                            
                            return (
                              <div key={index} className="flex flex-col items-center group relative flex-1">
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none">
                                  {item.count} registrations
                                </div>
                                <div 
                                  className={`w-full ${isCurrentMonth ? 'bg-blue-600' : 'bg-blue-400'} rounded-t ${item.count === 0 ? 'h-1' : ''}`}
                                  style={{ height: `${height}px` }}
                                ></div>
                                <div className="w-full text-center mt-2">
                                  <div className={`text-xs ${isCurrentMonth ? 'font-bold text-blue-800' : 'text-gray-600'}`}>
                                    {item.month.split(" ")[0]}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No data available for the selected timeframe</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Markets Tab Content */}
            {activeTab === 'markets' && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                  <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Registrations by Market</h3>
                      <p className="text-sm text-gray-500">Distribution across markets</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    {analytics.usersByMarket.length > 0 ? (
                      <div className="space-y-5">
                        {analytics.usersByMarket.slice(0, 10).map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{item.market}</span>
                              <span className="font-medium text-gray-900">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${getMarketChartColors(index)}`}
                                style={{ width: `${(item.count / analytics.totalUsers) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        
                        {analytics.usersByMarket.length > 10 && (
                          <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                              + {analytics.usersByMarket.length - 10} more markets
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-gray-500">No market data available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {analytics.usersByMarket.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">Market Distribution</h3>
                    </div>
                    <div className="p-6 flex justify-center">
                      <div className="max-w-lg w-full">
                        <div className="relative aspect-square">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1/2 h-1/2 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-sm font-medium text-gray-600">Total</div>
                                <div className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</div>
                              </div>
                            </div>
                          </div>
                          <svg viewBox="0 0 100 100" className="w-full transform -rotate-90">
                            {analytics.usersByMarket.length > 0 && analytics.usersByMarket.reduce((acc, market, index) => {
                              const total = analytics.totalUsers;
                              const percentage = (market.count / total) * 100;
                              const previousPercentage = acc;
                              
                              // Calculate the path for this segment
                              const x1 = 50 + 40 * Math.cos(2 * Math.PI * previousPercentage / 100);
                              const y1 = 50 + 40 * Math.sin(2 * Math.PI * previousPercentage / 100);
                              const x2 = 50 + 40 * Math.cos(2 * Math.PI * (previousPercentage + percentage) / 100);
                              const y2 = 50 + 40 * Math.sin(2 * Math.PI * (previousPercentage + percentage) / 100);
                              
                              const largeArcFlag = percentage > 50 ? 1 : 0;
                              
                              const pathData = [
                                `M ${50} ${50}`,
                                `L ${x1} ${y1}`,
                                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                'Z'
                              ].join(' ');
                              
                              const colors = [
                                '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                                '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
                                '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
                                '#06b6d4', '#0ea5e9', '#3b82f6'
                              ];
                              
                              return (
                                <>
                                  <path
                                    key={`path-${index}`}
                                    d={pathData}
                                    fill={colors[index % colors.length]}
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                  />
                                  {acc + percentage}
                                </>
                              );
                            }, 0)}
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Categories Tab Content */}
            {activeTab === 'categories' && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                  <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Registrations by Category</h3>
                      <p className="text-sm text-gray-500">Distribution across business categories</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <FaTags className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    {analytics.usersByCategory.length > 0 ? (
                      <div className="space-y-5">
                        {analytics.usersByCategory.slice(0, 10).map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700 truncate pr-2" title={item.category}>
                                {item.category}
                              </span>
                              <span className="font-medium text-gray-900">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full bg-amber-${500 - (index * 50 > 400 ? 400 : index * 50)}`}
                                style={{ width: `${(item.count / analytics.totalUsers) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        
                        {analytics.usersByCategory.length > 10 && (
                          <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                              + {analytics.usersByCategory.length - 10} more categories
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-gray-500">No category data available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Category Card Grid */}
                {analytics.usersByCategory.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analytics.usersByCategory.slice(0, 6).map((item, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className={`h-2 bg-amber-${500 - (index * 50 > 400 ? 400 : index * 50)}`}></div>
                        <div className="p-5">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={item.category}>
                            {item.category}
                          </h4>
                          <div className="flex justify-between items-center">
                            <div className="text-3xl font-bold text-gray-800">{item.count}</div>
                            <div className="text-sm text-gray-500">
                              {((item.count / analytics.totalUsers) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}