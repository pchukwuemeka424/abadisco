import { Navbar } from '@/components/Navbar';
import React from 'react';
import { TopNavbar } from '@/components/TopNavbar';
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">

      <div >
       {/* <TopNavbar /> */}
        {children}
      </div>
    </div>
  );
}
