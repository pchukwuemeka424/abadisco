"use client";

import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

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

interface KYCDetailsModalProps {
  verification: KYCVerification;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

const KYCDetailsModal: React.FC<KYCDetailsModalProps> = ({
  verification,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(rejectionReason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">KYC Verification Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">User Email</p>
                <p className="font-medium">{verification.user_email || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Document Number</p>
                <p className="font-medium">{verification.document_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium capitalize">{verification.document_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted Date</p>
                <p className="font-medium">
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
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
              </div>
              {verification.processed_at && (
                <div>
                  <p className="text-sm text-gray-500">Verification Date</p>
                  <p className="font-medium">
                    {new Date(verification.processed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {verification.rejection_reason && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="font-medium text-red-600">{verification.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Document Preview</p>
              <div className="bg-gray-100 rounded-lg p-2 relative">
                {verification.document_image_url ? (
                  <div className="relative w-full h-64">
                    <Image 
                      src={verification.document_image_url} 
                      alt="KYC document" 
                      fill
                      style={{ objectFit: 'contain' }}
                      className="rounded"
                    />
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No document available</p>
                )}
              </div>
            </div>
          </div>

          {(onApprove || onReject) && verification.status === 'pending' && (
            <div className="border-t pt-4">
              {showRejectForm ? (
                <div>
                  <h3 className="font-medium mb-2">Rejection Reason</h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border rounded-lg p-2 mb-2"
                    placeholder="Please provide a reason for rejection"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                      className={`px-4 py-2 bg-red-600 text-white rounded-lg ${
                        !rejectionReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg"
                  >
                    <FaTimes className="mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      if (onApprove) {
                        onApprove();
                        onClose();
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    <FaCheck className="mr-1" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCDetailsModal;