import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Tutup tab pop-up OAuth di web setelah kembali (no-op di native).
WebBrowser.maybeCompleteAuthSession();

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** true sampai sesi tersimpan selesai dibaca; guard menunggu ini. */
  loading: boolean;
  /** Mengembalikan pesan galat siap tampil, atau null bila berhasil. */
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email atau password salah.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Periksa kotak masukmu.';
  if (m.includes('fetch') || m.includes('network')) return 'Tidak bisa terhubung. Periksa koneksi lalu coba lagi.';
  return 'Belum bisa masuk. Coba lagi sebentar lagi.';
}

/** Hanya sesi/pengguna Supabase. Status premium bukan atribut pengguna (docs/04 §3). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setLoading(false); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? friendly(error.message) : null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Halaman dialihkan ke Google; supabase-js menangkap kode di /auth/callback (detectSessionInUrl).
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
        return error ? friendly(error.message) : null;
      }
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
      if (error || !data.url) return friendly(error?.message ?? '');
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return null; // dibatalkan pengguna
      const code = new URL(res.url).searchParams.get('code');
      if (!code) return 'Belum bisa masuk dengan Google. Coba lagi.';
      const { error: ex } = await supabase.auth.exchangeCodeForSession(code);
      return ex ? friendly(ex.message) : null;
    } catch {
      return 'Belum bisa masuk dengan Google. Coba lagi.';
    }
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, loading, signInWithPassword, signInWithGoogle, signOut }),
    [session, loading, signInWithPassword, signInWithGoogle, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
