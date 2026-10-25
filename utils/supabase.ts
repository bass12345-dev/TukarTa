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
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Extracts OAuth tokens (access_token & refresh_token) or PKCE auth code
 * from a redirect URL (both hash # and query ? fragments) and sets the Supabase session.
 */
export async function extractAndSetSessionFromUrl(url: string): Promise<{ success: boolean; error?: string }> {
  if (!url) return { success: false };

  try {
    const hashPart = url.includes('#') ? url.split('#')[1] : '';
    const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';

    const hashParams = Object.fromEntries(new URLSearchParams(hashPart));
    const queryParams = Object.fromEntries(new URLSearchParams(queryPart));
    const params: Record<string, string> = { ...queryParams, ...hashParams };

    if (params.error_description || params.error) {
      return {
        success: false,
        error: decodeURIComponent((params.error_description || params.error).replace(/\+/g, ' ')),
      };
    }

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
      return { success: true };
    }

    if (params.code) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (codeError) {
        return { success: false, error: codeError.message };
      }
      return { success: true };
    }

    return { success: false };
  } catch (err: any) {
    console.warn('Error parsing OAuth redirect URL:', err);
    return { success: false, error: err?.message };
  }
}

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
