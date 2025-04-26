import Image from 'next/image';
import { useState } from 'react';

interface Business {
  id: number;
  name: string;
  category: string;
  description: string;
  rating: number;
  image: string;
  address: string;
  price: string;
  status: string;
  reviews: number;
  phone: string;
  business_name: string;
}

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Use a fallback image if business.image is empty, null, or undefined
  const imageSrc = business.image && business.image.trim() !== '' ? business.image : '/images/logo.png';
  
  // Format the rating to display one decimal place if it's not a whole number
  // Handle cases where rating might be null, undefined, or not a number
  const getRating = () => {
    // If rating is null or undefined, return a default value
    if (business.rating == null) return 0;
    
    // Ensure rating is a number
    const ratingNum = Number(business.rating);
    
    // Check if the conversion resulted in a valid number
    if (isNaN(ratingNum)) return 0;
    
    // Format to one decimal if needed
    return Number.isInteger(ratingNum) ? ratingNum : ratingNum.toFixed(1);
  };
  
  const formattedRating = getRating();

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section with Overlay */}
      <div className="relative">
        {/* Main Image */}
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={business.business_name || 'Business name'}
            fill
            className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = '/images/logo.png';
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            business.status === "Now Open" 
              ? "bg-green-500/20 text-green-50 border border-green-500/30" 
              : "bg-red-500/20 text-red-50 border border-red-500/30"
          }`}>
            {business.status}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-sm transition-transform hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
          >
            <svg 
              className={`w-5 h-5 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-gray-800'}`} 
              stroke="currentColor" 
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
          <button 
            className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-sm transition-transform hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Category Tag */}
        <div className="absolute bottom-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-2.5 py-1 rounded-md shadow-sm">
            {business.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          {/* Business name and reviews */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{business.name || business.business_name}</h3>
          </div>

          {/* Rating and Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-md">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm font-semibold text-gray-700">{formattedRating}</span>
                <span className="ml-1 text-xs text-gray-500">({business.reviews || 0})</span>
              </div>
              {business.price && (
                <span className="text-sm font-medium text-gray-700">{business.price}</span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <p className="text-gray-500 text-sm flex items-center">
              <svg
                className="w-4 h-4 mr-1 flex-shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-1">{business.address || 'No address provided'}</span>
            </p>
          </div>

          {/* Short description - optional */}
          {business.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{business.description}</p>
          )}
        </div>

        {/* Call to Action */}
        <button className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white py-2.5 px-4 font-medium transition-all duration-300 hover:shadow-md hover:shadow-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 active:shadow-none">
          <span className="relative z-10">View Details</span>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    </div>
  );
}