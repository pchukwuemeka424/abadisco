'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaEye, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaUsers } from 'react-icons/fa';
import UserDetailsModal from './UserDetailsModal';

type User = {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  market: string;
  category: string;
  status: string;
  created_at: string;
  logo_url: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        
        if (error) throw error;
        
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.business_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.market?.toLowerCase().includes(searchLower) ||
      user.category?.toLowerCase().includes(searchLower)
    );
  });
  
  const getStatusIcon = (status: string) => {
    if (status === 'Now Open') {
      return <FaCheckCircle className="text-green-600" />;
    } else if (status === 'Closed') {
      return <FaTimesCircle className="text-red-600" />;
    } else {
      return <FaExclamationCircle className="text-yellow-600" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Now Open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-slate-200 h-10 w-10 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-32"></div>
          <div className="h-3 bg-slate-200 rounded w-24 mt-2"></div>
        </div>
      </div>
    );
  }
  
  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-6 mb-4">
          <FaUsers className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">No users found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm ? 'No users match your search criteria.' : 'There are no users in the system yet.'}
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEdit className="-ml-1 mr-2 h-5 w-5" />
            Add User
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img 
                        className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                        src={user.logo_url || '/images/logo.png'} 
                        alt={user.business_name || 'Business logo'} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo.png';
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.business_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.full_name || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.market || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{user.category || 'N/A'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(user.status)}`}>
                    {getStatusIcon(user.status)}
                    <span className="ml-1">{user.status || 'Unknown'}</span>
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={() => handleViewDetails(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                      title="View Details"
                    >
                      <FaEye size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                      title="Delete User"
                    >
                      <FaTrash size={16} />
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                      title="Edit User"
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}