"use client";

import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaSearch, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../../../supabaseClient';
import KYCDetailsModal from './KYCDetailsModal';

// Define proper types for KYC verification
interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  document_type: string;
  document_number: string;
  document_image_url?: string;
  submitted_at: string;
  processed_at?: string;
  rejection_reason?: string;
  user_email?: string;
}

interface KYCTableProps {
  onStatusUpdate?: () => void;
}

const KYCTable: React.FC<KYCTableProps> = ({ onStatusUpdate }) => {
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKYCVerifications();
  }, []);

  const fetchKYCVerifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch all KYC verifications
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (kycError) {
        console.error('Error fetching KYC verifications:', kycError);
        setError('Failed to load KYC verifications. Please try again later.');
        return;
      }

      if (!kycData || kycData.length === 0) {
        setVerifications([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs from the KYC data
      const userIds = [...new Set(kycData.map(item => item.user_id))];
      
      // Fetch user data for these IDs
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);
      
      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      // Create a map of user IDs to user data for quick lookup
      const userMap = (userData || []).reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {} as Record<string, any>);

      // Combine KYC data with user data
      const combinedData = kycData.map(item => ({
        ...item,
        user_email: userMap[item.user_id]?.email || 'Unknown'
      }));

      setVerifications(combinedData);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setProcessingId(id);
    try {
      const updateData: Record<string, any> = {
        status,
        processed_at: new Date().toISOString(),
      };

      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('kyc_verifications')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating verification status:', error);
        throw error;
      }

      // Update local state
      setVerifications(prevVerifications =>
        prevVerifications.map(v => v.id === id ? { ...v, ...updateData } : v)
      );

      // Call onStatusUpdate if provided
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    const searchLower = searchTerm.toLowerCase();
    const userEmail = verification.user_email?.toLowerCase() || '';
    const docType = verification.document_type?.toLowerCase() || '';
    const docNumber = verification.document_number?.toLowerCase() || '';
    
    return userEmail.includes(searchLower) || 
           docType.includes(searchLower) || 
           docNumber.includes(searchLower);
  });

  const handleViewDetails = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-4 flex">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by email, document type, or document number..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <FaSpinner className="animate-spin text-gray-500" />
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredVerifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No KYC verifications found.
                </td>
              </tr>
            ) : (
              filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{verification.user_email || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{verification.document_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span>{verification.document_number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(verification.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        verification.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : verification.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {verification.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(verification)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                      {verification.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(verification.id, 'approved')}
                            disabled={processingId === verification.id}
                            className={`text-green-600 hover:text-green-900 ${
                              processingId === verification.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {processingId === verification.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(verification.id, 'rejected', 'Document invalid')}
                            disabled={processingId === verification.id}
                            className={`text-red-600 hover:text-red-900 ${
                              processingId === verification.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedVerification && (
        <KYCDetailsModal
          verification={selectedVerification}
          onClose={() => setShowDetailsModal(false)}
          onApprove={selectedVerification.status === 'pending' ? 
            () => handleStatusUpdate(selectedVerification.id, 'approved') : undefined}
          onReject={selectedVerification.status === 'pending' ? 
            (reason: string) => handleStatusUpdate(selectedVerification.id, 'rejected', reason) : undefined}
        />
      )}
    </div>
  );
};

export default KYCTable;