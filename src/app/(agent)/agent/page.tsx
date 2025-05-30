'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  FaUsers, 
  FaStore, 
  FaCheckCircle, 
  FaSpinner, 
  FaPlus,
  FaChartLine,
  FaTrophy,
  FaCalendarWeek,
  FaChartBar,
  FaLightbulb,
  FaRocket,
  FaStar,
  FaRegClock,
  FaHandshake,
  FaRegThumbsUp
} from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

export default function AgentDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    weeklyUsers: 0,
    totalListings: 0,
    weeklyProgress: 0,
    weeklyTargetMet: false,
    weeklyTarget: 40, // Default value until we fetch the actual target
  });
  const [loading, setLoading] = useState(true);
  const [recentBusinesses, setRecentBusinesses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get agent ID from the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        const agentId = user?.id;
        
        if (!agentId) return;
        
        // Get current week start and end dates
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday as first day
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Fetch agent details including weekly_target
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('weekly_target')
          .eq('user_id', agentId)
          .single();
        
        if (agentError) {
          console.error('Error fetching agent data:', agentError);
          // Continue with default value if there's an error
        }
        
        // Get the weekly target from agent data or use default
        const weeklyTarget = agentData?.weekly_target || 40;
        
        // Fetch stats from businesses table
        const { data: totalBusinesses, error: totalBusinessesError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId);
        
        const { data: weeklyBusinesses, error: weeklyBusinessesError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId)
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString());
        
        const { data: totalListings, error: totalListingsError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId)
          .not('name', 'is', null);
        
        // Fetch recent businesses
        const { data: recent, error: recentError } = await supabase
          .from('businesses')
          .select('*')
          .eq('created_by', agentId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (recentError) throw recentError;
        
        setRecentBusinesses(recent || []);
        
        // Calculate weekly progress
        const weeklyCount = weeklyBusinesses?.length || 0;
        const progress = Math.min((weeklyCount / weeklyTarget) * 100, 100);
        const targetMet = weeklyCount >= weeklyTarget;
        
        setStats({
          totalUsers: totalBusinesses?.length || 0,
          weeklyUsers: weeklyCount,
          totalListings: totalListings?.length || 0,
          weeklyProgress: progress,
          weeklyTargetMet: targetMet,
          weeklyTarget: weeklyTarget,
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // For a more engaging dashboard, calculate some extra stats for insights
  const calculateInsights = () => {
    if (loading) return null;
    
    // Generate consistent insights based on the data
    const averageWeeklyBusinesses = Math.max(1, Math.round(stats.totalUsers / 10));
    const weeklyGrowth = stats.weeklyUsers > averageWeeklyBusinesses 
      ? Math.round((stats.weeklyUsers - averageWeeklyBusinesses) / averageWeeklyBusinesses * 100)
      : 0;
    const achievementLevel = stats.totalUsers > 100 ? 'Gold' : stats.totalUsers > 50 ? 'Silver' : 'Bronze';
    
    return {
      averageWeeklyBusinesses,
      weeklyGrowth,
      achievementLevel,
      nextMilestone: Math.ceil(stats.totalUsers / 50) * 50,
      remainingForMilestone: Math.ceil(stats.totalUsers / 50) * 50 - stats.totalUsers
    };
  };

  const insights = calculateInsights();
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate);

  // Get friendly motivational message based on weekly progress
  const getMotivationalMessage = () => {
    if (loading) return "";
    
    if (stats.weeklyTargetMet) {
      return "Outstanding work this week! Your dedication is driving our marketplace growth.";
    } else if (stats.weeklyProgress >= 75) {
      return "Almost there! Just a few more registrations to hit your weekly target.";
    } else if (stats.weeklyProgress >= 50) {
      return "You're making good progress! Keep the momentum going.";
    } else if (stats.weeklyProgress >= 25) {
      return "You're building momentum. Each business you register strengthens our marketplace.";
    } else {
      return "This week is just getting started. Small consistent steps lead to great achievements!";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top navigation gradient */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-48 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="max-w-7xl mx-auto p-6 relative z-10">
          <div className="flex justify-between">
            <div className="pt-4">
              <div className="text-white/80 text-sm font-medium mb-1">{formattedDate}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Welcome to Your Dashboard</h1>
              <p className="text-white/90 max-w-xl">
                Track your business registrations, monitor your weekly targets, and grow your impact in the marketplace.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="mt-4 bg-white/20 backdrop-blur-md rounded-xl p-4 text-white border border-white/30">
                <div className="text-xs uppercase tracking-wide opacity-90">Agent Status</div>
                <div className="font-bold text-lg">
                  {loading ? "Loading..." : insights?.achievementLevel} Agent
                </div>
                {!loading && (
                  <div className="text-xs mt-1">
                    {insights?.remainingForMilestone} more to reach {insights?.nextMilestone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute bottom-10 left-1/4 w-32 h-32 rounded-full bg-pink-300"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-indigo-300"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        {/* Quick Action Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to grow your impact?</h2>
            <p className="text-gray-600 max-w-2xl">
              Connect with local businesses and help them join our digital marketplace. Each registration strengthens our community's digital presence.
            </p>
          </div>
          <Link 
            href="/agent/add-listing"
            className="mt-4 md:mt-0 group inline-flex items-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform duration-150"
          >
            <FaPlus className="mr-2 group-hover:scale-110 transition-transform" />
            Register New Business
          </Link>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Weekly Performance Summary - Spans 8 columns on md screens */}
          <div className="md:col-span-8">
            {/* Motivational Card */}
            <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden border border-slate-100">
              <div className="flex flex-col sm:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <FaLightbulb className="h-5 w-5 text-violet-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 ml-3">This Week's Journey</h2>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-700 mb-3">{getMotivationalMessage()}</p>
                    <div className="text-sm text-gray-500">Weekly target: {stats.weeklyUsers} of {stats.weeklyTarget} registrations</div>
                  </div>
                  
                  {/* Animated Progress Bar */}
                  <div className="relative mt-2">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stats.weeklyTargetMet ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${loading ? 0 : stats.weeklyProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>Start</span>
                      <span>Target: {stats.weeklyTarget}</span>
                    </div>
                  </div>
                </div>
                <div className="sm:w-36 md:w-48 bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center p-4">
                  {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
                  ) : stats.weeklyTargetMet ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
                        <FaCheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-800">Target Met!</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-20 h-20">
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="36" 
                            fill="none" 
                            stroke="#f0f0f0" 
                            strokeWidth="8"
                          />
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="36" 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 36}`} 
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - stats.weeklyProgress / 100)}`}
                            transform="rotate(-90 40 40)"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-xl font-bold text-gray-800">{stats.weeklyProgress.toFixed(0)}%</span>
                      </div>
                      <p className="text-sm font-medium text-amber-800 mt-1">In Progress</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {/* Total Businesses Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 p-2.5 rounded-xl">
                    <FaStore className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-lg">All-Time</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '—' : stats.totalUsers}</h3>
                <p className="text-sm text-gray-600 mt-1">Total Businesses</p>
              </div>
              
              {/* Weekly Businesses Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl">
                    <FaCalendarWeek className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-lg">This Week</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '—' : stats.weeklyUsers}</h3>
                <p className="text-sm text-gray-600 mt-1">New Registrations</p>
              </div>
              
              {/* Total Listings Card */}
              <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl p-5 border border-fuchsia-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-fuchsia-100 p-2.5 rounded-xl">
                    <FaChartBar className="h-5 w-5 text-fuchsia-600" />
                  </div>
                  <span className="text-xs font-medium text-fuchsia-600 bg-fuchsia-100/50 px-2.5 py-1 rounded-lg">Published</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '—' : stats.totalListings}</h3>
                <p className="text-sm text-gray-600 mt-1">Active Listings</p>
              </div>
            </div>

            {/* Recent Businesses Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FaHandshake className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 ml-3">Recent Partnerships</h2>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-lg">
                    Latest {recentBusinesses.length}
                  </span>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-gray-600 font-medium">Fetching your recent business partnerships...</p>
                  </div>
                ) : recentBusinesses.length > 0 ? (
                  <div className="space-y-5">
                    {recentBusinesses.map((business) => (
                      <div key={business.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 text-lg leading-tight mb-1">
                              {business.business_name || 'New Business'}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">{business.name || 'Contact Pending'}</div>
                            
                            <div className="flex flex-wrap gap-3 text-xs">
                              {business.contact_email && (
                                <div className="flex items-center text-slate-600 bg-slate-100/80 px-2 py-1 rounded">
                                  <span className="mr-1">📧</span>
                                  <span>{business.contact_email}</span>
                                </div>
                              )}
                              {business.contact_phone && (
                                <div className="flex items-center text-slate-600 bg-slate-100/80 px-2 py-1 rounded">
                                  <span className="mr-1">📱</span>
                                  <span>{business.contact_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Date badge */}
                          <div className="text-xs text-slate-600 bg-slate-200/50 px-2 py-1 rounded whitespace-nowrap">
                            {business.created_at ? new Date(business.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Link 
                      href="/agent/businesses" 
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View all your registered businesses
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                    <div className="p-4 bg-indigo-100/50 rounded-full mb-3">
                      <FaStore className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No businesses registered yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Start your journey by registering local businesses to our digital marketplace and help them reach more customers.
                    </p>
                    <Link 
                      href="/agent/add-listing" 
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow hover:shadow-lg"
                    >
                      <FaPlus className="mr-2 h-3.5 w-3.5" />
                      Register Your First Business
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar content - Spans 4 columns on md screens */}
          <div className="md:col-span-4 space-y-6">
            {/* Performance Insights Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FaRocket className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 ml-3">Performance Insights</h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Weekly Growth */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Weekly Growth</span>
                      <span className={`text-sm font-medium ${insights.weeklyGrowth > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {insights.weeklyGrowth > 0 ? `+${insights.weeklyGrowth}%` : 'Stable'}
                      </span>
                    </div>
                    <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, insights.weeklyGrowth * 2)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {insights.weeklyGrowth > 10 
                        ? "Excellent growth! Keep up the momentum." 
                        : "Consistent progress builds lasting success."}
                    </p>
                  </div>
                  
                  {/* Next Milestone */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Next Milestone</span>
                      <span className="text-sm font-medium text-indigo-600">{insights.nextMilestone} Businesses</span>
                    </div>
                    <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500"
                        style={{ width: `${(stats.totalUsers / insights.nextMilestone) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {insights.remainingForMilestone} more to reach your next achievement level
                    </p>
                  </div>
                  
                  {/* Tips for Growth */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mt-2">
                    <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                      <FaRegThumbsUp className="h-4 w-4 mr-2" />
                      Tips for Success
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li className="flex items-start">
                        <span className="mr-1.5">•</span>
                        <span>Reach out to businesses that don't have an online presence yet</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5">•</span>
                        <span>Focus on completing all business profile details for better visibility</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5">•</span>
                        <span>Follow up with your registered businesses to encourage them to update their listings</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Achievement Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaStar className="h-5 w-5 text-yellow-300" />
                  </div>
                  <h2 className="text-lg font-bold ml-3">Agent Status</h2>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white"></div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-bold mb-1">{insights.achievementLevel} Agent</h3>
                      <p className="text-white/80 text-sm">
                        Your dedicated efforts are making a real difference in our marketplace's growth.
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5 text-sm">
                        <span>Progress to {insights.achievementLevel === 'Gold' ? 'Platinum' : insights.achievementLevel === 'Silver' ? 'Gold' : 'Silver'}</span>
                        <span>{stats.totalUsers} / {insights.nextMilestone}</span>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
                          style={{ width: `${(stats.totalUsers / insights.nextMilestone) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-white/80">
                      {insights.achievementLevel === 'Bronze' && "Bronze agents are just beginning their journey. Keep registering businesses to reach Silver!"}
                      {insights.achievementLevel === 'Silver' && "Silver agents have proven their dedication. Gold status awaits you!"}
                      {insights.achievementLevel === 'Gold' && "Gold agents are top performers. Your contribution to our marketplace is exceptional!"}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-full"></div>
            </div>
            
            {/* Quick Tips Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FaRegClock className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 ml-3">Upcoming Deadlines</h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Weekly Target Deadline</h4>
                      <p className="text-sm text-gray-600">
                        {stats.weeklyTargetMet 
                          ? "This week's target has been met!" 
                          : `${stats.weeklyTarget - stats.weeklyUsers} more businesses needed`}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                      Friday
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Monthly Review</h4>
                      <p className="text-sm text-gray-600">Prepare your monthly business acquisition report</p>
                    </div>
                    <div className="text-sm font-medium text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                      May 31
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}