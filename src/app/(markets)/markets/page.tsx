import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import Image from 'next/image';
import MarketsList from '@/components/MarketsList';

export const metadata: Metadata = generateMetadata({
  title: 'Aba Markets Directory - Explore Traditional & Modern Markets',
  description: 'Discover Aba\'s vibrant markets including Ariaria International Market, Aba Main Market, and more. Find traders, businesses, and authentic products in Nigeria\'s commercial hub.',
  keywords: [
    'Aba markets',
    'Ariaria Market',
    'Aba Main Market',
    'Nigeria markets',
    'Aba traders',
    'African markets',
    'traditional markets',
    'commercial markets',
    'Aba shopping',
    'Nigerian commerce'
  ],
  url: '/markets',
});

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner with full-width image and overlay */}
      <div className="relative w-full h-96 mb-10">
        <Image
          src="/images/ariaria-market.png"
          alt="Markets Banner"
          fill
          className="object-cover w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-blue-900/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6">
            Discover Aba's Markets
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto font-medium mb-2">
            Step into the vibrant heart of Aba, where tradition meets innovation in bustling marketplaces.
          </p>
        </div>
      </div>

      {/* Market Listings Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Explore Markets</h2>
          <p className="text-lg text-gray-600">
            Browse through Aba's famous market districts and discover thousands of businesses and products.
          </p>
        </div>
        
        <MarketsList />
      </div>
    </div>
  );
}
