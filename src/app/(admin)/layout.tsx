'use client';

import AdminSidebar from './components/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}