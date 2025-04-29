"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/context/auth-context';
import { FaStore, FaBox, FaChartLine, FaUsers } from 'react-icons/fa';
import Link from 'next/link';

// Define proper types
interface DashboardData {
  totalProducts: number;
  pendingVerifications: number;
  recentActivity: Array<{
    id: string;
    description: string;
    created_at: string;
    type: string;
  }>;
  popularProducts: Array<{
    id: string;
    name: string;
    views: number;
    price?: number;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    pendingVerifications: 0,
    recentActivity: [],
    popularProducts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch total products for this user
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id);
      
      if (productsError) throw productsError;
      
      // Fetch pending KYC verifications
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (kycError) throw kycError;
      
      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (activityError) throw activityError;
      
      // Fetch popular products (most viewed)
      const { data: popularProductsData, error: popularError } = await supabase
        .from('products')
        .select('id, name, views, price')
        .eq('user_id', user.id)
        .order('views', { ascending: false })
        .limit(5);
      
      if (popularError) throw popularError;
      
      setDashboardData({
        totalProducts: productsData ? productsData.length : 0,
        pendingVerifications: kycData ? kycData.length : 0,
        recentActivity: activityData || [],
        popularProducts: popularProductsData || []
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // Added user as dependency

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-grow p-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Products */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FaBox className="text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm">Total Products</h3>
                    <h2 className="font-bold text-xl">{dashboardData.totalProducts}</h2>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/manage-products" className="text-sm text-blue-500 hover:underline">
                    View all products
                  </Link>
                </div>
              </div>
              
              {/* KYC Status */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className={`p-3 ${dashboardData.pendingVerifications > 0 ? 'bg-yellow-100' : 'bg-green-100'} rounded-full`}>
                    <FaUsers className={dashboardData.pendingVerifications > 0 ? 'text-yellow-500' : 'text-green-500'} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm">KYC Verification</h3>
                    <h2 className="font-bold text-xl">
                      {dashboardData.pendingVerifications > 0 ? 'Pending' : 'Verified'}
                    </h2>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/kyc" className="text-sm text-blue-500 hover:underline">
                    {dashboardData.pendingVerifications > 0 ? 'Complete verification' : 'View status'}
                  </Link>
                </div>
              </div>
              
              {/* Add more stats cards here */}
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </div>
              <div className="p-2">
                {dashboardData.recentActivity.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {dashboardData.recentActivity.map((activity) => (
                      <li key={activity.id} className="py-3 px-4">
                        <div className="flex justify-between">
                          <span className="text-sm">{activity.description}</span>
                          <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-gray-500 text-center">No recent activity found.</p>
                )}
              </div>
            </div>
            
            {/* Popular Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Popular Products</h2>
              </div>
              <div className="p-2">
                {dashboardData.popularProducts.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {dashboardData.popularProducts.map((product) => (
                      <li key={product.id} className="py-3 px-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.views} views</p>
                        </div>
                        <div>
                          {product.price && (
                            <span className="font-medium text-green-600">₦{product.price.toLocaleString()}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-gray-500 text-center">No products found. Start adding some!</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}