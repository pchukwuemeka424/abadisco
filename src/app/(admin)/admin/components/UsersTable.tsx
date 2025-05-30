'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaEye, FaTrash, FaEdit, FaUsers } from 'react-icons/fa';
import UserDetailsModal from './UserDetailsModal';

// Updated User type to match simplified users table
type User = {
  id: string;
  email: string;
  created_at: string;
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
          .select('id, email, created_at')
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
      } catch (error: any) {
        console.error('Error deleting user:', error);
        // Improved error handling
        const errorMessage = error.message || (error.details ? error.details : 'Unknown error occurred');
        alert(`Failed to delete user: ${errorMessage}`);
      }
    }
  };
  
  // Updated filtering to only search by email
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return user.email?.toLowerCase().includes(searchLower);
  });
  
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
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
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
                  <div className="text-sm font-medium text-gray-900">{user.email || 'N/A'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleString() || 'N/A'}
                  </div>
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