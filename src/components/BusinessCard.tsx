'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BusinessProps {
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

export default function BusinessCard({ business, index = 0 }: { business: BusinessProps; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      <div className="relative h-48 w-full">
        <Image
          src={business.logo_url || '/images/phonepicutres-TA.webp'}
          alt={business.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1 line-clamp-1">{business.name}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          {business.category && (
            <span className="flex items-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {business.category.title}
            </span>
          )}
          
          {business.market && (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {business.market.name}
            </span>
          )}
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-2">
          {business.description || 'No description available.'}
        </p>
        
        {business.contact_phone && (
          <p className="text-sm text-gray-600 mb-1 line-clamp-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {business.contact_phone}
          </p>
        )}
        
        <Link 
          href={`/search/${business.id}`} 
          className="mt-4 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}