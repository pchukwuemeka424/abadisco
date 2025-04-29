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
  document_url?: string;
  submitted_at: string;
  verification_date?: string;
  rejected_reason?: string;
  user_details?: {
    email?: string;
    name?: string;
  };
  [key: string]: unknown;
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

  useEffect(() => {
    fetchKYCVerifications();
  }, []);

  const fetchKYCVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select(`
          id,
          user_id,
          status,
          document_type,
          document_url,
          submitted_at,
          verification_date,
          rejected_reason,
          users (email, full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC verifications:', error);
      } else if (data) {
        // Transform data to match the expected structure
        const transformedData = data.map((item) => ({
          ...item,
          user_details: {
            email: item.users?.email,
            name: item.users?.full_name,
          },
        }));
        setVerifications(transformedData);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
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
      const updateData: Record<string, unknown> = {
        status,
        verification_date: new Date().toISOString(),
      };

      if (status === 'rejected' && reason) {
        updateData.rejected_reason = reason;
      }

      const { error } = await supabase
        .from('kyc_verifications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

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
    const userEmail = verification.user_details?.email?.toLowerCase() || '';
    const userName = verification.user_details?.name?.toLowerCase() || '';
    const docType = verification.document_type?.toLowerCase() || '';
    
    return userName.includes(searchLower) || 
           userEmail.includes(searchLower) || 
           docType.includes(searchLower);
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
            placeholder="Search by name, email, or document type..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <FaSpinner className="animate-spin text-gray-500" />
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredVerifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No KYC verifications found.
                </td>
              </tr>
            ) : (
              filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{verification.user_details?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{verification.user_details?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{verification.document_type}</span>
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