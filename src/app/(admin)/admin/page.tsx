import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FaUsers, FaBox, FaIdCard, FaChartLine, FaTags, 
  FaExclamationTriangle, FaGlobe, FaComment 
} from 'react-icons/fa';
import { supabase } from '@/supabaseClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Aba Markets',
  description: 'Admin dashboard for managing Aba Markets platform',
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${color} transition-transform duration-300 hover:transform hover:scale-105`}>
      <div className="p-5 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-600')}`}>
          {icon}
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
    <Link href={href} className={`block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border-t-4 ${color} transition-all duration-300`}>
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
  type: string;
  description: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

async function getStatsData() {
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
    
    // Get recent activities
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
      .limit(4);

    // Format activities for display
    const formattedActivities = recentActivities?.map((activity: any) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      created_at: new Date(activity.created_at).toLocaleString(),
      user_id: activity.user_id,
      user_name: activity.users?.name || 'Unknown User'
    })) || [];
    
    return {
      usersCount: usersCount || 0,
      productsCount: productsCount || 0,
      pendingKycCount: pendingKycCount || 0,
      marketsCount: markets?.length || 0,
      recentActivities: formattedActivities,
      hasErrors: !!(usersError || productsError || kycError || marketsError || activitiesError)
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      usersCount: 0,
      productsCount: 0,
      pendingKycCount: 0,
      marketsCount: 0,
      recentActivities: [],
      hasErrors: true
    };
  }
}

export default async function AdminDashboard() {
  const { 
    usersCount, 
    productsCount, 
    pendingKycCount, 
    marketsCount, 
    recentActivities, 
    hasErrors 
  } = await getStatsData();
  
  // Format the numbers for display
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const stats = [
    { title: 'Total Users', value: formatNumber(usersCount), icon: <FaUsers size={20} />, color: 'border-blue-600' },
    { title: 'Active Products', value: formatNumber(productsCount), icon: <FaBox size={20} />, color: 'border-green-600' },
    { title: 'Pending KYC', value: formatNumber(pendingKycCount), icon: <FaIdCard size={20} />, color: 'border-yellow-600' },
    { title: 'Total Markets', value: formatNumber(marketsCount), icon: <FaGlobe size={20} />, color: 'border-purple-600' },
  ];
  
  return (
    <div>
      {/* Header with greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        {hasErrors && (
          <p className="text-red-500 text-sm mt-2">
            Note: Some data could not be fetched. Displaying available information.
          </p>
        )}
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard 
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
      
      {/* Quick actions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <ActionCard
          title="Manage Users"
          description="View and manage user accounts and business profiles"
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
          title="Market Analytics"
          description="View performance metrics and reports"
          icon={<FaChartLine size={20} />}
          href="/admin/analytics"
          color="border-purple-600"
        />
        
        <ActionCard
          title="Platform Settings"
          description="Configure system settings and preferences"
          icon={<FaTags size={20} />}
          href="/admin/settings"
          color="border-indigo-600"
        />
      </div>
      
      {/* Recent activity and alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity: RecentActivity) => (
                <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600 mr-3">
                    <FaComment size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{activity.type}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.created_at}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity to display.</p>
            )}
          </div>
          <Link href="/admin/activity" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:underline">
            View all activity
          </Link>
        </div>
        
        {/* System alerts */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-start pb-4 border-b border-gray-100">
              <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mr-3">
                <FaExclamationTriangle size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium">Database backup in progress</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled maintenance: 15 minutes</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full text-green-600 mr-3">
                <FaTags size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium">New system update available</p>
                <p className="text-xs text-gray-500 mt-1">Version 2.4.0 ready to install</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}