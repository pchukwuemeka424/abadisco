'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { supabase } from '@/supabaseClient';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMarketImage, setCurrentMarketImage] = useState(0);
  
  // Featured markets in Aba
  const marketImages = [
    {
      src: "/images/Ahia Ohuru (New Market).webp",
      name: "Ahia Ohuru (New Market)"
    },
    {
      src: "/images/ariaria-market.png",
      name: "Ariaria International Market"
    },
    {
      src: "/images/Cemetery Market.jpeg",
      name: "Cemetery Market"
    },
    {
      src: "/images/Eziukwu Market.jpg",
      name: "Eziukwu Market"
    },
    {
      src: "/images/RAILWAY .jpeg",
      name: "Railway Market"
    }
  ];

  // Cycle through market images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMarketImage((prev) => (prev + 1) % marketImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Validate form
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      setLoading(false);
      return;
    }
    // Supabase Auth sign up
    const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'user' // Explicitly set role to 'user' (not 'agent') in auth metadata
        }
      }
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // Get the new user's id
    const userId = signUpData?.user?.id;
    // Insert into users table with simplified schema
    if (userId) {
      const { error: insertError } = await supabase.from('users').insert({ 
        id: userId, 
        email, 
        full_name: name
      });
      
      if (insertError) {
        console.error('Error inserting user record:', insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Insert into kyc_verifications
      await supabase.from('kyc_verifications').insert({ 
        user_id: userId,
        document_type: 'national_id',
        document_number: 'pending'
      });
    }
    // Redirect or show success
    window.location.href = '/dashboard/';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Send through our OAuth callback to process the hash and then route to dashboard
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  };

  // Insert Google OAuth user into users table after redirect
  useEffect(() => {
    async function ensureGoogleUserInTable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        // Check if user already exists by Auth UID
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        if (!existingUser) {
          // Insert into users table with simplified schema
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0]
          });
          
          if (insertError) {
            console.error('Error inserting Google user:', insertError);
            return;
          }
          
          // Insert into kyc_verifications
          await supabase.from('kyc_verifications').insert({ 
            user_id: user.id,
            document_type: 'national_id',
            document_number: 'pending'
          });
        }
      }
    }
    ensureGoogleUserInTable();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* New Left Panel - Aba City Content */}
      <div className="hidden md:flex md:w-1/2 bg-rose-50 p-8 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={marketImages[currentMarketImage].src} 
            alt={marketImages[currentMarketImage].name} 
            layout="fill" 
            objectFit="cover"
            className="opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-md text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Discover Aba City</h1>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-rose-600 mb-4">The Commercial Hub of Eastern Nigeria</h2>
            <p className="mb-6 text-gray-700">
              Join our community to explore Aba's vibrant markets, local businesses, and rich cultural heritage.
            </p>
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-2">What you'll discover:</h3>
              <ul className="text-left space-y-2 pl-5">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Famous Ariaria International Market
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Local craftsmen and artisans
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Made-in-Aba products and services
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Connect with local business owners
                </li>
              </ul>
            </div>
            <div className="text-sm text-gray-600 italic">
              Currently showing: {marketImages[currentMarketImage].name}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Aba Directory Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">Join the Aba Community</h2>
            <p className="mt-2 text-gray-600">
              Create your account to discover Aba's markets and businesses
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-rose-500 hover:text-rose-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Sign Up Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm text-center font-medium">{error}</div>
              )}
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      After signing up, complete your profile to access exclusive Aba business listings and market guides.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                disabled={loading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-rose-300 group-hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
                {loading ? 'Signing up...' : 'Join Aba Directory'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? 'Redirecting...' : 'Sign up with Google'}
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Discover Aba After Signing Up:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <span className="text-rose-500 mr-1">1.</span> Complete your profile for personalized recommendations
                </li>
                <li className="flex items-start">
                  <span className="text-rose-500 mr-1">2.</span> Access our exclusive Aba markets directory
                </li>
                <li className="flex items-start">
                  <span className="text-rose-500 mr-1">3.</span> Connect with local businesses and sellers
                </li>
                <li className="flex items-start">
                  <span className="text-rose-500 mr-1">4.</span> Get updates on special market days and events
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-rose-500 hover:text-rose-600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-rose-500 hover:text-rose-600">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}