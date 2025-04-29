'use client';

import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaEye, FaPlus } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface Market {
  id: string;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface MarketTableProps {
  onEdit: (market: Market) => void;
  onDelete: (market: Market) => void;
  refreshData: () => void;
  markets: Market[];
  isLoading: boolean;
}

export default function MarketTable({ onEdit, onDelete, refreshData, markets, isLoading }: MarketTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (markets) {
      const filtered = markets.filter((market) =>
        market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (market.location && market.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (market.description && market.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Sort the filtered markets
      const sorted = [...filtered].sort((a, b) => {
        let fieldA = a[sortField as keyof Market];
        let fieldB = b[sortField as keyof Market];
        
        // Handle null/undefined values
        if (fieldA === null || fieldA === undefined) fieldA = '';
        if (fieldB === null || fieldB === undefined) fieldB = '';
        
        // Convert to string for comparison
        const aString = String(fieldA).toLowerCase();
        const bString = String(fieldB).toLowerCase();
        
        // Compare based on sort direction
        if (sortDirection === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
      
      setFilteredMarkets(sorted);
    }
  }, [markets, searchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort direction if same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search markets..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            Refresh
          </button>
          <Link
            href="/admin/markets/add"
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <FaPlus size={14} /> Add Market
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('location')}
              >
                Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('is_active')}
              >
                Status {sortField === 'is_active' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map((market) => (
                <tr key={market.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{market.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{market.location || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <div className="h-12 w-12 relative">
                        <Image
                          src={market.image_url || '/images/ariaria-market.png'}
                          alt={market.name}
                          className="object-cover rounded"
                          fill
                          sizes="48px"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(market.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        market.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {market.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/markets/${market.id}`}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <FaEye size={18} />
                      </Link>
                      <button
                        onClick={() => onEdit(market)}
                        className="text-indigo-500 hover:text-indigo-700 p-1"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(market)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No markets found matching your search' : 'No markets found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}