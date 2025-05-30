'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaUser, FaEdit, FaSave, FaMoneyBillWave, FaCheck, FaTimes, FaChartLine, FaBuilding, FaClock, FaListAlt, FaUserCircle } from 'react-icons/fa';
import Image from 'next/image';

// Nigerian banks including OPay
const nigerianBanks = [
  "Access Bank",
  "Citibank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Guaranty Trust Bank",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "OPay",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank"
];

export default function AgentProfile() {
  const [profile, setProfile] = useState({
    id: '',
    user_id: '',
    email: '',
    full_name: '',
    phone: '',
    avatar_url: '',
    role: 'agent',
    status: 'pending',
    weekly_target: 40,
    weekly_target_met: false,
    current_week_registrations: 0,
    total_registrations: 0,
    total_businesses: 0,
    Bank_name: '',
    Bank_acno: '',
    created_at: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [activeTab, setActiveTab] = useState('profile'); // New state for tab navigation
  
  useEffect(() => {
    fetchAgentProfile();
  }, []);
  
  async function fetchAgentProfile() {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Get the agent profile from the agents table
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          email: data.email,
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          role: data.role || 'agent',
          status: data.status || 'pending',
          weekly_target: data.weekly_target || 40,
          weekly_target_met: data.weekly_target_met || false,
          current_week_registrations: data.current_week_registrations || 0,
          total_registrations: data.total_registrations || 0,
          total_businesses: data.total_businesses || 0,
          Bank_name: data.Bank_name || '',
          Bank_acno: data.Bank_acno || '',
          created_at: data.created_at
        });
        
        // After setting the initial profile, fetch real-time stats
        fetchPerformanceStats(data.id, user.id);
      } else {
        // If no profile in agents table, use auth user data with defaults
        setProfile({
          id: '', // will be generated upon insert
          user_id: user.id,
          email: user.email || '',
          full_name: '',
          phone: '',
          avatar_url: '',
          role: 'agent',
          status: 'pending',
          weekly_target: 40,
          weekly_target_met: false,
          current_week_registrations: 0,
          total_registrations: 0,
          total_businesses: 0,
          Bank_name: '',
          Bank_acno: '',
          created_at: user.created_at
        });
      }
      
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      setMessage({
        type: 'error',
        content: 'Failed to load profile. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchPerformanceStats(agentId, userId) {
    try {
      setStatsLoading(true);
      
      // Get current week start and end dates
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Fetch weekly registrations
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString());
      
      if (weeklyError) {
        console.error('Error fetching weekly registrations:', weeklyError);
        throw weeklyError;
      }
      
      // Fetch total registrations
      const { count: totalRegistrations, error: totalError } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId);
      
      if (totalError) {
        console.error('Error fetching total registrations:', totalError);
        throw totalError;
      }
      
      // Fetch total completed businesses
      const { count: totalCompletedBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .not('name', 'is', null);
      
      if (businessError) {
        console.error('Error fetching total businesses:', businessError);
        throw businessError;
      }
      
      // Calculate if weekly target has been met
      const weeklyTargetMet = weeklyCount >= profile.weekly_target;
      
      // Update profile with real stats
      setProfile(prev => ({
        ...prev,
        weekly_target_met: weeklyTargetMet,
        current_week_registrations: weeklyCount || 0,
        total_registrations: totalRegistrations || 0,
        total_businesses: totalCompletedBusinesses || 0
      }));
      
      // Also update the database with the latest stats
      if (agentId) {
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            weekly_target_met: weeklyTargetMet,
            current_week_registrations: weeklyCount || 0,
            total_registrations: totalRegistrations || 0,
            total_businesses: totalCompletedBusinesses || 0
          })
          .eq('id', agentId);
          
        if (updateError) {
          console.error('Error updating agent stats:', updateError);
        }
      }
      
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }
  
  async function updateProfile() {
    try {
      setUpdateLoading(true);
      setMessage({ type: '', content: '' });
      
      // Get current user to ensure we're updating with correct user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      const profileData = {
        id: profile.id || undefined, // If empty, will be auto-generated
        user_id: user.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        Bank_name: profile.Bank_name,
        Bank_acno: profile.Bank_acno,
        updated_at: new Date().toISOString()
      };
      
      // If id is empty, it's a new record, otherwise update existing
      const { data, error } = await supabase
        .from('agents')
        .upsert(profileData)
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile({
        ...profile,
        ...data
      });
      
      // After profile update, refresh performance stats
      fetchPerformanceStats(data.id, user.id);
      
      setMessage({
        type: 'success',
        content: 'Profile updated successfully!'
      });
      setEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        content: 'Failed to update profile. Please try again.'
      });
    } finally {
      setUpdateLoading(false);
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate progress percentage for weekly target
  const progressPercentage = Math.min(
    Math.round((profile.current_week_registrations / profile.weekly_target) * 100),
    100
  );

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your personal information and view your performance stats</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-200 h-16 w-16 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Profile Header with Avatar and Status */}
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-16">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center">
                <div className="relative">
                  {profile.avatar_url ? (
                    <Image 
                      src={profile.avatar_url}
                      alt={profile.full_name} 
                      width={96}
                      height={96}
                      className="rounded-full border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
                      <FaUser className="h-12 w-12 text-blue-500" />
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white ${
                    profile.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white">{profile.full_name || 'Your Name'}</h2>
                  <p className="text-blue-100">{profile.email}</p>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-25 text-white">
                    {profile.status === 'active' ? (
                      <FaCheck className="mr-1 text-green-300" />
                    ) : (
                      <FaClock className="mr-1 text-amber-300" />
                    )}
                    {profile.status === 'active' ? 'Active Agent' : 'Pending Verification'}
                  </div>
                </div>
              </div>
              
              {!editing ? (
                <button 
                  onClick={() => setEditing(true)} 
                  className="mt-4 sm:mt-0 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button 
                    onClick={() => {
                      setEditing(false);
                      fetchAgentProfile();
                      setMessage({ type: '', content: '' });
                    }} 
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors flex items-center"
                  >
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                  <button 
                    onClick={updateProfile} 
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                    disabled={updateLoading}
                  >
                    <FaSave className="mr-2" />
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Performance Stats
                </button>
                <button
                  onClick={() => setActiveTab('banking')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'banking'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Banking Details
                </button>
              </nav>
            </div>
          </div>

          {/* Message Alert */}
          {message.content && (
            <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border-l-4 border-green-500' 
                : 'bg-red-50 text-red-800 border-l-4 border-red-500'
            }`}>
              {message.type === 'success' ? (
                <FaCheck className="h-5 w-5 mr-3 text-green-500" />
              ) : (
                <FaTimes className="h-5 w-5 mr-3 text-red-500" />
              )}
              {message.content}
            </div>
          )}

          {/* Tab Content */}
          <div className="px-6 py-6">
            {/* Personal Information Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
                        {profile.full_name || 'Not set'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
                      {profile.email}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    {editing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                          +234
                        </div>
                        <input
                          type="text"
                          name="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="8012345678"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
                        {profile.phone ? `+234 ${profile.phone}` : 'Not set'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
                      {formatDate(profile.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Weekly Progress */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <FaChartLine className="mr-2 text-blue-500" />
                            Weekly Target Progress
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {profile.weekly_target_met 
                              ? "Congratulations! You've met your weekly target." 
                              : `You need ${profile.weekly_target - profile.current_week_registrations} more registrations to meet your target.`
                            }
                          </p>
                        </div>
                        <div className="mt-3 sm:mt-0 bg-blue-50 px-4 py-1 rounded-full text-blue-700 font-medium text-sm">
                          Target: {profile.weekly_target} registrations
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div 
                          className={`h-4 rounded-full ${
                            profile.weekly_target_met ? 'bg-green-500' : 'bg-blue-500'
                          }`} 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{profile.current_week_registrations} completed</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      
                      {profile.weekly_target_met && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-start">
                          <FaCheck className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <p>Great job! You've exceeded your weekly target. Keep up the good work!</p>
                        </div>
                      )}
                    </div>

                    {/* Performance Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-blue-800">This Week</h3>
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FaClock className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-blue-900 mb-1">{profile.current_week_registrations}</p>
                        <p className="text-sm text-blue-600">Registrations this week</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-purple-800">Total Registrations</h3>
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FaListAlt className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-purple-900 mb-1">{profile.total_registrations}</p>
                        <p className="text-sm text-purple-600">Businesses registered</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-amber-800">Complete Profiles</h3>
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <FaBuilding className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-amber-900 mb-1">{profile.total_businesses}</p>
                        <p className="text-sm text-amber-600">Complete business profiles</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Banking Details Tab */}
            {activeTab === 'banking' && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <FaMoneyBillWave className="mr-2 text-blue-500" />
                      Payment Information
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Please provide your bank details for commission payments
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      {editing ? (
                        <select
                          name="Bank_name"
                          value={profile.Bank_name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        >
                          <option value="">Select a bank</option>
                          {nigerianBanks.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800 border border-gray-200">
                          {profile.Bank_name || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      {editing ? (
                        <input
                          type="text"
                          name="Bank_acno"
                          value={profile.Bank_acno}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          maxLength={10} 
                          minLength={10}
                          pattern="[0-9]{10}"
                          title="Bank account number must be exactly 10 digits"
                          placeholder="Enter 10-digit account number"
                        />
                      ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800 border border-gray-200">
                          {profile.Bank_acno ? profile.Bank_acno.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') : 'Not set'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with Save Button when Editing */}
            {editing && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={updateProfile}
                  disabled={updateLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center font-medium disabled:opacity-70"
                >
                  {updateLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}