"use client";
import React, { useEffect, useState, use } from 'react';
import { supabase } from '../../../supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaPhone, FaGlobe, FaCheckCircle, FaWhatsapp, 
  FaFacebook, FaInstagram, FaTv, FaGamepad, FaLaptop, FaMicrochip, 
  FaTools, FaHeadphones, FaChevronLeft, FaStar, FaRegCalendarAlt } from 'react-icons/fa';


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
    title: string;
  };
  [key: string]: unknown;
}

interface Product {
  id: string;
  user_id: string;
  created_at: string;
  image_urls?: string;
  title?: string;
  [key: string]: unknown;
}

export default function BusinessPage({ params }: { params: { id: string } }) {
  // Keep existing logic for data fetching and state management
  const unwrappedParams = use(params);
  const businessId = unwrappedParams.id;

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

        console.log('Fetching business with ID:', businessId);

        // Fetch business data from businesses table with related data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select(`
            *,
            markets:market_id(id, name, location),
            categories:category_id(id, title)
          `)
          .eq('id', businessId)
          .single();

        if (businessError) {
          console.error('Error fetching business:', businessError.message, businessError.details);
          setError(businessError.message);
          setLoading(false);
          return;
        }

        if (!businessData) {
          setError('No business found with this ID');
          setLoading(false);
          return;
        }

        console.log('Business data found:', businessData);
        setBusiness(businessData);

        // Now fetch products for this business
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', businessId)
          .order('title', { ascending: true });

        if (productsError) {
          console.error('Error fetching products:', productsError.message);
          // Continue without products - non-fatal error
        } else {
          console.log('Products found:', productsData?.length || 0);
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error('Error in business details fetch:', error);
        if (error instanceof Error) {
          setError(`Failed to load business details: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessId]);

  // Modern loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col">

        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-rose-200 border-opacity-50 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 border-t-4 border-rose-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-rose-500 rounded-full"></div>
              </div>
            </div>
            <p className="mt-6 text-rose-600 font-medium">Loading business details</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the information</p>
          </div>
        </div>
      </div>
    );
  }

  // Modern error screen
  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
     
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <div className="text-center">
              <div className="bg-rose-100 text-rose-500 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-3">Business Not Found</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {error || "The business you're looking for doesn't exist or has been removed."}
              </p>
              <Link 
                href="/search" 
                className="inline-flex items-center px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <FaChevronLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modern business detail page design
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">

      
      {/* Hero section with business cover photo or gradient background */}
      <div className="w-full h-40 md:h-64 bg-gradient-to-r from-rose-400 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0 w-full">
            <path fill="currentColor" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link 
            href="/search" 
            className="flex items-center bg-white bg-opacity-80 backdrop-blur-sm px-4 py-2 rounded-full text-rose-600 hover:bg-opacity-100 shadow-md transition duration-300"
          >
            <FaChevronLeft className="mr-2 h-3 w-3" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </div>
      
      {/* Business profile section - positioned to overlap with hero section */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        {/* Business card with main info */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo - larger and more prominent */}
              <div className="w-32 h-32 md:w-48 md:h-48 relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg border-4 border-white">
                {business.logo_url ? (
                  <Image 
                    src={business.logo_url} 
                    alt={business.name} 
                    fill
                    className="object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{business.name?.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              {/* Business Info - modernized layout */}
              <div className="flex-1 pt-4 md:pt-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">{business.name}</h1>
                  {business.status === 'verified' && (
                    <span className="ml-2 text-rose-500 bg-rose-100 p-1 rounded-full" title="Verified Business">
                      <FaCheckCircle className="h-5 w-5" />
                    </span>
                  )}
                  
                  {business.business_type && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 ml-auto">
                      {business.business_type}
                    </span>
                  )}
                </div>
                
                {/* Category and location badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {business.categories && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {business.categories.title}
                    </span>
                  )}
                  
                  {business.markets && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {business.markets.name}
                      {business.markets.location && ` - ${business.markets.location}`}
                    </span>
                  )}
                  
                  {business.status && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      business.status === 'active' || business.status === 'verified' 
                        ? 'bg-green-50 text-green-700' 
                        : business.status === 'pending' 
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <FaStar className="mr-1 h-3 w-3" />
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </span>
                  )}
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                    <FaRegCalendarAlt className="mr-1 h-3 w-3" />
                    Joined {new Date(business.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                
                {/* Description - cleaner presentation */}
                <div className="mt-5 prose prose-rose max-w-none">
                  <p className="text-gray-700">
                    {business.description || `${business.name} is a business located in ${business.markets ? business.markets.name : 'Aba'}.`}
                  </p>
                </div>
                
                {/* Quick contact/info row */}
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {business.contact_phone && (
                    <a href={`tel:${business.contact_phone}`} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                        <FaPhone className="h-3 w-3 text-rose-600" />
                      </div>
                      <span className="text-sm text-gray-600 truncate">{business.contact_phone}</span>
                    </a>
                  )}
                  
                  {business.contact_email && (
                    <a href={`mailto:${business.contact_email}`} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 truncate">{business.contact_email.substring(0, 15)}...</span>
                    </a>
                  )}
                  
                  {business.whatsapp && (
                    <a 
                      href={`https://wa.me/${business.whatsapp.replace(/\+/g, '').replace(/\s/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <FaWhatsapp className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-600 truncate">WhatsApp</span>
                    </a>
                  )}
                  
                  {business.address && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <FaMapMarkerAlt className="h-3 w-3 text-amber-600" />
                      </div>
                      <span className="text-sm text-gray-600 truncate">{business.address}</span>
                    </div>
                  )}
                </div>
                
                {/* Social media links - more modern style */}
                <div className="mt-5 flex gap-3">
                  {business.website && (
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-rose-500 hover:bg-rose-50 border border-gray-200 transition-all duration-300"
                      aria-label="Website"
                    >
                      <FaGlobe className="h-4 w-4" />
                    </a>
                  )}
                  
                  {business.facebook && (
                    <a 
                      href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-all duration-300"
                      aria-label="Facebook"
                    >
                      <FaFacebook className="h-4 w-4" />
                    </a>
                  )}
                  
                  {business.instagram && (
                    <a 
                      href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-pink-600 hover:bg-pink-50 border border-gray-200 transition-all duration-300"
                      aria-label="Instagram"
                    >
                      <FaInstagram className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Modern tab navigation */}
          <div className="px-6 border-t border-gray-100">
            <div className="flex overflow-x-auto hide-scrollbar pt-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-5 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'products'
                    ? 'text-rose-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products & Services
                {activeTab === 'products' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-lg"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-5 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'about'
                    ? 'text-rose-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                About
                {activeTab === 'about' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-lg"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-5 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'contact'
                    ? 'text-rose-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Contact
                {activeTab === 'contact' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-lg"></span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab content with modern styling */}
        <div className="mt-6 mb-10">
          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              {products.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        {product.image_urls ? (
                          <Image 
                            src={product.image_urls.split(',')[0]} 
                            alt="Product image" 
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-50">
                            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services section with modern styling */}
              {business.services && business.services.service_list && Array.isArray(business.services.service_list) && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="bg-rose-100 text-rose-600 p-1.5 rounded-lg mr-3">
                      <FaTools className="h-4 w-4" />
                    </span>
                    Services Offered
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {business.services.service_list.map((service, index) => {
                      // Assign appropriate icons based on service type
                      let Icon = FaTools; // Default icon
                      let bgColor = "from-blue-50 to-blue-100";
                      let textColor = "text-blue-700";
                      
                      if (service.includes('TV') || service.includes('Home Theater')) {
                        Icon = FaTv;
                        bgColor = "from-purple-50 to-purple-100";
                        textColor = "text-purple-700";
                      } else if (service.includes('Gaming')) {
                        Icon = FaGamepad;
                        bgColor = "from-pink-50 to-pink-100";
                        textColor = "text-pink-700";
                      } else if (service.includes('Computer') || service.includes('Laptop')) {
                        Icon = FaLaptop;
                        bgColor = "from-cyan-50 to-cyan-100";
                        textColor = "text-cyan-700";
                      } else if (service.includes('Electronic') || service.includes('Component')) {
                        Icon = FaMicrochip;
                        bgColor = "from-amber-50 to-amber-100";
                        textColor = "text-amber-700";
                      } else if (service.includes('Repair')) {
                        Icon = FaTools;
                        bgColor = "from-emerald-50 to-emerald-100";
                        textColor = "text-emerald-700";
                      } else if (service.includes('Audio')) {
                        Icon = FaHeadphones;
                        bgColor = "from-rose-50 to-rose-100";
                        textColor = "text-rose-700";
                      }
                      
                      return (
                        <div key={index} className={`flex items-center p-4 rounded-xl bg-gradient-to-br ${bgColor} shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}>
                          <div className="mr-4">
                            <div className={`w-12 h-12 rounded-full bg-white shadow-inner flex items-center justify-center ${textColor}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <div>
                            <p className={`font-medium ${textColor}`}>{service}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Empty state with modern design */}
              {products.length === 0 && !(business.services && business.services.service_list && Array.isArray(business.services.service_list)) && (
                <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-100">
                  <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-50 rounded-full text-gray-400 mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products or services yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">This business hasn't added any products or services to their profile.</p>
                </div>
              )}
            </div>
          )}

          {/* About Tab Content - modernized */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mr-3">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  About {business.name}
                </h2>
                
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl mb-6">
                  <p className="text-gray-700">
                    {business.description || `${business.name} is a business located in ${business.markets ? business.markets.name : 'Aba'}.`}
                  </p>
                </div>
                
                {business.business_type && (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl mb-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Type of Business
                    </h3>
                    <p className="text-blue-700 font-medium">{business.business_type}</p>
                  </div>
                )}
                
                {(business.markets || business.categories) && (
                  <div className="p-6 bg-gradient-to-br from-rose-50 to-white rounded-xl">
                    <h3 className="text-lg font-medium text-rose-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location & Category
                    </h3>
                    
                    <div className="space-y-4">
                      {business.markets && (
                        <div className="flex items-start p-3 bg-white rounded-lg shadow-sm">
                          <svg className="h-5 w-5 text-rose-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <div>
                            <span className="font-medium text-gray-900">Market:</span> 
                            <span className="text-gray-700">{business.markets.name} {business.markets.location ? `(${business.markets.location})` : ''}</span>
                          </div>
                        </div>
                      )}
                      
                      {business.categories && (
                        <div className="flex items-start p-3 bg-white rounded-lg shadow-sm">
                          <svg className="h-5 w-5 text-rose-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <div>
                            <span className="font-medium text-gray-900">Category:</span> 
                            <span className="text-gray-700">{business.categories.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Tab Content - modern design */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="bg-rose-100 text-rose-600 p-1.5 rounded-lg mr-3">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Contact {business.name}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Information - card layout */}
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Contact Information
                    </h3>
                    
                    <div className="space-y-6">
                      {business.contact_phone && (
                        <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-rose-100 text-rose-600">
                              <FaPhone className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Phone</h4>
                            <a href={`tel:${business.contact_phone}`} className="mt-1 text-base text-rose-600 hover:text-rose-700 transition-colors font-medium">
                              {business.contact_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {business.whatsapp && (
                        <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 text-green-600">
                              <FaWhatsapp className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">WhatsApp</h4>
                            <a 
                              href={`https://wa.me/${business.whatsapp.replace(/\+/g, '').replace(/\s/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-base text-green-600 hover:text-green-700 transition-colors font-medium"
                            >
                              {business.whatsapp}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {business.contact_email && (
                        <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Email</h4>
                            <a href={`mailto:${business.contact_email}`} className="mt-1 text-base text-blue-600 hover:text-blue-700 transition-colors font-medium break-all">
                              {business.contact_email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {business.address && (
                        <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 text-amber-600">
                              <FaMapMarkerAlt className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Address</h4>
                            <p className="mt-1 text-base text-gray-700">{business.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Online Presence - modern cards */}
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Online Presence
                    </h3>
                    
                    {(business.website || business.facebook || business.instagram) ? (
                      <div className="space-y-6">
                        {business.website && (
                          <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600">
                                <FaGlobe className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">Website</h4>
                              <a 
                                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-base text-indigo-600 hover:text-indigo-700 transition-colors font-medium break-all"
                              >
                                {business.website}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {business.facebook && (
                          <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                                <FaFacebook className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                              <a 
                                href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-base text-blue-600 hover:text-blue-700 transition-colors font-medium"
                              >
                                Facebook Page
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {business.instagram && (
                          <div className="flex p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-pink-100 text-pink-600">
                                <FaInstagram className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">Instagram</h4>
                              <a 
                                href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-base text-pink-600 hover:text-pink-700 transition-colors font-medium"
                              >
                                Instagram Profile
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-dashed border-gray-300">
                        <div className="text-center">
                          <svg className="h-10 w-10 mx-auto text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <p className="mt-2 text-gray-500">No online presence information available</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Business Hours
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Business hours not specified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}