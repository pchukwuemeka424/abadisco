import React from 'react';
import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import { Navbar } from '../../components/Navbar';
import Image from 'next/image';
import Footer from '../../components/Footer';

export const metadata: Metadata = generateMetadata({
  title: 'About Aba Traders - Founders Prince Chukwuemeka & Princess Ibekwe Johnson',
  description: 'Learn about Aba Traders, founded by Prince Chukwuemeka and Princess Ibekwe Johnson to showcase Aba\'s vibrant markets and business ecosystem. Discover our mission to connect traders and promote Nigerian commerce.',
  keywords: [
    'About Aba Traders',
    'Prince Chukwuemeka founder',
    'Princess Ibekwe Johnson co-founder',
    'Aba business directory founders',
    'Nigerian entrepreneurs',
    'Aba commerce platform',
    'Eastern Nigeria business',
    'African marketplace founders',
    'Made in Aba initiative',
    'Local business empowerment'
  ],
  url: '/about',
});

const features = [
  {
    title: 'Explore Markets',
    description: 'Discover Aba’s famous markets, stalls, and business districts with detailed guides and photos.',
    icon: '/images/globe.svg',
  },
  {
    title: 'Connect with Businesses',
    description: 'Find, contact, and support local businesses and service providers in just a few clicks.',
    icon: '/images/file.svg',
  },
  {
    title: 'Showcase Products',
    description: 'Business owners can list products and services, reaching a wider digital audience.',
    icon: '/images/window.svg',
  },
  {
    title: 'Stay Updated',
    description: 'Get the latest on trends, events, and opportunities in Aba’s vibrant economy.',
    icon: '/images/vercel.svg',
  },
];

const marketImages = [
  {
    src: '/images/ariaria-market.png',
    alt: 'Ariaria Market',
    caption: 'Ariaria International Market',
  },
  {
    src: '/images/Ahia Ohuru (New Market).webp',
    alt: 'Ahia Ohuru (New Market)',
    caption: 'Ahia Ohuru (New Market)',
  },
  {
    src: '/images/Eziukwu Market.jpg',
    alt: 'Eziukwu Market',
    caption: 'Eziukwu Market',
  },
  {
    src: '/images/Uratta Market.jpeg',
    alt: 'Uratta Market',
    caption: 'Uratta Market',
  },
  {
    src: '/images/RAILWAY .jpeg',
    alt: 'Railway Market',
    caption: 'Railway Market',
  },
  {
    src: '/images/Cemetery Market.jpeg',
    alt: 'Cemetery Market',
    caption: 'Cemetery Market',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-b from-blue-50 to-white text-center animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 md:w-28 md:h-28 mb-2 animate-subtle-zoom">
            <Image src="/images/logo.svg" alt="Aba Traders Logo" width={80} height={80} priority />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-rose-700 mb-2 text-shadow-md">About Aba Traders</h1>
          <p className="max-w-2xl text-lg md:text-xl text-gray-700 mb-4 animate-fade-in-delay-1">
            Aba Traders is your gateway to the vibrant markets and thriving businesses of Aba, Eastern Nigeria's commercial hub. Our mission is to connect traders, entrepreneurs, and customers, making it easy to discover products, services, and opportunities in Aba's bustling economy.
          </p>
        </div>
      </section>

      {/* Market Images Gallery */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-rose-700 mb-6 text-center">Aba’s Famous Markets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {marketImages.map((img, idx) => (
            <div key={img.src} className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow bg-gray-100">
              <Image
                src={img.src}
                alt={img.alt}
                width={400}
                height={260}
                className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300"
                style={{ aspectRatio: '3/2' }}
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3">
                <span className="text-white text-lg font-semibold drop-shadow-lg">{img.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        {features.map((feature, idx) => (
          <div key={feature.title} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-2xl transition-shadow animate-fade-in" style={{ animationDelay: `${0.1 * idx}s` }}>
          
            <h3 className="text-xl font-bold text-rose-700 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-base">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Mission & Founders */}
      <section className="max-w-3xl mx-auto px-4 pb-20 animate-fade-in-delay-2">
        <h2 className="text-2xl font-semibold mt-8 mb-2 text-rose-700">Our Mission</h2>
        <p className="text-gray-700 mb-4">
          We aim to empower local businesses, promote made-in-Aba products, and foster a digital marketplace where everyone can thrive. Whether you're a business owner, a shopper, or an investor, Aba Traders is designed to help you connect, grow, and succeed.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-2 text-rose-700">What You Can Do</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>Explore Aba's famous markets and business districts</li>
          <li>Find and connect with local businesses and service providers</li>
          <li>Showcase your products and services to a wider audience</li>
          <li>Stay updated on the latest trends and opportunities in Aba</li>
        </ul>
        <div className="mt-10 text-center">
          <span className="inline-block text-gray-500 text-base">Curated by founders <span className="font-semibold text-rose-700">Prince Chukwuemeka</span> and <span className="font-semibold text-rose-700">Princess C Ibekwe</span>.</span>
        </div>
      </section>
      {/* Footer */}
      <Footer footerCategories={[
        { title: 'Markets', link: '/markets' },
        { title: 'Businesses', link: '/businesses' },
        { title: 'Products', link: '/products' },
        { title: 'Services', link: '/services' },
      ]} />
    </div>
  );
} 