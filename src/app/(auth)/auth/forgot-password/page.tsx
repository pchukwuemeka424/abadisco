"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTip, setCurrentTip] = useState(0);

  // Aba city recovery tips
  const recoveryTips = [
    {
      title: "Account Recovery",
      description: "We'll help you get back to exploring Aba's vibrant markets and business opportunities.",
      image: "/images/ariaria-market.png"
    },
    {
      title: "Secure Access",
      description: "Reset your password to securely access your personalized Aba city guide and connections.",
      image: "/images/Eziukwu Market.jpg"
    },
    {
      title: "Back to Business",
      description: "Quickly recover your account to continue networking with local Aba entrepreneurs and craftsmen.",
      image: "/images/Cemetery Market.jpeg"
    }
  ];

  // Cycle through tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % recoveryTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Implement password reset logic with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset password email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Panel - Password Reset Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
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
            <h2 className="text-3xl font-bold text-gray-900">Forgot your password?</h2>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {submitted ? (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      If an account exists for <span className="font-medium">{email}</span>, a password reset link has been sent.
                    </p>
                  </div>
                </div>
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
                      Please check your email inbox and spam folder. The password reset link will expire in 24 hours.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center text-rose-500 hover:text-rose-600 font-medium">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
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
              </div>
              
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                {loading ? "Sending link..." : "Send reset link"}
              </button>
              
              <div className="text-center">
                <Link href="/auth/login" className="text-rose-500 hover:text-rose-600 font-medium">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700">Need help?</h3>
            <ul className="mt-2 text-sm text-gray-500">
              <li className="flex items-start mt-1">
                <span className="text-rose-400 mr-1">•</span>
                Make sure you enter the email address you registered with
              </li>
              <li className="flex items-start mt-1">
                <span className="text-rose-400 mr-1">•</span>
                Check your spam folder if you don't receive the email
              </li>
              <li className="flex items-start mt-1">
                <span className="text-rose-400 mr-1">•</span>
                <Link href="/contact" className="text-rose-500 hover:text-rose-600">
                  Contact support
                </Link> if you still have problems
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Aba City Recovery Content */}
      <div className="hidden md:block md:w-1/2 bg-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={recoveryTips[currentTip].image}
            alt={recoveryTips[currentTip].title}
            layout="fill"
            objectFit="cover"
            className="opacity-30"
          />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center p-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6">Account Recovery</h2>
              <div className="h-1 w-20 bg-white mb-6"></div>
              <p className="text-lg mb-6">
                Get back to discovering Aba's vibrant commercial ecosystem - the heart of Eastern Nigeria's business innovation.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-2">{recoveryTips[currentTip].title}</h3>
              <p className="mb-6">{recoveryTips[currentTip].description}</p>
              
              <div className="flex space-x-2">
                {recoveryTips.map((_, index) => (
                  <button 
                    key={index}
                    className={`h-2 rounded-full flex-1 ${index === currentTip ? 'bg-white' : 'bg-white/30'}`}
                    onClick={() => setCurrentTip(index)}
                    aria-label={`View tip ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-8 bg-white/5 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">What you'll regain access to:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-rose-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Personalized market guides for Ariaria, Eziukwu, and other famous Aba markets
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-rose-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Business connections with local craftsmen and entrepreneurs
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-rose-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Updates on special market days and cultural events in Aba
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
