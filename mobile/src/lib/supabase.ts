import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env } from './env';

// Klien hanya memakai `supabase.auth` dan upload Storage via signed URL; tidak ada akses tabel (docs/04 §2.2).
const web = Platform.OS === 'web';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // web: localStorage bawaan supabase-js (aman saat static rendering di Node); native: AsyncStorage.
    ...(web ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: web,
    flowType: 'pkce',
  },
});
