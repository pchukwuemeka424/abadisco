'use client';

import { useState } from 'react';

const categories = [
  'All',
  'Shopping',
  'Food & Dining',
  'Services',
  'Entertainment',
  'Health & Beauty',
  'Education',
  'Sports & Recreation',
  'Real Estate',
  'Automotive',
];

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Categories</h2>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
} 