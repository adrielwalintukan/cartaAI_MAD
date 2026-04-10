import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil session saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen untuk perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // 1. Ambil data user dasar
      const { data: userData, error: userError } = await supabase
        .from('tbl_user')
        .select('*')
        .eq('id_user', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      // 2. Ambil data langganan yang aktif secara terpisah agar lebih akurat
      const { data: subData, error: subError } = await supabase
        .from('tbl_t_subs')
        .select('*')
        .eq('id_user', userId)
        .eq('is_active', true)
        .order('created_date', { ascending: false })
        .limit(1);

      if (subError) console.error('Error fetching subscription:', subError);

      const hasActiveSub = subData && subData.length > 0;

      setUserProfile({
        ...(userData || {}),
        subscription_status: hasActiveSub ? 'premium' : 'free',
        active_subscription: hasActiveSub ? subData[0] : null
      });

    } catch (err) {
      console.error('Error fetching profile:', err);
      setUserProfile({ subscription_status: 'free' });
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const logout = async () => {
    return await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    refreshProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
