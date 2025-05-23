"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
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
    image_urls: string;
    created_at: string;
  }>;
  userData: {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    created_at: string;
    last_login?: string;
    role?: string;
  } | null;
  businessData: {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    address?: string;
    contact_phone?: string;
    contact_email?: string;
    status: string;
    created_at: string;
  } | null;
  error?: string; // Add error field to display error messages
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    pendingVerifications: 0,
    recentActivity: [],
    popularProducts: [],
    userData: null,
    businessData: null
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Fetching dashboard data for user:", user.id);
      
      // Fetch total products for this user
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id);
      
      if (productsError) {
        console.error("Error fetching products:", productsError.message, productsError.details);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      // Fetch pending KYC verifications
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (kycError) {
        console.error("Error fetching KYC verifications:", kycError.message, kycError.details);
        throw new Error(`Failed to fetch KYC verifications: ${kycError.message}`);
      }
      
      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (activityError) {
        console.error("Error fetching activity data:", activityError.message, activityError.details);
        throw new Error(`Failed to fetch activities: ${activityError.message}`);
      }
      
      // Fetch popular products (most viewed)
      const { data: popularProductsData, error: popularError } = await supabase
        .from('products')
        .select('id, image_urls, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Changed to order by creation date instead of views
        .limit(5);
      
      if (popularError) {
        console.error("Error fetching popular products:", popularError.message, popularError.details);
        throw new Error(`Failed to fetch popular products: ${popularError.message}`);
      }
      
      // Fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error("Error fetching user data:", userError.message, userError.details);
        throw new Error(`Failed to fetch user data: ${userError.message}`);
      }
      
      // Fetch business data from businesses table for this user
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle(); // Use maybeSingle() to handle case where user has no business
      
      if (businessError) {
        console.error("Error fetching business data:", businessError.message, businessError.details);
        throw new Error(`Failed to fetch business data: ${businessError.message}`);
      }
      
      console.log("Dashboard data fetched successfully");
      
      setDashboardData({
        totalProducts: productsData ? productsData.length : 0,
        pendingVerifications: kycData ? kycData.length : 0,
        recentActivity: activityData || [],
        popularProducts: popularProductsData || [],
        userData: userData || null,
        businessData: businessData || null
      });
      
    } catch (error) {
      // Enhanced error handling
      console.error('Error fetching dashboard data:', error);
      
      // Check if it's an instance of Error
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred. Please try refreshing the page.';
      
      // Update state with error message
      setDashboardData(prev => ({
        ...prev,
        error: errorMessage
      }));
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
    <div className="min-h-screen bg-gray-50">
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
                        <div className="flex items-center">
                          {product.image_urls && (
                            <div className="w-12 h-12 mr-3 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src={product.image_urls.split(',')[0]} 
                                alt="Product" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/logo.png'; // Fallback image
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">Product {product.id.substring(0, 8)}...</h3>
                            <p className="text-sm text-gray-500">Added {formatDate(product.created_at)}</p>
                          </div>
                        </div>
                        <Link href={`/dashboard/manage-products?id=${product.id}`} className="text-blue-500 text-sm hover:underline">
                          View
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-gray-500 text-center">No products found. Start adding some!</p>
                )}
              </div>
            </div>
            
            {/* User Profile Information */}
            {dashboardData.userData && (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">User Profile</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base">{dashboardData.userData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-base">{dashboardData.userData.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-base">{dashboardData.userData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Joined</p>
                      <p className="text-base">{formatDate(dashboardData.userData.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Login</p>
                      <p className="text-base">{dashboardData.userData.last_login ? formatDate(dashboardData.userData.last_login) : 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <p className="text-base">{dashboardData.userData.role || 'User'}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/profile" className="text-sm text-blue-500 hover:underline">
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Business Information */}
            {dashboardData.businessData ? (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Your Business</h2>
                </div>
                <div className="p-4">
                  <div className="flex items-start">
                    {dashboardData.businessData.logo_url && (
                      <div className="mr-4">
                        <img 
                          src={dashboardData.businessData.logo_url} 
                          alt="Business Logo" 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/images/logo.png'; // Fallback image
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{dashboardData.businessData.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{dashboardData.businessData.description || 'No description provided'}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-base">{dashboardData.businessData.address || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contact Phone</p>
                          <p className="text-base">{dashboardData.businessData.contact_phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contact Email</p>
                          <p className="text-base">{dashboardData.businessData.contact_email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dashboardData.businessData.status === 'active' ? 'bg-green-100 text-green-800' : 
                            dashboardData.businessData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {dashboardData.businessData.status.charAt(0).toUpperCase() + dashboardData.businessData.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link href="/dashboard/profile" className="text-sm text-blue-500 hover:underline">
                          Manage Business
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Business Profile</h2>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <FaStore className="mx-auto h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Business Registered</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't created a business profile yet. Create one to showcase your products and services.
                  </p>
                  <div className="mt-6">
                    <Link 
                      href="/dashboard/profile" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create Business Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {dashboardData.error && (
              <div className="bg-red-100 text-red-600 p-4 rounded-lg shadow mt-4">
                <p>Error: {dashboardData.error}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}