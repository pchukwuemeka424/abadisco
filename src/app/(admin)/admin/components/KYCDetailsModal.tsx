'use client';

import { useState } from 'react';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import NextImage from 'next/image';

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
  user?: {
    business_name: string;
    email: string;
  } | null;
};

type KYCDetailsModalProps = {
  verification: KYCVerification;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: 'approved' | 'rejected', notes: string) => void;
};

export default function KYCDetailsModal({ 
  verification, 
  isOpen, 
  onClose,
  onStatusChange
}: KYCDetailsModalProps) {
  const [notes, setNotes] = useState(verification.admin_notes || '');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold mb-4">KYC Verification Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {verification.full_name}</p>
                <p><span className="font-medium">Business:</span> {verification.user?.business_name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {verification.user?.email || 'N/A'}</p>
                <p><span className="font-medium">ID Type:</span> {verification.id_type}</p>
                <p><span className="font-medium">ID Number:</span> {verification.id_number}</p>
                <p><span className="font-medium">Submission Date:</span> {new Date(verification.created_at).toLocaleString()}</p>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Current Status</h3>
                <div className="flex items-center space-x-2">
                  {verification.status === 'approved' && (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <FaCheck className="mr-1" /> Approved
                    </span>
                  )}
                  {verification.status === 'rejected' && (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      <FaTimes className="mr-1" /> Rejected
                    </span>
                  )}
                  {verification.status === 'pending' && (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <FaClock className="mr-1" /> Pending
                    </span>
                  )}
                </div>
              </div>
              
              {verification.ai_result && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">AI Verification Result</h3>
                  <p className="text-sm">{verification.ai_result}</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 min-h-[100px]"
                  placeholder="Add notes about this verification"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">ID Document</h3>
              {verification.id_file_url ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="relative aspect-[4/3] w-full">
                    <NextImage
                      src={verification.id_file_url}
                      alt="ID Document"
                      width={600}
                      height={450}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="p-2 bg-gray-50">
                    <a 
                      href={verification.id_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Full Size
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border rounded-lg p-8 bg-gray-50">
                  <p className="text-gray-500">No ID document uploaded</p>
                </div>
              )}
            </div>
          </div>
          
          {verification.status === 'pending' && (
            <div className="mt-6 flex flex-col md:flex-row md:justify-end space-y-2 md:space-y-0 md:space-x-2">
              <button
                onClick={() => onStatusChange('rejected', notes)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <FaTimes className="inline mr-2" />
                Reject Verification
              </button>
              <button
                onClick={() => onStatusChange('approved', notes)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaCheck className="inline mr-2" />
                Approve Verification
              </button>
            </div>
          )}
          
          {verification.status !== 'pending' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onStatusChange(verification.status, notes)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}