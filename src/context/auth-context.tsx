"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define proper types for user, session and context
type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type Session = {
  user: User | null;
  access_token?: string;
  [key: string]: unknown;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  loading: boolean;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { session }, error } = supabase.auth.getSession();
    if (error) {
      console.log('Error getting session:', error);
    } else {
      setSession(session);
      setUser(session?.user ?? null);
    }
    setLoading(false);

    // Supabase v2: onAuthStateChange returns { data: { subscription } }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    },
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};