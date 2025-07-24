import React from 'react';
import Image from 'next/image';

export interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  document_type: string;
  document_number: string;
  document_image_url: string;
  submitted_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
}

interface KYCStatusCardProps {
  verification: KYCVerification;
  onResubmit?: () => void;
}

const KYCStatusCard: React.FC<KYCStatusCardProps> = ({ verification, onResubmit }) => (
  <div className="bg-white rounded-lg shadow mb-6 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-medium">Verification Status</h2>
      <span
        className={`px-3 py-1 text-sm rounded-full ${
          verification.status === 'approved'
            ? 'bg-green-100 text-green-800'
            : verification.status === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
      </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-sm text-gray-500">Document Type</p>
        <p className="font-medium capitalize">{verification.document_type.replace('_', ' ')}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Submitted Date</p>
        <p className="font-medium">{new Date(verification.submitted_at).toLocaleDateString()}</p>
      </div>
    </div>
    {verification.status === 'rejected' && verification.rejection_reason && (
      <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
        <p className="text-sm text-gray-700">Your verification was rejected for the following reason:</p>
        <p className="font-medium text-red-600">{verification.rejection_reason}</p>
      </div>
    )}
    {verification.document_image_url && (
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Submitted Document</p>
        <div className="bg-gray-100 rounded-lg p-2 relative">
          {verification.document_image_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
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
            <a
              href={verification.document_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-blue-50 p-4 text-center text-blue-600 hover:underline"
            >
              View Document
            </a>
          )}
        </div>
      </div>
    )}
    {verification.status === 'rejected' && onResubmit && (
      <div className="mt-4">
        <button
          onClick={onResubmit}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Submit New Document
        </button>
      </div>
    )}
  </div>
);

export default KYCStatusCard; 