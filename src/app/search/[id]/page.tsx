"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaPhone, FaGlobe, FaCheckCircle, FaStar, FaRegStar } from 'react-icons/fa';
import TopNavbar from '@/components/TopNavbar';

// Define proper types for businesses and products
interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website?: string;
  email?: string;
  logo_url?: string;
  is_verified: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  business_id: string;
  image_url?: string;
  [key: string]: unknown;
}

export default function BusinessPage({ params }: { params: { id: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      setLoading(true);
      try {
        // Check if ID is not provided
        if (!params.id) {
          return <div className="p-6">No business ID found. Please <Link href="/search">return to search</Link> and try again.</div>;
        }

        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', params.id)
          .single();

        if (businessError) throw businessError;

        if (businessData) {
          setBusiness(businessData);

          // Fetch products for this business
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', params.id);

          if (productsError) throw productsError;
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="flex justify-center items-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-center mb-4">Business Not Found</h1>
            <p className="text-gray-600 text-center">
              The business you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <div className="flex justify-center mt-6">
              <Link href="/search" className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      
      {/* Business Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="w-24 h-24 relative flex-shrink-0">
              {business.logo_url ? (
                <Image 
                  src={business.logo_url} 
                  alt={business.name} 
                  width={96} 
                  height={96}
                  className="rounded-lg object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-lg">{business.name?.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
            
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">{business.name}</h1>
                {business.is_verified && (
                  <span className="ml-2 text-blue-500" title="Verified Business">
                    <FaCheckCircle />
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-3">{business.description}</p>
              <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm">
                {business.address && (
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{business.address}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="mr-1" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center text-gray-600">
                    <FaGlobe className="mr-1" />
                    <Link 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Visit Website
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-4 px-1 ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products & Services
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-4 px-1 ${
                activeTab === 'gallery'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-4 px-1 ${
                activeTab === 'about'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
          </nav>
        </div>

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Products & Services</h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {product.image_url ? (
                      <div className="h-48 relative">
                        <Image 
                          src={product.image_url} 
                          alt={product.name} 
                          fill
                          className="object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-600">
                          ₦{product.price.toLocaleString()}
                        </span>
                        <button className="px-3 py-1 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-50">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600">No products or services listed yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab Content */}
        {activeTab === 'gallery' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Business Gallery</h2>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">Gallery photos will be available soon.</p>
            </div>
          </div>
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">About this Business</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Business Description</h3>
              <p className="text-gray-600 mb-4">{business.description}</p>
              
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <ul className="text-gray-600 space-y-2">
                {business.address && (
                  <li className="flex items-start">
                    <FaMapMarkerAlt className="mr-2 mt-1 text-gray-500" />
                    <span>{business.address}</span>
                  </li>
                )}
                {business.phone && (
                  <li className="flex items-start">
                    <FaPhone className="mr-2 mt-1 text-gray-500" />
                    <span>{business.phone}</span>
                  </li>
                )}
                {business.email && (
                  <li className="flex items-start">
                    <span className="mr-2">📧</span>
                    <span>{business.email}</span>
                  </li>
                )}
                {business.website && (
                  <li className="flex items-start">
                    <FaGlobe className="mr-2 mt-1 text-gray-500" />
                    <Link 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {business.website}
                    </Link>
                  </li>
                )}
              </ul>
              
              {business.created_at && (
                <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                  <p>Business registered on {new Date(business.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}