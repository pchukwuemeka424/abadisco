'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Market {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  created_at: string;
}

export default function MarketsList() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        const response = await fetch('/api/markets');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch markets');
        }
        
        const data = await response.json();
        setMarkets(data);
      } catch (err) {
        console.error('Error fetching markets:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-6">
        <h3 className="text-lg font-medium">Error loading markets</h3>
        <p>{error}</p>
        <p className="mt-2 text-sm">Please ensure the markets_table.sql script has been run on your database.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {markets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative h-48 w-full">
              <Image
                src={market.image_url || '/images/ariaria-market.png'}
                alt={market.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold mb-2">{market.name}</h3>
              <p className="text-gray-600 mb-3">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </span>
                {market.location || 'Aba, Abia State'}
              </p>
              <p className="text-gray-700 mb-4 line-clamp-3">
                {market.description || 'One of Aba\'s vibrant marketplaces offering a wide variety of goods and services.'}
              </p>
              <Link 
                href={`/markets/${market.id}`} 
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
              >
                Explore Market
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
      
      {markets.length === 0 && !loading && !error && (
        <div className="text-center py-10">
          <h3 className="text-xl font-medium text-gray-700">No markets found</h3>
          <p className="text-gray-500 mt-2">There are currently no markets available.</p>
        </div>
      )}
    </div>
  );
}