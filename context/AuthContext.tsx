import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabase, hasSupabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase()) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();

    const currentSession = supabase.auth.getSession();
    currentSession.then(res => {
      setSession(res.data.session ?? null);
      setUser(res.data.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
    });

    return () => {
      sub?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!hasSupabase()) throw new Error('Supabase not configured');
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!hasSupabase()) throw new Error('Supabase not configured');
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const user = data?.user;
    if (user) {
      // create profile row if profiles table exists
      supabase.from('profiles').upsert({ id: user.id, email, full_name: fullName ?? null }).then(() => {}).catch(() => {});
    }
  };

  const signOut = async () => {
    if (!hasSupabase()) throw new Error('Supabase not configured');
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
