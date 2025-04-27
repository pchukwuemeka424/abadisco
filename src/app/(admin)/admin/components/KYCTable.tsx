'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaEye, FaCheck, FaTimes, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import KYCDetailsModal from './KYCDetailsModal';

type KYCVerification = {
  id: string;
  user_id: string;
  full_name: string;
  id_type: string;
  id_number: string;
  id_file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_result: string | null;
  admin_notes: string | null;
  created_at: string;
  user: {
    business_name: string;
    email: string;
  } | null;
};

export default function KYCTable() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchVerifications();
  }, []);
  
  async function fetchVerifications() {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to fetch KYC records with user relation using profiles table
      let { data, error } = await supabase
        .from('kyc_verifications')
        .select(`
          id,
          user_id,
          full_name,
          id_type,
          id_number,
          id_file_url,
          status,
          ai_result,
          admin_notes,
          created_at,
          user:user_id (
            business_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      // If the first query fails, try a simple query without the join
      if (error) {
        console.warn("Error with joined query:", error);
        
        const { data: basicData, error: basicError } = await supabase
          .from('kyc_verifications')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (basicError) {
          throw basicError;
        }
        
        data = basicData;
      }
      
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching KYC verifications:', error);
      setError('Failed to fetch verification data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  
  const handleViewDetails = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };
  
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }
      
      const { error } = await supabase
        .from('kyc_verifications')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setVerifications(verifications.map(v => {
        if (v.id === id) {
          return { ...v, status, ...(notes !== undefined ? { admin_notes: notes } : {}) };
        }
        return v;
      }));
      
      // Refresh data
      fetchVerifications();
    } catch (error) {
      console.error(`Error updating verification status to ${status}:`, error);
    }
  };
  
  const filteredVerifications = verifications.filter(verification => {
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      verification.full_name?.toLowerCase().includes(searchLower) ||
      verification.id_number?.toLowerCase().includes(searchLower) ||
      verification.user?.business_name?.toLowerCase().includes(searchLower) ||
      verification.user?.email?.toLowerCase().includes(searchLower);
    
    return matchesStatus && (searchTerm === '' || matchesSearch);
  });
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
        >
          All
        </button>
        <button 
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
        >
          <FaClock className="inline-block mr-1" />
          Pending
        </button>
        <button 
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 rounded-lg ${statusFilter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
        >
          <FaCheck className="inline-block mr-1" />
          Approved
        </button>
        <button 
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 rounded-lg ${statusFilter === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
        >
          <FaTimes className="inline-block mr-1" />
          Rejected
        </button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, ID number, business..."
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded"
        />
      </div>
      
      {filteredVerifications.length === 0 ? (
        <div className="bg-white p-6 text-center border rounded-lg">
          <p className="text-gray-500">No verification requests match your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifications.map((verification) => (
                <tr key={verification.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{verification.full_name}</div>
                    <div className="text-sm text-gray-500">{verification.user?.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{verification.user?.business_name || 'Unknown Business'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {verification.id_type ? (
                        verification.id_type.charAt(0).toUpperCase() + verification.id_type.slice(1).replace(/_/g, ' ')
                      ) : 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{verification.id_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(verification.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      verification.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      verification.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                    </span>
                    {verification.ai_result && (
                      <div className="mt-1">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          AI Verified
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(verification)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEye className="inline mr-1" /> View
                    </button>
                    
                    {verification.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(verification.id, 'approved')}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          <FaCheck className="inline mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(verification.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTimes className="inline mr-1" /> Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedVerification && (
        <KYCDetailsModal
          verification={selectedVerification}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={(status, notes) => {
            handleUpdateStatus(selectedVerification.id, status, notes);
            setShowDetailsModal(false);
          }}
        />
      )}
    </div>
  );
}