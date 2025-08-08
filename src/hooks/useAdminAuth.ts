'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  loginTime: string;
}

export function useAdminAuth() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = () => {
    try {
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        const session: AdminSession = JSON.parse(sessionData);
        
        // Check if session is not too old (24 hours)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setAdminSession(session);
        } else {
          // Session expired
          localStorage.removeItem('adminSession');
          setAdminSession(null);
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('adminSession');
      setAdminSession(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminSession');
    setAdminSession(null);
    router.push('/auth/admin-login');
  };

  const requireAuth = () => {
    if (!loading && !adminSession) {
      router.push('/auth/admin-login');
      return false;
    }
    return true;
  };

  return {
    adminSession,
    loading,
    logout,
    requireAuth,
    isAuthenticated: !!adminSession
  };
}

