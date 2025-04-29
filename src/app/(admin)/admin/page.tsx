'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaUsers, FaBox, FaIdCard, FaChartLine, FaTags, FaCog,
  FaExclamationTriangle, FaGlobe, FaComment, FaShoppingBag,
  FaCalendarAlt, FaBusinessTime, FaBell, FaEye, FaStore
} from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import MarketStats from './components/MarketStats';

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, color, percentChange }: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  percentChange?: number;
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${color} transition-all duration-300 hover:shadow-md`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {percentChange !== undefined && (
              <p className={`text-xs mt-2 ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}% since last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-600')}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ title, description, icon, href, color }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  href: string;
  color: string;
}) => {
  return (
    <Link href={href} className={`block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border-t-4 ${color} transition-all duration-300`}>
      <div className="p-5">
        <div className="flex items-center mb-3">
          <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-600')}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold ml-3">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  );
};

// Recent activity type
interface RecentActivity {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
  severity?: string;
}

interface DashboardStats {
  usersCount: number;
  productsCount: number;
  pendingKycCount: number;
  marketsCount: number;
  categoriesCount: number;
  businessesCount: number;
  recentActivities: RecentActivity[];
  hasErrors: boolean;
  usersTrend: number;
  productsTrend: number;
  kycTrend: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    usersCount: 0,
    productsCount: 0,
    pendingKycCount: 0,
    marketsCount: 0,
    categoriesCount: 0,
    businessesCount: 0,
    recentActivities: [],
    hasErrors: false,
    usersTrend: 0,
    productsTrend: 0,
    kycTrend: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // Get total products count
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        
        // Get pending KYC count
        const { count: pendingKycCount, error: kycError } = await supabase
          .from('kyc_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        // Get total markets count
        const { data: markets, error: marketsError } = await supabase
          .from('markets')
          .select('*');

        // Get total business categories count
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('business_categories')
          .select('*', { count: 'exact', head: true });
          
        // Get total businesses count
        const { count: businessesCount, error: businessesError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });
        
        // Get recent activities
        const { data: recentActivities, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // Format activities for display
        const formattedActivities = recentActivities?.map((activity: any) => ({
          id: activity.id,
          action_type: activity.action_type,
          description: activity.description,
          created_at: new Date(activity.created_at).toLocaleString(),
          user_id: activity.user_id,
          severity: activity.severity || 'info'
        })) || [];

        // Calculate growth trends (mock data - you can replace with actual calculations)
        const usersTrend = 12.5;
        const productsTrend = 18.3;
        const kycTrend = -7.2;
        
        setStats({
          usersCount: usersCount || 0,
          productsCount: productsCount || 0,
          pendingKycCount: pendingKycCount || 0,
          marketsCount: markets?.length || 0,
          categoriesCount: categoriesCount || 0,
          businessesCount: businessesCount || 0,
          recentActivities: formattedActivities,
          hasErrors: !!(usersError || productsError || kycError || marketsError || 
                      categoriesError || businessesError || activitiesError),
          usersTrend,
          productsTrend,
          kycTrend
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats(prev => ({ ...prev, hasErrors: true }));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  // Format the numbers for display
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  return (
    <div className="pb-8">
      {/* Header with greeting */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening across your marketplace.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
              <FaCalendarAlt className="mr-1" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        {stats.hasErrors && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Some data could not be fetched. Displaying available information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Registered Users"
              value={formatNumber(stats.usersCount)}
              subtitle="Total user accounts"
              icon={<FaUsers size={20} />}
              color="border-blue-600"
              percentChange={stats.usersTrend}
            />
            
            <StatsCard 
              title="Active Products"
              value={formatNumber(stats.productsCount)}
              subtitle="Listed marketplace items"
              icon={<FaBox size={20} />}
              color="border-green-600"
              percentChange={stats.productsTrend}
            />
            
            <StatsCard 
              title="Pending KYC"
              value={formatNumber(stats.pendingKycCount)}
              subtitle="Awaiting verification"
              icon={<FaIdCard size={20} />}
              color="border-yellow-600"
              percentChange={stats.kycTrend}
            />
            
            <StatsCard 
              title="Active Markets"
              value={formatNumber(stats.marketsCount)}
              subtitle="Commercial hub locations"
              icon={<FaStore size={20} />}
              color="border-purple-600"
            />

            <StatsCard 
              title="Business Categories"
              value={formatNumber(stats.categoriesCount)}
              subtitle="Classification types"
              icon={<FaTags size={20} />}
              color="border-indigo-600"
            />

            <StatsCard 
              title="Registered Businesses"
              value={formatNumber(stats.businessesCount)}
              subtitle="Verified enterprises"
              icon={<FaBusinessTime size={20} />}
              color="border-pink-600"
            />
          </div>
          
          {/* Market Statistics */}
          <MarketStats />
          
          {/* Quick actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ActionCard
                title="Manage Users"
                description="View and manage user accounts and profiles"
                icon={<FaUsers size={20} />}
                href="/admin/users"
                color="border-blue-600"
              />
              
              <ActionCard
                title="Product Management"
                description="Review, update, and manage products"
                icon={<FaBox size={20} />}
                href="/admin/products"
                color="border-green-600"
              />
              
              <ActionCard
                title="KYC Verification"
                description="Process pending verification requests"
                icon={<FaIdCard size={20} />}
                href="/admin/kyc"
                color="border-yellow-600"
              />
              
              <ActionCard
                title="Market Management"
                description="Manage markets and market data"
                icon={<FaStore size={20} />}
                href="/admin/markets"
                color="border-purple-600"
              />
              
              <ActionCard
                title="Category Management"
                description="Manage business categories and tags"
                icon={<FaTags size={20} />}
                href="/admin/categories"
                color="border-indigo-600"
              />
              
              <ActionCard
                title="Market Analytics"
                description="View performance metrics and reports"
                icon={<FaChartLine size={20} />}
                href="/admin/analytics"
                color="border-purple-600"
              />
              
              <ActionCard
                title="Agent Management"
                description="Manage field agents and activities"
                icon={<FaBusinessTime size={20} />}
                href="/admin/agents"
                color="border-pink-600"
              />
              
              <ActionCard
                title="System Settings"
                description="Configure system settings and preferences"
                icon={<FaCog size={20} />}
                href="/admin/settings"
                color="border-gray-600"
              />

              <ActionCard
                title="Activity Logs"
                description="Review system and user activities"
                icon={<FaEye size={20} />}
                href="/admin/activity"
                color="border-red-600"
              />
            </div>
          </div>
          
          {/* Recent activity and notifications section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent activity */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                <Link href="/admin/activity" className="text-blue-600 text-xs font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity: RecentActivity) => (
                    <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className={`p-2 rounded-full mr-3 ${
                        activity.severity === 'high' ? 'bg-red-100 text-red-600' : 
                        activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <FaComment size={16} />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-800 font-medium">{activity.action_type}</p>
                          {activity.severity === 'high' && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.created_at}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-4">No recent activity to display.</p>
                )}
              </div>
            </div>
            
            {/* System notifications */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">System Notifications</h2>
                <button className="text-blue-600 text-xs font-medium hover:underline">
                  Mark all as read
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start pb-4 border-b border-gray-100">
                  <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mr-3">
                    <FaBell size={16} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-gray-800 font-medium">Database backup in progress</p>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Maintenance
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Scheduled maintenance: expected completion in 15 minutes</p>
                    <p className="text-xs text-gray-400 mt-1">Today at 14:30</p>
                  </div>
                </div>
                
                <div className="flex items-start pb-4 border-b border-gray-100">
                  <div className="bg-green-100 p-2 rounded-full text-green-600 mr-3">
                    <FaCog size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">New system update available</p>
                    <p className="text-xs text-gray-500 mt-1">Version 2.4.0 ready to install</p>
                    <p className="text-xs text-gray-400 mt-1">Yesterday at 09:15</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-full text-red-600 mr-3">
                    <FaExclamationTriangle size={16} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-gray-800 font-medium">Storage capacity alert</p>
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                        Critical
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Storage usage at 85%, please archive old data</p>
                    <p className="text-xs text-gray-400 mt-1">April 28, 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}