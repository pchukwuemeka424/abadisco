import { generateMetadata } from '@/config/seo';
import { Metadata } from 'next';
import ContactPageContent from './ContactPageContent';

export const metadata: Metadata = generateMetadata({
  title: 'Contact Aba Traders - Get in Touch with Our Team',
  description: 'Contact Aba Traders for inquiries about our business directory. Founded by Prince Chukwuemeka and Princess Ibekwe Johnson. Reach out for support, partnerships, or questions about Aba businesses.',
  keywords: [
    'contact Aba Traders',
    'Aba directory support',
    'business inquiry',
    'contact Prince Chukwuemeka',
    'contact Princess Ibekwe Johnson',
    'Aba business help',
    'directory customer service',
    'Nigeria business contact',
    'Eastern Nigeria support',
    'Aba platform support'
  ],
  url: '/contact',
});

export default function ContactPage() {
  return <ContactPageContent />;
}
