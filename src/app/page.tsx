"use client";

import { SearchBar } from '@/components/SearchBar';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

// Define TypeScript interfaces for our data models
interface BusinessCategory {
  title: string;
  description: string;
  image_path: string;
  icon_type: string;
  count?: number;
  link_path: string;
}

interface FeaturedBusiness {
  name: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  highlights: string[];
}

interface HeroContent {
  title: string;
  subtitle: string;
  background_image: string;
  tagline: string;
}

interface FooterCategory {
  title: string;
  link: string;
}

// TypeScript declaration for JSX element
declare namespace JSX {
  interface Element {}
}

// Icons mapping for categories - this converts icon_type from database to JSX icons
const iconMapping: Record<string, React.ReactNode> = {
  "shopping-bag": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
    </svg>
  ),
  "fabric": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
    </svg>
  ),
  "book-open": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    </svg>
  ),
  "desktop-computer": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    </svg>
  ),
  "office-building": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
    </svg>
  ),
  "user": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>
  ),
  "briefcase": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 011-1h8a1 1 0 011 1v1h2a2 2 0 012 2v13a2 2 0 01-2 2z"></path>
    </svg>
  ),
  "photograph": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
  )
};

export default function Home() {
  const [featuredBusinesses, setFeaturedBusinesses] = useState<FeaturedBusiness[]>([]);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: "Discover City of Aba",
    subtitle: "Eastern Nigeria's commercial hub with vibrant markets, skilled craftsmanship, and rich cultural experiences",
    background_image: "/images/ariaria-market.png",
    tagline: "EASTERN NIGERIA'S COMMERCIAL HUB"
  });
  const [ctaImage, setCtaImage] = useState<string>("/images/Cemetery Market.jpeg");
  const [footerCategories, setFooterCategories] = useState<FooterCategory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [heroLoading, setHeroLoading] = useState(true);
  const [footerLoading, setFooterLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);

  // Fetch site configuration for hero section
  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        setHeroLoading(true);
        const { data, error } = await supabase
          .from('site_configuration')
          .select('*')
          .eq('section', 'hero')
          .single();
        
        if (error) {
          // If table doesn't exist or no hero config found, we'll use the default state values
          console.log("No hero configuration found, using defaults");
          return;
        }

        if (data) {
          setHeroContent({
            title: data.title || heroContent.title,
            subtitle: data.subtitle || heroContent.subtitle,
            background_image: data.background_image || heroContent.background_image,
            tagline: data.tagline || heroContent.tagline
          });
        }
      } catch (err: any) {
        console.error("Error fetching hero content:", err);
        setHeroError(err.message || 'An error occurred');
      } finally {
        setHeroLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  // Fetch business categories from database
  useEffect(() => {
    const fetchBusinessCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data, error } = await supabase
          .from('business_categories')
          .select('*')
          .order('title');
        
        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setBusinessCategories(data);
        } else {
          setCategoriesError('No business categories found');
        }
      } catch (err: any) {
        console.error("Error fetching business categories:", err);
        setCategoriesError(err.message || 'An error occurred');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchBusinessCategories();
  }, []);

  // Fetch featured businesses with their highlights (now: fetch featured markets only from markets table)
  useEffect(() => {
    const fetchFeaturedMarkets = async () => {
      try {
        setLoading(true);
        // Fetch from the markets table
        const { data: marketsData, error: marketsError } = await supabase
          .from('markets')
          .select('id, name, location, description, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (marketsError) {
          throw marketsError;
        }

        if (marketsData && marketsData.length > 0) {
          const transformedData = marketsData.map(market => ({
            name: market.name,
            category: "Market",
            rating: 4.7, // Placeholder, replace with real rating if available
            reviews: Math.floor(Math.random() * 300) + 100, // Placeholder, replace with real reviews if available
            image: market.image_url || "/images/ariaria-market.png",
            highlights: [
              market.location || "Aba, Abia State",
              market.description?.split('.')[0] || "Popular market in Aba",
              "Visit for quality products"
            ]
          }));
          setFeaturedBusinesses(transformedData);
        } else {
          setFeaturedBusinesses([]);
        }
      } catch (err: any) {
        console.error("Error fetching featured markets:", err);
        setError(err.message || 'An error occurred');
        setFeaturedBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMarkets();
  }, []);

  // Fetch footer categories from business_categories
  useEffect(() => {
    const fetchFooterCategories = async () => {
      try {
        setFooterLoading(true);
        const { data, error } = await supabase
          .from('business_categories')
          .select('title, link_path')
          .limit(4);
        
        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const categories = data.map(cat => ({
            title: cat.title,
            link: cat.link_path
          }));
          setFooterCategories(categories);
        } else {
          // Fallback
          setFooterCategories([
            { title: "Markets", link: "/markets" },
            { title: "Restaurants", link: "/search?category=restaurants" },
            { title: "Hotels & Accommodation", link: "/search?category=hotels" },
            { title: "Fashion & Textiles", link: "/search?category=fashion" }
          ]);
        }
      } catch (err: any) {
        console.error("Error fetching footer categories:", err);
        setFooterError(err.message || 'An error occurred');
        // Fallback
        setFooterCategories([
          { title: "Markets", link: "/markets" },
          { title: "Restaurants", link: "/search?category=restaurants" },
          { title: "Hotels & Accommodation", link: "/search?category=hotels" },
          { title: "Fashion & Textiles", link: "/search?category=fashion" }
        ]);
      } finally {
        setFooterLoading(false);
      }
    };

    fetchFooterCategories();
  }, []);

  // Also fetch a random image for the CTA background
  useEffect(() => {
    const fetchCtaImage = async () => {
      try {
        const { data, error } = await supabase
          .from('business_categories')
          .select('image_path')
          .limit(5);
        
        if (error || !data || data.length === 0) {
          return; // Keep the default
        }

        // Pick a random image from the results
        const randomIndex = Math.floor(Math.random() * data.length);
        setCtaImage(data[randomIndex].image_path);
      } catch (err) {
        console.error("Error fetching CTA image:", err);
        // Keep using the default image
      }
    };

    fetchCtaImage();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section with Fixed Height Instead of Full Screen */}
      <section className="relative overflow-hidden h-[600px] md:h-[700px]">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0 z-0">
          <div className="relative h-full w-full">
            <Image
              src={heroContent.background_image}
              alt="Ariaria Market Aerial View"
              fill
              priority
              className="object-cover scale-110 transform transition-transform duration-10000 animate-subtle-zoom"
              quality={100}
            />
          </div>
          {/* Advanced Gradient Overlay with Multiple Layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/70 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-transparent mix-blend-overlay z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)] z-10" />
          
          {/* Animated Particles/Pattern Overlay */}
          <div className="absolute inset-0 z-10 opacity-30 mix-blend-soft-light" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.7" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="1"/%3E%3Ccircle cx="13" cy="13" r="1"/%3E%3C/g%3E%3C/svg%3E")' }}>
          </div>
        </div>

        {/* Navbar - Updated to make it clickable */}
        <div className="relative z-40">
          <Navbar />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-block mb-4">
              <span className="bg-red-500/30 text-white px-4 py-1 rounded-full text-sm font-medium tracking-wide text-shadow-sm">
                {heroContent.tagline}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight animate-fade-in text-shadow-md">
              {heroContent.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto animate-fade-in-delay-1 text-shadow-sm">
              {heroContent.subtitle}
            </p>
            
            <div className="w-full max-w-2xl mx-auto mb-10 animate-fade-in-delay-2">
              <SearchBar />
            </div>
            
            {/* Scroll Down Indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Aba by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover the diverse commercial ecosystem that makes Aba the manufacturing powerhouse of Eastern Nigeria</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : categoriesError ? (
            <div className="text-center text-red-500">
              <p>Failed to load categories. Please try again later.</p>
            </div>
          ) : (
            <Slider 
              slidesToShow={3} 
              slidesToScroll={1} 
              autoplay={true} 
              autoplaySpeed={3000}
              responsive={[
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 640,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  }
                }
              ]}
              className="mx-4 md:mx-8"
            >
              {businessCategories.map((category, index) => (
                <Link href={category.link_path} key={index} className="group px-3">
                  <div className="relative h-80 overflow-hidden rounded-xl shadow-lg transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
                    <Image
                      src={category.image_path}
                      alt={category.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="bg-red-500/20 p-3 rounded-full w-fit mb-3">
                        {iconMapping[category.icon_type]}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{category.title}</h3>
                      <p className="text-white text-shadow-sm mb-4">{category.description}</p>
                      <div className="flex items-center text-white font-semibold">
                        <span>Explore</span>
                        <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </Slider>
          )}
        </div>
      </section>
      
      {/* Featured Businesses Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Markets</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover top-rated markets that showcase the best Aba has to offer</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p>Failed to load markets. Please try again later.</p>
            </div>
          ) : featuredBusinesses.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No markets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBusinesses.map((business, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-48">
                    <Image
                      src={business.image}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {business.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{business.name}</h3>
                    <div className="flex items-center mb-4">
                      <div className="flex items-center text-red-500">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < Math.floor(business.rating) ? 'text-red-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">{business.rating} ({business.reviews} reviews)</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {business.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600 text-sm">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/markets" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
              View All Markets
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gray-900 z-0">
          <Image
            src={ctaImage} 
            alt="Aba Market"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to explore Aba?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Discover the perfect businesses, services, and products that Aba has to offer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/markets" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              Explore Markets
            </Link>
            <Link href="/search" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition-colors">
              Search Businesses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Aba City Guide</h3>
              <p className="text-gray-400">Your ultimate guide to Eastern Nigeria's commercial hub.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                {footerCategories.map((category, index) => (
                  <li key={index}>
                    <Link href={category.link} className="hover:text-red-400 transition-colors">
                      {category.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
         
            <div>
              <h4 className="font-semibold mb-3">Connect With Us</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
              <p className="text-gray-400 text-sm">© 2025 Aba City Guide. All rights reserved.</p>
              <p className="text-gray-400 text-xs mt-2">Designed by Acehub Technology Ltd UK</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-fade-in-delay-1 {
          opacity: 0;
          animation: fadeIn 1s ease-out 0.3s forwards;
        }
        
        .animate-fade-in-delay-2 {
          opacity: 0;
          animation: fadeIn 1s ease-out 0.6s forwards;
        }
        
        .animate-fade-in-delay-3 {
          opacity: 0;
          animation: fadeIn 1s ease-out 0.9s forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 1s ease-out forwards;
        }

        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite ease-in-out;
        }
      `}</style>
    </main>
  );
}
