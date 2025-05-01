'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaUsers, FaStore, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

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

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Businesses</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaUsers className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week's Businesses</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.weeklyUsers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaStore className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Listings</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.totalListings}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`${stats.weeklyTargetMet ? 'bg-green-100' : 'bg-yellow-100'} p-3 rounded-full mr-4`}>
              {stats.weeklyTargetMet ? (
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <FaSpinner className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekly Target</p>
              <h3 className="text-2xl font-bold">{stats.weeklyUsers}/{stats.weeklyTarget}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weekly Progress */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Weekly Registration Progress</h2>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                stats.weeklyTargetMet ? 'text-green-600 bg-green-200' : 'text-yellow-600 bg-yellow-200'
              }`}>
                {stats.weeklyProgress.toFixed(0)}% Complete
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-gray-600">
                Goal: {stats.weeklyTarget} Businesses
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div style={{ width: `${stats.weeklyProgress}%` }} 
                 className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                   stats.weeklyTargetMet ? 'bg-green-500' : 'bg-yellow-500'
                 }`}>
            </div>
          </div>
          {stats.weeklyTargetMet && (
            <div className="text-center text-green-600 font-semibold">
              Congratulations! You've met your weekly target! 🎉
            </div>
          )}
          {/* Warning message and alert if target not met */}
          {!loading && !stats.weeklyTargetMet && (
            <div className="text-center text-yellow-700 font-semibold mt-4">
              <span role="alert" className="inline-flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" /></svg>
                Warning: You have not met your weekly target. Please try to register more businesses this week!
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Businesses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Businesses</h2>
          <Link href="/agent/add-business" className="text-blue-600 hover:text-blue-800 flex items-center">
            <span>Add New Business</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : recentBusinesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td className="py-3 px-4 whitespace-nowrap">{business.name || 'N/A'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{business.contact_email || 'N/A'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{business.contact_phone || 'N/A'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{business.business_name || 'N/A'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {business.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No businesses registered yet.</div>
        )}
      </div>
    </div>
  );
}