'use client';

import { useState } from 'react';
import { FaSearch, FaPlus, FaFileExport, FaFilter } from 'react-icons/fa';
import ProductsTable from '../components/ProductsTable';

export default function ProductsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
                placeholder="Search by title..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
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
              <select 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}  
              >
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
          <button 
            className="text-blue-600 text-sm font-medium hover:underline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Hide advanced filters' : 'Show advanced filters'}
          </button>
          
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
                <select className="block w-full py-2 px-3 border border-gray-300 rounded-lg">
                  <option value="">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="block w-full py-2 px-3 border border-gray-300 rounded-lg">
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Products table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <ProductsTable searchTerm={searchTerm} />
        </div>
      </div>
      
      {/* Pagination handled by the table component */}
    </div>
  );
}