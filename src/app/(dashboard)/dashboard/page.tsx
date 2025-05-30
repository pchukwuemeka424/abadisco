"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/auth-context';
import { 
  FaStore, 
  FaBox, 
  FaChartLine, 
  FaUsers, 
  FaEye, 
  FaRegClock,
  FaRegLightbulb,
  FaBell,
  FaArrowUp,
  FaChartPie,
  FaRegCalendarAlt,
  FaWrench,
  FaShoppingBag,
  FaExternalLinkAlt
} from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

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
      
      // Fetch total products for this user - FIXED: Using count query instead of retrieving all products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      if (productsError) {
        console.error("Error fetching products:", productsError.message, productsError.details);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      // Fetch pending KYC verifications
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('id, status') // Only select specific fields instead of all columns
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
        .eq('owner_id', user.id)
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
        totalProducts: productsCount || 0, // FIXED: Using the count returned from Supabase
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
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'upload':
        return <FaBox className="text-emerald-500" />;
      case 'view':
        return <FaEye className="text-blue-500" />;
      case 'kyc':
        return <FaUsers className="text-purple-500" />;
      default:
        return <FaRegClock className="text-gray-500" />;
    }
  };

  // Function to calculate completion percentage
  const calculateCompletion = () => {
    if (!dashboardData.userData) return 0;
    
    let completed = 0;
    let total = 5; // Total number of profile completeness checks
    
    // Check if user has business data
    if (dashboardData.businessData) completed++;
    // Check if user has name
    if (dashboardData.userData.full_name) completed++;
    // Check if user has email
    if (dashboardData.userData.email) completed++;
    // Check if user has phone
    if (dashboardData.userData.phone) completed++;
    // Check if KYC is verified
    if (dashboardData.pendingVerifications === 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1500px] mx-auto">
        {/* Header with user greeting and action buttons */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Welcome back, {dashboardData.userData?.full_name?.split(' ')[0] || 'Merchant'} 👋
              </h1>
              <p className="mt-2 text-slate-500 max-w-xl">
                Your business dashboard shows all key metrics and activities in one place. 
                Stay up-to-date with your products, sales, and customer interactions.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={fetchDashboardData} 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <FaRegCalendarAlt className="mr-2 h-4 w-4 text-indigo-500" />
                Refresh Data
              </button>
              
              <Link 
                href="/dashboard/upload-products" 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                <FaBox className="mr-2 h-4 w-4" />
                Add Product
              </Link>
              
              <Link 
                href="/dashboard/kyc" 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all"
              >
                <FaUsers className="mr-2 h-4 w-4" />
                KYC Verification
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 w-full">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-600 font-medium">Loading your dashboard data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Products */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all group hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Products</p>
                    <div className="mt-2 flex items-baseline">
                      <h3 className="text-3xl font-bold text-slate-800">{dashboardData.totalProducts}</h3>
                      <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <FaBox className="w-6 h-6 text-indigo-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Link href="/dashboard/manage-products" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center group-hover:underline">
                    View all products
                    <FaExternalLinkAlt className="ml-1.5 w-3 h-3" />
                  </Link>
                </div>
              </div>
              
              {/* Profile Completion */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all group hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Profile Completion</p>
                    <div className="mt-2 flex items-baseline">
                      <h3 className="text-3xl font-bold text-slate-800">{completionPercentage}%</h3>
                      {completionPercentage < 100 && (
                        <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Incomplete</span>
                      )}
                      {completionPercentage === 100 && (
                        <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Complete</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-violet-50 group-hover:bg-violet-100 transition-colors">
                    <FaChartPie className="w-6 h-6 text-violet-500" />
                  </div>
                </div>
                <div className="mt-3 w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-violet-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{width: `${completionPercentage}%`}}
                  ></div>
                </div>
                <div className="flex items-center">
                  <Link href="/dashboard/profile" className="text-sm font-medium text-violet-600 hover:text-violet-800 flex items-center group-hover:underline">
                    Complete your profile
                    <FaExternalLinkAlt className="ml-1.5 w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* KYC Status */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all group hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">KYC Verification</p>
                    <div className="mt-2 flex items-baseline">
                      <h3 className={`text-2xl font-bold ${dashboardData.pendingVerifications > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {dashboardData.pendingVerifications > 0 ? 'Pending' : 'Verified'}
                      </h3>
                      <span className={`ml-2 text-xs font-medium ${dashboardData.pendingVerifications > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-2 py-0.5 rounded-full`}>
                        {dashboardData.pendingVerifications > 0 ? 'Action needed' : 'Approved'}
                      </span>
                    </div>
                  </div>
                  <div className={`rounded-full p-3 ${dashboardData.pendingVerifications > 0 ? 'bg-amber-50 group-hover:bg-amber-100' : 'bg-emerald-50 group-hover:bg-emerald-100'} transition-colors`}>
                    <FaUsers className={`w-6 h-6 ${dashboardData.pendingVerifications > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Link href="/dashboard/kyc" className={`text-sm font-medium ${dashboardData.pendingVerifications > 0 ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'} flex items-center group-hover:underline`}>
                    {dashboardData.pendingVerifications > 0 ? 'Complete verification' : 'View status'}
                    <FaExternalLinkAlt className="ml-1.5 w-3 h-3" />
                  </Link>
                </div>
              </div>
              
              {/* Monthly Views */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all group hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Monthly Views</p>
                    <div className="mt-2 flex items-baseline">
                      <h3 className="text-3xl font-bold text-slate-800">0</h3>
                      <div className="ml-2 flex items-center text-xs font-medium text-emerald-600">
                        <FaArrowUp className="mr-1 h-3 w-3" />
                        <span>0%</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-cyan-50 group-hover:bg-cyan-100 transition-colors">
                    <FaEye className="w-6 h-6 text-cyan-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>0 views this month</span>
                    <span>Goal: 100</span>
                  </div>
                  <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-cyan-500 h-1.5 rounded-full w-0"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
                      <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">
                        Last 5 events
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1 overflow-hidden">
                    {dashboardData.recentActivity.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {dashboardData.recentActivity.map((activity) => (
                          <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                                {getActivityIcon(activity.type || 'default')}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                                <time className="text-xs text-slate-500 mt-1">{formatDate(activity.created_at)}</time>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                          <FaRegClock className="text-slate-400 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 mb-1">No Recent Activity</h3>
                        <p className="text-center text-slate-500 mb-6">
                          Your recent activities will appear here as you interact with the marketplace.
                        </p>
                        <Link href="/dashboard/upload-products"
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-200 transition-colors"
                        >
                          Add Your First Product
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Your Products */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-slate-800">Your Products</h2>
                      <Link href="/dashboard/upload-products" className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center">
                        <FaBox className="mr-1.5 h-3.5 w-3.5" />
                        Add New
                      </Link>
                    </div>
                  </div>
                  
                  {dashboardData.popularProducts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {dashboardData.popularProducts.map((product) => (
                        <div key={product.id} className="flex p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex-shrink-0 mr-4">
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                              {product.image_urls && (
                                <Image
                                  src={product.image_urls.split(',')[0]}
                                  alt="Product"
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/logo.png';
                                  }}
                                />
                              )}
                              {!product.image_urls && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaBox className="text-slate-400 w-6 h-6" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-medium text-slate-800">Product {product.id.substring(0, 8)}...</h3>
                              <p className="text-xs text-slate-500 mt-1">Added {formatDate(product.created_at)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link 
                                href={`/dashboard/manage-products?id=${product.id}`}
                                className="px-3 py-1 rounded-md text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Edit
                              </Link>
                              <Link 
                                href={`#`}
                                className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                        <FaShoppingBag className="text-indigo-400 w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-1">No Products Yet</h3>
                      <p className="text-center text-slate-500 mb-6">
                        Start adding products to your store to increase visibility and reach more customers.
                      </p>
                      <Link href="/dashboard/upload-products"
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Upload Your First Product
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* User and Business Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Profile Card */}
              {dashboardData.userData && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-1">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-slate-800">Your Profile</h2>
                      <Link href="/dashboard/profile" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">
                        Edit
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
                        <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-indigo-600">
                          {dashboardData.userData.full_name ? dashboardData.userData.full_name[0].toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-slate-800">{dashboardData.userData.full_name || 'Unnamed User'}</h3>
                        <p className="text-sm text-slate-500">{dashboardData.userData.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Email Address</p>
                          <p className="text-sm font-medium text-slate-800">{dashboardData.userData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Phone Number</p>
                          <p className="text-sm font-medium text-slate-800">{dashboardData.userData.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Role</p>
                          <p className="text-sm font-medium text-slate-800">{dashboardData.userData.role || 'User'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Member Since</p>
                          <p className="text-sm font-medium text-slate-800">{formatDate(dashboardData.userData.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Link href="/dashboard/profile" className="w-full mt-6 flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-800 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                      <FaWrench className="mr-2 h-4 w-4" />
                      Manage Your Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Business Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
                {dashboardData.businessData ? (
                  <>
                    <div className="p-6 border-b border-slate-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-800">Your Business</h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dashboardData.businessData.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                            dashboardData.businessData.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {dashboardData.businessData.status.charAt(0).toUpperCase() + dashboardData.businessData.status.slice(1)}
                          </span>
                        </div>
                        <Link href="/dashboard/profile#business" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">
                          Edit
                        </Link>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                            {dashboardData.businessData.logo_url ? (
                              <Image 
                                src={dashboardData.businessData.logo_url}
                                alt={dashboardData.businessData.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/logo.png';
                                }}
                              />
                            ) : (
                              <FaStore className="text-slate-400 w-12 h-12" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">{dashboardData.businessData.name}</h3>
                              <p className="text-slate-600 mt-2 text-sm max-w-xl">
                                {dashboardData.businessData.description || 'No description provided for this business yet.'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Business Address</p>
                                  <p className="text-sm font-medium text-slate-800">{dashboardData.businessData.address || 'Not provided'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Business Email</p>
                                  <p className="text-sm font-medium text-slate-800">{dashboardData.businessData.contact_email || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Contact Phone</p>
                                  <p className="text-sm font-medium text-slate-800">{dashboardData.businessData.contact_phone || 'Not provided'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Business Created</p>
                                  <p className="text-sm font-medium text-slate-800">{formatDate(dashboardData.businessData.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <Link href="/dashboard/profile" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                              Update Business Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                      <FaStore className="text-indigo-400 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Create Your Business</h3>
                    <p className="text-slate-600 text-center max-w-md mb-8">
                      Setting up your business profile increases your visibility in the marketplace and builds trust with potential customers.
                    </p>
                    <Link 
                      href="/dashboard/profile" 
                      className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Create Business Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Growth Insights Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <FaRegLightbulb className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2">Growth Insights</h2>
                      <p className="text-slate-600 max-w-2xl">
                        Our analysis shows that businesses with complete profiles and regular updates receive 5x more engagement. Here are some personalized recommendations to boost your visibility.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Upload professional photos</span> of your products to attract more customers
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Complete your KYC verification</span> to build trust with potential buyers
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Add detailed descriptions</span> to help customers find your products
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">4</span>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Update your inventory regularly</span> to stay relevant in search results
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <Link href="/dashboard/kyc" className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm">
                      <FaBell className="mr-2 h-4 w-4" />
                      Complete Your KYC
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {dashboardData.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                    <p className="mt-1 text-sm text-red-700">{dashboardData.error}</p>
                    <button 
                      onClick={fetchDashboardData}
                      className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}