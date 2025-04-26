'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract the intended redirect destination from URL params
    const next = searchParams?.get('next') || '/dashboard/profile';

    const handleAuthCallback = async () => {
      // Process the OAuth callback
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth/login?error=Authentication failed');
        return;
      }

      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if the user exists in the users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create the user record if it doesn't exist
          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || null,
          });
        }

        // Redirect to the destination
        router.push(next);
      } else {
        router.push('/auth/login');
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