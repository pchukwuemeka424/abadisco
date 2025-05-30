import { Metadata } from 'next';
import AdminSidebar from './components/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Aba Markets',
  description: 'Administration panel for Aba Markets platform',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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