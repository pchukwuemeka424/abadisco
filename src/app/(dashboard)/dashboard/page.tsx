"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/supabaseClient";

interface Stats {
  totalProducts: number;
  totalViews: number;
  totalUploads: number;
  kycStatus: string;
  kycProgress: number;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalViews: 0,
    totalUploads: 0,
    kycStatus: "Pending",
    kycProgress: 33
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      // Fetch KYC status
      const { data: kycData } = await supabase
        .from("kyc_verifications")
        .select("status")
        .eq("user_id", user?.id)
        .single();

      // Calculate KYC progress
      let kycProgress = 33; // Default progress (started)
      if (kycData?.status === "verified") {
        kycProgress = 100;
      } else if (kycData?.status === "pending") {
        kycProgress = 66;
      }

      // Fetch recent activity
      const { data: recentProducts } = await supabase
        .from("products")
        .select("created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalProducts: productsCount || 0,
        totalViews: 0, // Will implement view tracking later
        totalUploads: recentProducts?.length || 0,
        kycStatus: kycData?.status || "Pending",
        kycProgress: kycProgress
      });

      // Format recent activity
      const activity = (recentProducts || []).map(product => ({
        type: "product_upload",
        timestamp: product.created_at,
      }));

      setRecentActivity(activity);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            All systems normal
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              New
            </span>
            <span className="text-gray-500">this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Profile Views</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-rose-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
              Coming soon
            </span>
            <span className="text-gray-500">Analytics feature</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">⬆️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUploads}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Active
            </span>
            <span className="text-gray-500">uploads today</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-sm p-6 text-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium text-rose-100">KYC Status</p>
              <p className="text-2xl font-bold">{stats.kycStatus}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500" 
                style={{ width: `${stats.kycProgress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2 text-rose-100">{stats.kycProgress}% completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/profile" 
            className="group bg-white hover:bg-rose-50 rounded-xl p-6 border border-gray-200 flex flex-col items-center transition-all hover:border-rose-200 hover:shadow-sm"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">👤</span>
            <span className="font-medium text-gray-800">Complete Profile</span>
            <span className="text-sm text-gray-500 mt-1">Update your business info</span>
          </Link>

          <Link 
            href="/dashboard/manage-products" 
            className="group bg-white hover:bg-rose-50 rounded-xl p-6 border border-gray-200 flex flex-col items-center transition-all hover:border-rose-200 hover:shadow-sm"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</span>
            <span className="font-medium text-gray-800">Manage Products</span>
            <span className="text-sm text-gray-500 mt-1">View and edit listings</span>
          </Link>

          <Link 
            href="/dashboard/upload-products" 
            className="group bg-white hover:bg-rose-50 rounded-xl p-6 border border-gray-200 flex flex-col items-center transition-all hover:border-rose-200 hover:shadow-sm"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">⬆️</span>
            <span className="font-medium text-gray-800">Upload Products</span>
            <span className="text-sm text-gray-500 mt-1">Add new products</span>
          </Link>

          <Link 
            href="/dashboard/kyc" 
            className="group bg-white hover:bg-rose-50 rounded-xl p-6 border border-gray-200 flex flex-col items-center transition-all hover:border-rose-200 hover:shadow-sm"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span>
            <span className="font-medium text-gray-800">KYC Verification</span>
            <span className="text-sm text-gray-500 mt-1">Verify your business</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No recent activity to show
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {activity.type === 'product_upload' && 'New product uploaded'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}