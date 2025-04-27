import { AgentSidebar } from '@/components/AgentSidebar';
import { AuthProvider } from '@/context/auth-context';

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <AgentSidebar />
          <main className="flex-1 p-4 md:p-6 ml-0 md:ml-64 mt-16 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}