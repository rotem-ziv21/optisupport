import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on component mount
    const getSession = async () => {
      setLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state listener
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // Clean up subscription on unmount
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
