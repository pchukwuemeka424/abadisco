'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { supabase } from '../../../../supabaseClient';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
  // Use explicit redirect base: prefer NEXT_PUBLIC_SITE_URL for production, fallback to Supabase redirect URL or current origin
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://aba-directory.vercel.app');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Aba city features to showcase
  const abaFeatures = [
    {
      title: "Ariaria International Market",
      description: "One of the largest markets in West Africa, famous for quality leather goods, textiles, and fashion items.",
      image: "/images/ariaria-market.png"
    },
    {
      title: "Made-in-Aba Products",
      description: "Discover locally produced footwear, garments, and crafts made by skilled artisans and entrepreneurs.",
      image: "/images/Eziukwu Market.jpg"
    },
    {
      title: "Business Networking",
      description: "Connect with thousands of business owners, manufacturers, and traders across various industries.",
      image: "/images/Cemetery Market.jpeg"
    },
    {
      title: "Cultural Experience",
      description: "Explore the rich cultural heritage, local cuisine, and community attractions in Aba city.",
      image: "/images/RAILWAY .jpeg"
    }
  ];

  // Cycle through Aba features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % abaFeatures.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Validate form
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      setLoading(false);
      return;
    }
    // Supabase Auth sign in
    const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    // Redirect to dashboard
    window.location.href = '/dashboard/';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect through our OAuth callback, then on to dashboard
        redirectTo: `${redirectBase}/auth/callback?next=/dashboard`
      }
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  };

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
          await supabase.from('users').insert({
            id: user.id,
            email: user.email
            // No other fields needed with simplified schema
          });
        }
      }
    }
    ensureGoogleUserInTable();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Panel - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            {/* Logo removed */}
            <h2 className="text-3xl font-bold text-gray-900">Welcome to Aba Directory</h2>
            <p className="mt-2 text-gray-600">
              Sign in to continue your journey in Aba city
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-rose-500 hover:text-rose-600 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-rose-500 hover:text-rose-600 font-medium">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm text-center font-medium">{error}</div>
              )}
              
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                disabled={loading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-rose-300 group-hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                {loading ? 'Signing in...' : 'Sign in'}
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
                {loading ? 'Redirecting...' : 'Sign in with Google'}
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Sign in to access your personalized Aba city guide, business connections, and market information.
                  </p>
                </div>
              </div>
            </div>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="inline-block px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium shadow-sm transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Aba City Showcase */}
      <div className="hidden md:block md:w-1/2 bg-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={abaFeatures[currentFeature].image}
            alt={abaFeatures[currentFeature].title}
            layout="fill"
            objectFit="cover"
            className="opacity-30"
          />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center p-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6">Discover Aba City</h2>
              <div className="h-1 w-20 bg-white mb-6"></div>
              <p className="text-lg mb-6">
                The commercial heartbeat of Eastern Nigeria, known for entrepreneurship, creativity, and vibrant markets.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-2">{abaFeatures[currentFeature].title}</h3>
              <p className="mb-6">{abaFeatures[currentFeature].description}</p>
              
              <div className="flex space-x-2">
                {abaFeatures.map((_, index) => (
                  <button 
                    key={index}
                    className={`h-2 rounded-full flex-1 ${index === currentFeature ? 'bg-white' : 'bg-white/30'}`}
                    onClick={() => setCurrentFeature(index)}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">How to get started:</h3>
              <ol className="space-y-2">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span> Sign in to your account
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span> Complete your profile for personalized recommendations
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span> Explore Aba's markets and connect with businesses
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span> Share your experiences and favorite locations
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}