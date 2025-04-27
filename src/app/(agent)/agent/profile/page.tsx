'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaUser, FaEdit, FaSave } from 'react-icons/fa';

export default function AgentProfile() {
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    avatar_url: '',
    created_at: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
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
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at
        });
      } else {
        // If no profile in agents table, use auth user data
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: '',
          phone: '',
          avatar_url: '',
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
  
  async function updateProfile() {
    try {
      setUpdateLoading(true);
      setMessage({ type: '', content: '' });
      
      const { data, error } = await supabase
        .from('agents')
        .upsert({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile({
        ...profile,
        ...data
      });
      
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