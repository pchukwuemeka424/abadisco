import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import with proper loading state
const HomePage = dynamic(() => import('./HomePage'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  ),
});

export const metadata: Metadata = generateMetadata({
  title: 'Home - Discover Aba Markets & Businesses',
  description: 'Welcome to Aba Directory, your gateway to Aba\'s vibrant business ecosystem. Founded by Prince Chukwuemeka and Princess Ibekwe Johnson to showcase the commercial heart of Eastern Nigeria.',
  keywords: [
    'Aba home page',
    'Nigeria business hub', 
    'Eastern Nigeria commerce',
    'Aba business directory',
    'Prince Chukwuemeka founder',
    'Princess Ibekwe Johnson co-founder',
    'Ariaria Market',
    'Aba entrepreneurs'
  ],
  url: '/',
});

export default function Page() {
  return <HomePage />;
}
