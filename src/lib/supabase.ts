import { USE_MOCK } from './config';
import { fetchWithTimeout } from './fetchWithTimeout';

// Only import and initialize Supabase when not in mock mode.
// This prevents crashes from missing env vars during frontend-only development.
const createSupabaseClient = () => {
  if (USE_MOCK) {
    return null as any;
  }
  // Dynamic require so the import is never evaluated in mock mode.
  const { createClient } = require('@supabase/supabase-js');
  const SecureStore = require('expo-secure-store');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  const ExpoSecureStoreAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();
