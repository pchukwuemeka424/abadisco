'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import BusinessCard from '@/components/BusinessCard';
import React from 'react'; // Add React import to use React.use()

interface Market {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: { title: string; icon_type: string } | null;
  market: { name: string; location: string } | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
}

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  // Use React.use() to unwrap the params object
  const marketId = React.use(params).id;
  
  const [market, setMarket] = useState<Market | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarketAndBusinesses() {
      try {
        setLoading(true);
        // Fetch market details
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .single();

        if (marketError) {
          throw new Error(marketError.message || 'Failed to fetch market details');
        }

        setMarket(marketData);

        // Fetch businesses in this market
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select(`
            *,
            market:markets(name, location),
            category:business_categories(title, icon_type)
          `)
          .eq('market_id', marketId)
          .eq('status', 'active');

        if (businessesError) {
          throw new Error(businessesError.message || 'Failed to fetch businesses');
        }

        setBusinesses(businessesData || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMarketAndBusinesses();
  }, [marketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-6">
            <h3 className="text-lg font-medium">Error loading market details</h3>
            <p>{error || 'Market not found'}</p>
            <Link href="/markets" className="mt-4 inline-block text-blue-600 hover:underline">
              Return to Markets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Market Header */}
      <div className="relative w-full h-80">
        <Image
          src={market.image_url || '/images/ariaria-market.png'}
          alt={market.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{market.name}</h1>
          <p className="text-xl text-gray-200">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            {market.location || 'Aba, Abia State'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Market Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {market.name}</h2>
          <p className="text-gray-700">
            {market.description || `${market.name} is one of Aba's vibrant marketplaces, known for its wide variety of products and services. Located in ${market.location || 'Aba'}, it serves as a major commercial hub for traders and shoppers alike.`}
          </p>
        </div>

        {/* Businesses in this market */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Businesses in {market.name}</h2>
          
          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business, index) => (
                <BusinessCard key={business.id} business={business} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No businesses found</h3>
              <p className="text-gray-500">There are currently no registered businesses in this market.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Link href="/markets" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors duration-200">
            Back to All Markets
          </Link>
        </div>
      </div>
    </div>
  );
}