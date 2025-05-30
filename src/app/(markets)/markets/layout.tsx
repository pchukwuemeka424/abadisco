import { Navbar } from '@/components/Navbar';
import TopNavbar from '@/components/TopNavbar';
import React from 'react';

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="">
        {/* topnavbar */}
        <TopNavbar />
        {/* topnavbar end */}
        {children}
      </div>
    </div>
  );
}
