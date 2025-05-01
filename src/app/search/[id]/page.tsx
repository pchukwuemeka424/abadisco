"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaPhone, FaGlobe, FaCheckCircle, FaWhatsapp, FaFacebook, FaInstagram } from 'react-icons/fa';
import TopNavbar from '@/components/TopNavbar';

// Define proper types for businesses and products
interface Business {
  id: string;
  name: string;
  description: string | null;
  market_id: string | null;
  category_id: number | null;
  owner_id: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  logo_url: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  created_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  services: any | null;
  business_type: string | null;
  whatsapp: string | null;
  role: string | null;
  markets?: { 
    id: string;
    name: string;
    location: string | null;
  };
  categories?: { 
    id: number;
    name: string;
  };
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
  const businessId = params.id;
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if ID is not provided
        if (!businessId) {
          setError('No business ID provided');
          setLoading(false);
          return;
        }

        // Fetch business data from businesses table
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select(`
            *,
            markets:market_id(id, name, location),
            categories:category_id(id, name)
          `)
          .eq('id', businessId)
          .single();

        if (businessError) {
          console.error('Error fetching business:', businessError.message, businessError.details);
          setError(businessError.message);
          throw businessError;
        }

        if (businessData) {
          console.log('Business data found:', businessData.id);
          setBusiness(businessData);

          // Fetch products for this business
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', businessId);

          if (productsError) {
            console.error('Error fetching products:', productsError.message, productsError.details);
          }
          
          setProducts(productsData || []);
        } else {
          setError('No business data found');
          console.error('No business data found');
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
        if (error instanceof Error) {
          setError(error.message);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="flex justify-center items-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          <span className="ml-3 text-gray-700">Loading business details...</span>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Business Not Found</h1>
              <p className="text-gray-600 mb-6">
                {error || "The business you're looking for doesn't exist or has been removed."}
              </p>
              <div className="flex justify-center">
                <Link 
                  href="/search" 
                  className="px-5 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm"
                >
                  Back to Search
                </Link>
              </div>
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
      <div className="bg-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-rose-600 transition-colors">Home</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/search" className="text-gray-500 hover:text-rose-600 transition-colors">Search</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-rose-600 font-medium truncate">{business.name}</li>
            </ol>
          </nav>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0 rounded-lg overflow-hidden shadow-md">
              {business.logo_url ? (
                <Image 
                  src={business.logo_url} 
                  alt={business.name} 
                  fill
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                  <span className="text-rose-500 text-2xl font-bold">{business.name?.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
            
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                {business.status === 'verified' && (
                  <span className="ml-2 text-rose-500" title="Verified Business">
                    <FaCheckCircle />
                  </span>
                )}
              </div>
              
              {business.business_type && (
                <div className="mt-1 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                    {business.business_type}
                  </span>
                </div>
              )}
              
              <p className="text-gray-600 mb-5">{business.description || 'No description available'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                {business.contact_phone && (
                  <div className="flex items-center text-gray-700">
                    <FaPhone className="h-4 w-4 text-rose-500 mr-2" />
                    <a href={`tel:${business.contact_phone}`} className="hover:text-rose-600 transition-colors">
                      {business.contact_phone}
                    </a>
                  </div>
                )}
                
                {business.whatsapp && (
                  <div className="flex items-center text-gray-700">
                    <FaWhatsapp className="h-4 w-4 text-rose-500 mr-2" />
                    <a 
                      href={`https://wa.me/${business.whatsapp.replace(/\+/g, '').replace(/\s/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-rose-600 transition-colors"
                    >
                      {business.whatsapp}
                    </a>
                  </div>
                )}
                
                {business.contact_email && (
                  <div className="flex items-center text-gray-700">
                    <svg className="h-4 w-4 text-rose-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${business.contact_email}`} className="hover:text-rose-600 transition-colors">
                      {business.contact_email}
                    </a>
                  </div>
                )}
                
                {business.address && (
                  <div className="flex items-center text-gray-700">
                    <FaMapMarkerAlt className="h-4 w-4 text-rose-500 mr-2 flex-shrink-0" />
                    <span>{business.address}</span>
                  </div>
                )}
                
                {business.markets && (
                  <div className="flex items-center text-gray-700">
                    <svg className="h-4 w-4 text-rose-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>
                      {business.markets.name}
                      {business.markets.location && ` - ${business.markets.location}`}
                    </span>
                  </div>
                )}
                
                {business.categories && (
                  <div className="flex items-center text-gray-700">
                    <svg className="h-4 w-4 text-rose-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{business.categories.name}</span>
                  </div>
                )}
              </div>
              
              {/* Social Media Links */}
              <div className="flex mt-5 space-x-4">
                {business.website && (
                  <a 
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-rose-500 transition-colors"
                    aria-label="Website"
                  >
                    <FaGlobe className="h-5 w-5" />
                  </a>
                )}
                
                {business.facebook && (
                  <a 
                    href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-rose-500 transition-colors"
                    aria-label="Facebook"
                  >
                    <FaFacebook className="h-5 w-5" />
                  </a>
                )}
                
                {business.instagram && (
                  <a 
                    href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-rose-500 transition-colors"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="h-5 w-5" />
                  </a>
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
                  ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products & Services
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-4 px-1 ${
                activeTab === 'about'
                  ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-4 px-1 ${
                activeTab === 'contact'
                  ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contact
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
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-600">
                          ₦{product.price.toLocaleString()}
                        </span>
                        <button className="px-3 py-1 text-sm text-rose-500 border border-rose-500 rounded hover:bg-rose-50 transition-colors">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-gray-600 mt-4">No products or services listed yet.</p>
                <p className="text-sm text-gray-500 mt-2">This business hasn't added any products or services to their profile.</p>
              </div>
            )}

            {/* Services section if services data is available */}
            {business.services && Object.keys(business.services).length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(business.services) ? (
                      business.services.map((service, index) => (
                        <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                          {typeof service === 'string' ? service : JSON.stringify(service)}
                        </span>
                      ))
                    ) : typeof business.services === 'object' ? (
                      Object.entries(business.services).map(([key, value], index) => (
                        <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                          {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600">No structured services information available</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">About {business.name}</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  {business.description || `${business.name} is a business located in ${business.markets ? business.markets.name : 'Aba'}.`}
                </p>
                
                {business.business_type && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Type of Business</h3>
                    <p className="text-gray-700">{business.business_type}</p>
                  </div>
                )}
                
                {business.markets && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Location & Category</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Market: {business.markets.name} {business.markets.location ? `(${business.markets.location})` : ''}</span>
                      </li>
                      {business.categories && (
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>Category: {business.categories.name}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                <p>Business registered on {new Date(business.created_at).toLocaleDateString()}</p>
                <p className="flex items-center mt-1">
                  Status: 
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    business.status === 'active' || business.status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : business.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab Content */}
        {activeTab === 'contact' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact {business.name}</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <ul className="space-y-4">
                    {business.contact_phone && (
                      <li className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                            <FaPhone className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">Phone</h4>
                          <a href={`tel:${business.contact_phone}`} className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors">
                            {business.contact_phone}
                          </a>
                        </div>
                      </li>
                    )}
                    
                    {business.whatsapp && (
                      <li className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                            <FaWhatsapp className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">WhatsApp</h4>
                          <a 
                            href={`https://wa.me/${business.whatsapp.replace(/\+/g, '').replace(/\s/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors"
                          >
                            {business.whatsapp}
                          </a>
                        </div>
                      </li>
                    )}
                    
                    {business.contact_email && (
                      <li className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">Email</h4>
                          <a href={`mailto:${business.contact_email}`} className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors">
                            {business.contact_email}
                          </a>
                        </div>
                      </li>
                    )}
                    
                    {business.address && (
                      <li className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                            <FaMapMarkerAlt className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">Address</h4>
                          <p className="mt-1 text-sm text-gray-600">{business.address}</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Online Presence</h3>
                  
                  {(business.website || business.facebook || business.instagram) ? (
                    <ul className="space-y-4">
                      {business.website && (
                        <li className="flex">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                              <FaGlobe className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Website</h4>
                            <a 
                              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors"
                            >
                              {business.website}
                            </a>
                          </div>
                        </li>
                      )}
                      
                      {business.facebook && (
                        <li className="flex">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                              <FaFacebook className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                            <a 
                              href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors"
                            >
                              Facebook Page
                            </a>
                          </div>
                        </li>
                      )}
                      
                      {business.instagram && (
                        <li className="flex">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rose-100 text-rose-600">
                              <FaInstagram className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Instagram</h4>
                            <a 
                              href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-gray-600 hover:text-rose-600 transition-colors"
                            >
                              Instagram Profile
                            </a>
                          </div>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No online presence information available.</p>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Business Hours</h4>
                    <p className="text-sm text-gray-600">Business hours not specified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Back to search button */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center">
        <Link 
          href="/search" 
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Search Results
        </Link>
      </div>
    </div>
  );
}