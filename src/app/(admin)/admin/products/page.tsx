import { Metadata } from 'next';
import { FaSearch, FaPlus, FaFileExport, FaFilter } from 'react-icons/fa';
import ProductsTable from '../components/ProductsTable';

export const metadata: Metadata = {
  title: 'Products Management | Admin',
  description: 'Manage products across the platform',
};

export default function ProductsManagement() {
  return (
    <div>
      {/* Header with page title and actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
          <p className="text-gray-600 mt-1">View, edit and manage all products in the marketplace.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors justify-center">
            <FaFileExport className="mr-2" />
            <span>Export</span>
          </button>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors justify-center">
            <FaPlus className="mr-2" />
            <span>Add Product</span>
          </button>
        </div>
      </div>
      
      {/* Filter and search controls */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, description, category..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none">
                <option value="">All Categories</option>
                <option value="clothing">Clothing</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none">
                <option value="">All Markets</option>
                <option value="ariaria">Ariaria Market</option>
                <option value="ahia-ohuru">Ahia Ohuru Market</option>
                <option value="cemetery">Cemetery Market</option>
                <option value="eziukwu">Eziukwu Market</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Additional filters - expandable */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-blue-600 text-sm font-medium hover:underline">
            Show advanced filters
          </button>
        </div>
      </div>
      
      {/* Products table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <ProductsTable />
        </div>
      </div>
      
      {/* Pagination */}
      <div className="mt-5 flex justify-between items-center flex-wrap gap-4 bg-white rounded-xl shadow-md p-3">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to <span className="font-medium">20</span> of <span className="font-medium">483</span> products
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Previous</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">...</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">24</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
}