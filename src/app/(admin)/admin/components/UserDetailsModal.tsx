'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTimes } from 'react-icons/fa';

type User = {
  id: string;
  full_name: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  market: string;
  category: string;
  status: string;
  description: string;
  address: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  services: string;
  custom_services: string[];
  registration_number: string;
  logo_url: string;
  image: string;
  created_at: string;
};

type UserDetailsModalProps = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
};

export default function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  const [userData, setUserData] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userData.id);
        
      if (error) throw error;
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit User' : 'User Details'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="business_name"
                        value={userData.business_name || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.business_name || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner's Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="full_name"
                        value={userData.full_name || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.full_name || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="business_type"
                        value={userData.business_type || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.business_type || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="registration_number"
                        value={userData.registration_number || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.registration_number || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        name="email"
                        value={userData.email || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.email || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        name="phone"
                        value={userData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.phone || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={userData.address || ''}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.address || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Business Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="market"
                        value={userData.market || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.market || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="category"
                        value={userData.category || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.category || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={userData.description || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.description || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        name="status"
                        value={userData.status || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="Now Open">Now Open</option>
                        <option value="Closed">Closed</option>
                        <option value="By Appointment">By Appointment</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        userData.status === 'Now Open' ? 'bg-green-100 text-green-800' : 
                        userData.status === 'Closed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userData.status || 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Online Presence</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    {isEditing ? (
                      <input 
                        type="url" 
                        name="website"
                        value={userData.website || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.website || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="facebook"
                          value={userData.facebook || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.facebook || 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="instagram"
                          value={userData.instagram || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.instagram || 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="whatsapp"
                          value={userData.whatsapp || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.whatsapp || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}