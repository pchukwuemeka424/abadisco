'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaShoppingBag, FaStoreAlt, FaMapMarkedAlt, FaUserTie, FaCalendarAlt } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface MarketStat {
  id: string;
  name: string;
  businesses_count: number;
  products_count: number;
  active: boolean;
  location: string;
}

interface MarketStatsSummary {
  totalMarkets: number;
  activeMarkets: number;
  totalBusinesses: number;
  recentlyAddedMarket: {
    name: string;
    date: string;
  } | null;
  topMarket: {
    name: string;
    businessCount: number;
  } | null;
  marketsByLocation: {
    location: string;
    count: number;
  }[];
  marketsByBusinessCount: {
    name: string;
    count: number;
  }[];
}

export default function MarketStats() {
  const [stats, setStats] = useState<MarketStatsSummary>({
    totalMarkets: 0,
    activeMarkets: 0,
    totalBusinesses: 0,
    recentlyAddedMarket: null,
    topMarket: null,
    marketsByLocation: [],
    marketsByBusinessCount: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarketStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Get all markets with business counts
        const { data: markets, error: marketsError } = await supabase
          .from('markets')
          .select(`
            id,
            name,
            location,
            is_active,
            created_at,
            businesses(count)
          `);
          
        if (marketsError) throw marketsError;
        
        // Get total product count
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
          
        if (productsError) throw productsError;
        
        // Process the data to calculate statistics
        const marketStats = markets?.map(market => ({
          id: market.id,
          name: market.name,
          businesses_count: market.businesses?.length || 0,
          products_count: 0, // We'll update this later if needed
          active: market.is_active,
          location: market.location || 'Unknown',
          created_at: market.created_at
        })) || [];
        
        // Calculate total businesses
        const totalBusinesses = marketStats.reduce((sum, market) => sum + market.businesses_count, 0);
        
        // Find the top market by business count
        const topMarket = marketStats.length > 0 
          ? marketStats.reduce((max, market) => 
              max.businesses_count > market.businesses_count ? max : market
            ) 
          : null;
        
        // Find most recently added market
        const recentlyAddedMarket = marketStats.length > 0 
          ? marketStats.reduce((newest, market) => 
              new Date(market.created_at) > new Date(newest.created_at) ? market : newest
            )
          : null;
        
        // Group markets by location
        const locationMap = new Map<string, number>();
        marketStats.forEach(market => {
          const location = market.location || 'Unknown';
          locationMap.set(location, (locationMap.get(location) || 0) + 1);
        });
        
        const marketsByLocation = Array.from(locationMap.entries()).map(([location, count]) => ({
          location,
          count
        }));
        
        // Get top 5 markets by business count
        const marketsByBusinessCount = [...marketStats]
          .sort((a, b) => b.businesses_count - a.businesses_count)
          .slice(0, 5)
          .map(market => ({
            name: market.name,
            count: market.businesses_count
          }));
          
        // Set the stats
        setStats({
          totalMarkets: marketStats.length,
          activeMarkets: marketStats.filter(m => m.active).length,
          totalBusinesses,
          recentlyAddedMarket: recentlyAddedMarket ? {
            name: recentlyAddedMarket.name,
            date: new Date(recentlyAddedMarket.created_at).toLocaleDateString()
          } : null,
          topMarket: topMarket ? {
            name: topMarket.name,
            businessCount: topMarket.businesses_count
          } : null,
          marketsByLocation,
          marketsByBusinessCount
        });
        
      } catch (err: any) {
        console.error('Error fetching market stats:', err);
        setError(err.message || 'Failed to fetch market statistics');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMarketStats();
  }, []);
  
  // Prepare chart data
  const locationChartData = {
    labels: stats.marketsByLocation.map(item => item.location),
    datasets: [
      {
        label: 'Markets by Location',
        data: stats.marketsByLocation.map(item => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const businessCountChartData = {
    labels: stats.marketsByBusinessCount.map(item => item.name),
    datasets: [
      {
        label: 'Number of Businesses',
        data: stats.marketsByBusinessCount.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h3 className="text-lg font-medium">Error loading market statistics</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Market Statistics</h2>
        <p className="text-sm text-gray-600 mt-1">Overview of market performance and distribution</p>
      </div>
      
      <div className="p-5">
        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <FaShoppingBag size={18} />
              </div>
              <div>
                <h3 className="text-sm text-gray-500 font-medium">Total Markets</h3>
                <p className="text-xl font-bold">{stats.totalMarkets}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <FaStoreAlt size={18} />
              </div>
              <div>
                <h3 className="text-sm text-gray-500 font-medium">Active Markets</h3>
                <p className="text-xl font-bold">{stats.activeMarkets}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalMarkets > 0 
                    ? `${Math.round((stats.activeMarkets / stats.totalMarkets) * 100)}% of all markets`
                    : 'No markets added yet'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <FaUserTie size={18} />
              </div>
              <div>
                <h3 className="text-sm text-gray-500 font-medium">Total Businesses</h3>
                <p className="text-xl font-bold">{stats.totalBusinesses}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalMarkets > 0 
                    ? `Avg ${Math.round(stats.totalBusinesses / stats.totalMarkets)} per market`
                    : 'No markets added yet'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <FaCalendarAlt size={18} />
              </div>
              <div>
                <h3 className="text-sm text-gray-500 font-medium">Recently Added</h3>
                <p className="text-lg font-bold truncate" style={{ maxWidth: '150px' }}>
                  {stats.recentlyAddedMarket?.name || 'None'}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.recentlyAddedMarket?.date || 'No recent additions'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium text-gray-700 mb-3">Markets by Location</h3>
            <div className="h-60">
              {stats.marketsByLocation.length > 0 ? (
                <Pie data={locationChartData} options={{ maintainAspectRatio: false }} />
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg">
                  <p className="text-gray-500">No location data available</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-medium text-gray-700 mb-3">Top Markets by Business Count</h3>
            <div className="h-60">
              {stats.marketsByBusinessCount.length > 0 ? (
                <Bar 
                  data={businessCountChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      }
                    }
                  }} 
                />
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg">
                  <p className="text-gray-500">No business data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}