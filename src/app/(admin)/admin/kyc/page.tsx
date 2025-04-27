import { Metadata } from 'next';
import { FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaHourglass } from 'react-icons/fa';
import KYCTable from '../components/KYCTable';
import { supabase } from '@/supabaseClient';

export const metadata: Metadata = {
  title: 'KYC Verification | Admin',
  description: 'Manage and verify user identities',
};

// Status badge component
const StatusBadge = ({ count, label, icon, color }: {
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className={`bg-white rounded-lg border-l-4 ${color} p-4 shadow-md flex items-center justify-between`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-600')}`}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm text-gray-600">{label}</p>
          <h3 className="text-xl font-bold">{count}</h3>
        </div>
      </div>
    </div>
  );
};

// Function to get KYC statistics
async function getKYCStats() {
  try {
    // Get pending count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    // Get approved count
    const { count: approvedCount, error: approvedError } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    // Get rejected count
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');
    
    return {
      pendingCount: pendingCount || 0,
      approvedCount: approvedCount || 0,
      rejectedCount: rejectedCount || 0,
      hasErrors: !!(pendingError || approvedError || rejectedError)
    };
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    return {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      hasErrors: true
    };
  }
}

export default async function KYCVerification() {
  const { pendingCount, approvedCount, rejectedCount, hasErrors } = await getKYCStats();
  
  return (
    <div>
      {/* Header with page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">KYC Verification Management</h1>
        <p className="text-gray-600 mt-1">Verify identities and manage user verification requests.</p>
        {hasErrors && (
          <p className="text-red-500 text-sm mt-1">
            There was an issue fetching some statistics. Displayed values may not be accurate.
          </p>
        )}
      </div>
      
      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusBadge 
          count={pendingCount}
          label="Pending Verifications" 
          icon={<FaHourglass size={18} />}
          color="border-yellow-600"
        />
        <StatusBadge 
          count={approvedCount}
          label="Approved" 
          icon={<FaCheckCircle size={18} />}
          color="border-green-600"
        />
        <StatusBadge 
          count={rejectedCount}
          label="Rejected" 
          icon={<FaTimesCircle size={18} />}
          color="border-red-600"
        />
      </div>
      
      {/* Filter and search controls */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID number, business name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none">
                <option value="">All ID Types</option>
                <option value="nin">National ID (NIN)</option>
                <option value="drivers_license">Driver's License</option>
                <option value="passport">International Passport</option>
                <option value="voters_card">Voter's Card</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main table content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <KYCTable />
        </div>
      </div>
      
      {/* Help text */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> All verifications should be processed within 24 hours of submission. Prioritize pending verifications from business owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}