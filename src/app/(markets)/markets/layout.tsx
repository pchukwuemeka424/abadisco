import TopNavbar from '@/components/TopNavbar';
import Footer from '@/components/Footer';
import React from 'react';
import { Navbar } from '@/components/Navbar';

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer footerCategories={[
        { title: 'Markets', link: '/markets' },
        { title: 'Businesses', link: '/businesses' },
        { title: 'Products', link: '/products' },
        { title: 'Services', link: '/services' },
      ]} />
    </div>
  );
}
