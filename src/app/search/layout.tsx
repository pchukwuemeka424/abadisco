'use client';

import { Navbar } from '@/components/Navbar';
import React from 'react';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    
      <div className="min-h-screen">
        <div>
          {children}
        </div>
      </div>
    </>
  );
}
