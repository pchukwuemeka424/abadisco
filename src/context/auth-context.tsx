import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      if (!user) {
        router.replace('/login');
      }
    };
    getUser();
    // Supabase v2: onAuthStateChange returns { data: { subscription } }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.replace('/login');
      }
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}