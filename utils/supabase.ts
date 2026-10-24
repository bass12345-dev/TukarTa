import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

const ExpoAsyncStorageAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Supabase Store getItem error:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      return await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Supabase Store setItem error:', e);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      return await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Supabase Store removeItem error:', e);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoAsyncStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Optimized user retrieval: retrieves user from local session storage
 * without firing redundant HTTP network requests to /auth/v1/user.
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
