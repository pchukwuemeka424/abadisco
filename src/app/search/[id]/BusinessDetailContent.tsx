"use client";
import React from 'react';
import Link from 'next/link';

export default function BusinessDetailContent({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/search"
          className="inline-flex items-center text-red-600 hover:text-red-800 mb-6"
        >
          ← Back to Search
        </Link>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Details</h1>
          <p className="text-gray-600">Business ID: {params.id}</p>
          <p className="text-gray-600 mt-4">
            This page will display detailed information about the business.
          </p>
        </div>
      </div>
    </div>
  );
}