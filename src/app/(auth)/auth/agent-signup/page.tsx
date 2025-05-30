'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaSpinner } from 'react-icons/fa';

export default function AgentSignup() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        content: 'Passwords do not match.',
      });
      return false;
    }

    if (formData.password.length < 6) {
      setMessage({
        type: 'error',
        content: 'Password must be at least 6 characters long.',
      });
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'agent',
          },
        },
      });

      if (authError) {
        console.error('Auth error details:', authError);
        throw authError;
      }

      // Check if user was created successfully
      if (authData && authData.user) {
        // Generate a UUID for the agent record
        const agentId = crypto.randomUUID();
        
        // Insert into agents table with pending status using the updated schema
        const { error: agentError } = await supabase.from('agents').insert({
          id: agentId, // Use a new UUID as primary key
          user_id: authData.user.id, // Link to auth user's ID
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: 'agent',
          status: 'pending', // Requires admin approval
        });

        if (agentError) {
          console.error('Agent insert error details:', agentError);
          throw agentError;
        }

        setMessage({
          type: 'success',
          content: 'Your agent account has been registered successfully. An administrator will review and approve your account shortly.',
        });

        // Automatically sign out the user until approved
        await supabase.auth.signOut();
        
        // Clear form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/auth/agent-login');
        }, 3000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setMessage({
        type: 'error',
        content: error.message || 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
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
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Agent Registration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create an agent account to help businesses get listed
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10">
          {message.content && (
            <div 
              className={`mb-4 ${
                message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              } px-4 py-3 rounded-md`}
            >
              {message.content}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignup}>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="+234 800 000 0000"
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
                  value={formData.password}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="••••••••"
                />
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
                    <FaSpinner className="animate-spin mr-2" /> Creating Account...
                  </>
                ) : (
                  'Sign Up'
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
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/auth/agent-login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}