'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaChartBar, FaUsers, FaStore, FaMapMarkerAlt, FaTags } from 'react-icons/fa';

// Define interfaces for our analytics data
interface MonthlyData {
  month: string;
  count: number;
}

interface MarketData {
  market: string;
  count: number; // Supabase returns count as a number (BIGINT)
}

interface CategoryData {
  category: string;
  count: number; // Supabase returns count as a number (BIGINT)
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
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalUsers: 0,
    usersByMonth: [],
    usersByMarket: [],
    usersByCategory: [],
    businessConversionRate: 0,
    totalBusinesses: 0
  });

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
        return;
      }
      
      const agentId = user?.id;
      
      if (!agentId) {
        console.error('No agent ID found in authenticated user');
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
      
      for (let i = 5; i >= 0; i--) {
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
        
        // Fetch all businesses with category data - Fixed query to use the correct relationship and field names
        const { data: businessesWithCategory, error: categoryError } = await supabase
          .from('businesses')
          .select('category_id, business_categories(title)')
          .eq('created_by', agentId)
          .not('category_id', 'is', null);
        
        if (categoryError) {
          console.error('Error fetching businesses with category:', categoryError.message);
          throw categoryError;
        }
        
        // Group category data in JavaScript - Updated to use the correct field name (title instead of name)
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
      } catch (innerError) {
        console.error('Inner error with market/category queries:', innerError);
        
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Analytics</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Users Registered</p>
                  <h3 className="text-2xl font-bold">{analytics.totalUsers}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <FaStore className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Businesses</p>
                  <h3 className="text-2xl font-bold">{analytics.totalBusinesses}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <FaChartBar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Conversion Rate</p>
                  <h3 className="text-2xl font-bold">{analytics.businessConversionRate}%</h3>
                </div>
              </div>
            </div>
          </div>
          
          {/* Monthly Registration Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold mb-4">Monthly Registration Trend</h2>
            <div className="h-64">
              <div className="flex h-full items-end">
                {analytics.usersByMonth.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full flex justify-center mb-2">
                      <div 
                        className="bg-blue-600 rounded-t-md w-4/5" 
                        style={{ 
                          height: `${Math.max((item.count / (Math.max(...analytics.usersByMonth.map(i => i.count), 1))) * 200, 20)}px` 
                        }}
                      ></div>
                      <div className="absolute -top-6 text-sm font-medium">{item.count}</div>
                    </div>
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {item.month}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Market & Category Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Market Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <FaMapMarkerAlt className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold">Registrations by Market</h2>
              </div>
              
              {analytics.usersByMarket.length > 0 ? (
                <div className="space-y-4">
                  {analytics.usersByMarket.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.market}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${(item.count / analytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No market data available</p>
              )}
            </div>
            
            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-2 rounded-full mr-3">
                  <FaTags className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold">Registrations by Category</h2>
              </div>
              
              {analytics.usersByCategory.length > 0 ? (
                <div className="space-y-4">
                  {analytics.usersByCategory.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.category}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full"
                          style={{ width: `${(item.count / analytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No category data available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}