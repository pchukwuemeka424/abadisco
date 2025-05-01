'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaUser, FaEdit, FaSave, FaBank } from 'react-icons/fa';

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
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Profile</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8">Loading profile...</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-4 rounded-full mr-4">
                  <FaUser className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.full_name || 'Agent'}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-sm text-gray-500">Status: <span className={`font-medium ${profile.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>{profile.status}</span></p>
                </div>
              </div>
              
              {editing ? (
                <button 
                  onClick={updateProfile} 
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : (
                    <>
                      <FaSave className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setEditing(true)} 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
            
            {message.content && (
              <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.content}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="py-2">{profile.full_name || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="py-2 text-gray-700">{profile.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {editing ? (
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="py-2">{profile.phone || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                  <p className="py-2">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  {editing ? (
                    <select
                      name="Bank_name"
                      value={profile.Bank_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select a bank</option>
                      {nigerianBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="py-2">{profile.Bank_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                  {editing ? (
                    <input
                      type="text"
                      name="Bank_acno"
                      value={profile.Bank_acno}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      maxLength={10} 
                      minLength={10}
                      pattern="[0-9]{10}"
                      title="Bank account number must be exactly 10 digits"
                      placeholder="Enter 10-digit account number"
                    />
                  ) : (
                    <p className="py-2">{profile.Bank_acno || 'Not set'}</p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="text-lg font-medium mb-4">Performance Statistics</h3>
                {statsLoading ? (
                  <div className="text-center py-4">Loading performance statistics...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">Weekly Target</p>
                      <p className="text-2xl font-bold">{profile.weekly_target}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700">This Week</p>
                      <p className="text-2xl font-bold">{profile.current_week_registrations}</p>
                      {profile.weekly_target_met && (
                        <p className="text-xs text-green-600 mt-1">Target reached! 🎉</p>
                      )}
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">Total Registrations</p>
                      <p className="text-2xl font-bold">{profile.total_registrations}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-sm text-amber-700">Total Businesses</p>
                      <p className="text-2xl font-bold">{profile.total_businesses}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {editing && (
              <div className="mt-8 border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    setEditing(false);
                    fetchAgentProfile();
                    setMessage({ type: '', content: '' });
                  }} 
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={updateProfile} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}