import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import SearchPageComponent from './SearchPageComponent';

export const metadata: Metadata = generateMetadata({
  title: 'Search Aba Businesses & Markets - Find Local Services',
  description: 'Search and discover businesses, markets, and services across Aba. Find traders, shops, restaurants, and professional services in Nigeria\'s commercial hub. Founded by Prince Chukwuemeka and Princess Ibekwe Johnson.',
  keywords: [
    'search Aba businesses',
    'find Aba services',
    'Aba business directory search',
    'local businesses Aba',
    'Aba market search',
    'Nigerian business finder',
    'Eastern Nigeria services',
    'Aba commercial directory',
    'find traders Aba',
    'business search Nigeria'
  ],
  url: '/search',
});

export default function SearchPage() {
  return <SearchPageComponent />;
}