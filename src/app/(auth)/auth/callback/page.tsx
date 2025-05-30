'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../supabaseClient';

// Component that safely uses useSearchParams inside Suspense
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const next = searchParams.get('next') || '/dashboard/profile';

    const handleAuthCallback = async () => {
      try {
        // Retrieve the session (URL hash is auto-processed by Supabase client)
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          console.error('Error during auth callback:', error);
          router.push('/auth/login?error=Authentication failed');
          return;
        }
        const user = data.session.user;

        if (user) {
          // Check if the user exists in the users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!existingUser) {
            // Create the user record if it doesn't exist - only use fields from the simplified schema
            await supabase.from('users').insert({
              id: user.id,
              email: user.email
              // Note: No password is set here since OAuth doesn't provide one
            });
          }

          // Redirect to the destination
          router.push(next);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth/login?error=Unexpected error');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing your sign in...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    </div>
  </div>
);

// Main component with Suspense boundary
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
