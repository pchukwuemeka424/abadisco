import { Metadata } from 'next';
import { FaSearch, FaUserPlus } from 'react-icons/fa';
import UsersTable from '../components/UsersTable';

export const metadata: Metadata = {
  title: 'Users Management | Admin',
  description: 'Manage users accounts',
};

export default function UsersManagement() {
  return (
    <div>
      {/* Header with page title and actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
          <p className="text-gray-600 mt-1">View and manage all user accounts.</p>
        </div>
        
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto justify-center">
          <FaUserPlus className="mr-2" />
          <span>Add New User</span>
        </button>
      </div>
      
      {/* Filter and search bar */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main table content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <UsersTable />
        </div>
      </div>
      
      {/* Pagination */}
      <div className="mt-5 flex justify-between items-center bg-white rounded-xl shadow-md p-3">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">100</span> users
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Previous</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
}