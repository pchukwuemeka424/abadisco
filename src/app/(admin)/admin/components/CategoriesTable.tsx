'use client';

import { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaSyncAlt } from 'react-icons/fa';
import Image from 'next/image';
import { format } from 'date-fns';

export interface Category {
  id: number;
  title: string;
  description: string;
  image_path: string;
  icon_type: string;
  count: number;
  link_path: string;
  total_businesses: number;
  total_views: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

interface CategoriesTableProps {
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  refreshData: () => void;
  categories: Category[];
  isLoading: boolean;
}

export default function CategoriesTable({
  onEdit,
  onDelete,
  refreshData,
  categories,
  isLoading,
}: CategoriesTableProps) {
  const [sortField, setSortField] = useState<keyof Category>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Category) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => {
    if (a[sortField] < b[sortField]) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (a[sortField] > b[sortField]) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Rest of the component remains unchanged
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold text-gray-800">Business Categories</h2>
        <button
          onClick={refreshData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          disabled={isLoading}
        >
          <FaSyncAlt className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('title')}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('count')}
              >
                Businesses {sortField === 'count' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('total_views')}
              >
                Views {sortField === 'total_views' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : sortedCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              sortedCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{category.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={category.description}>
                        {category.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {category.image_path ? (
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          src={category.image_path}
                          alt={category.title}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.total_businesses || category.count || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.total_views || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.created_at ? format(new Date(category.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(category)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash size={18} />
                      </button>
                      <a
                        href={`/markets?category=${category.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaEye size={18} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}