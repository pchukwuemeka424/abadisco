'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';

export default function AgentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if the user is an agent - use user_id instead of id
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('id, role, status')
          .eq('user_id', data.user.id)
          .single();

        if (agentError) {
          console.error('Agent verification error:', agentError);
          
          if (agentError.code !== 'PGRST116') {
            throw agentError;
          }
          
          // No agent record found
          await supabase.auth.signOut();
          setError('Access denied. This login is for agents only.');
          setLoading(false);
          return;
        }

        if (!agentData) {
          await supabase.auth.signOut();
          setError('Access denied. This login is for agents only.');
          setLoading(false);
          return;
        }

        // Check if agent is approved
        if (agentData.status !== 'active') {
          await supabase.auth.signOut();
          setError('Your agent account is pending approval. Please contact the administrator.');
          setLoading(false);
          return;
        }

        // Agent successfully logged in
        router.push('/agent');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo.svg"
              alt="Aba City Directory Logo"
              width={150}
              height={60}
              className="mx-auto"
            />
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Agent Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your agent dashboard
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="agent@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New agent?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/auth/agent-signup" className="font-medium text-blue-600 hover:text-blue-500">
                Contact admin to create an agent account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}