import React from 'react';
import { format } from 'date-fns';

// Updated User interface to match simplified users table
interface User {
  id: string;
  email?: string;
  password?: string; // Note: This should never be displayed
  created_at?: string;
}

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  isOpen: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, isOpen }) => {
  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">User Details</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-gray-500">Email</label>
              <div className="font-medium">{user.email || 'N/A'}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500">Joined Date</label>
              <div className="font-medium">{formatDate(user.created_at)}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500">User ID</label>
              <div className="font-medium text-xs text-gray-600 break-all">
                {user.id}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">
              This user&apos;s data is maintained in accordance with our privacy policy. Only authorized administrators can view this information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;