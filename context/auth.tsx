import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

const OFFLINE_GUEST_KEY = '@tukarta_is_offline_guest';
const CACHED_USER_KEY = '@tukarta_cached_user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  onboardingCompleted: boolean;
  isOfflineGuest: boolean;
  loginAsOfflineGuest: (musicianName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [isOfflineGuest, setIsOfflineGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchProfile = async (userId: string, force = false) => {
    if (!force && lastFetchedUserId.current === userId) return;
    lastFetchedUserId.current = userId;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setOnboardingCompleted(data?.onboarding_completed ?? true);
    } catch (err) {
      console.warn('Network issue fetching user profile, preserving offline access:', err);
      // Keep true when offline so musician is not kicked to onboarding
      setOnboardingCompleted(true);
    }
  };

  const refreshProfile = async () => {
    if (user && !isOfflineGuest) await fetchProfile(user.id, true);
  };

  useEffect(() => {
    // 1. Check offline guest or cached session first
    (async () => {
      try {
        const storedGuest = await AsyncStorage.getItem(OFFLINE_GUEST_KEY);
        if (storedGuest) {
          const guestUser = JSON.parse(storedGuest);
          setUser(guestUser);
          setSession({ user: guestUser } as any);
          setIsOfflineGuest(true);
          setOnboardingCompleted(true);
          setIsLoading(false);
          return;
        }

        // 2. Check Supabase session
        const { data: { session: onlineSession } } = await supabase.auth.getSession();
        if (onlineSession?.user) {
          setSession(onlineSession);
          setUser(onlineSession.user);
          setIsOfflineGuest(false);
          // Cache user for offline durability
          await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(onlineSession.user));
          await fetchProfile(onlineSession.user.id);
        } else {
          // Check cached user in case offline
          const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
          if (cached) {
            const cachedUser = JSON.parse(cached);
            setUser(cachedUser);
            setSession({ user: cachedUser } as any);
            setOnboardingCompleted(true);
          }
        }
      } catch (err) {
        console.warn('Error reading initial auth state, attempting offline fallback:', err);
        try {
          const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
          if (cached) {
            const cachedUser = JSON.parse(cached);
            setUser(cachedUser);
            setSession({ user: cachedUser } as any);
            setOnboardingCompleted(true);
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    })();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        setIsOfflineGuest(false);
        AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(newSession.user)).catch(() => {});
        AsyncStorage.removeItem(OFFLINE_GUEST_KEY).catch(() => {});
        fetchProfile(newSession.user.id);
      } else {
        // Only clear if not in offline guest mode
        AsyncStorage.getItem(OFFLINE_GUEST_KEY).then((guest) => {
          if (!guest) {
            setSession(null);
            setUser(null);
            lastFetchedUserId.current = null;
            setOnboardingCompleted(true);
          }
        });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Login as Offline Guest (0 Internet required)
   */
  const loginAsOfflineGuest = async (musicianName = 'Stage Musician') => {
    try {
      let devId = await AsyncStorage.getItem('@tukarta_device_id');
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 9);
        await AsyncStorage.setItem('@tukarta_device_id', devId);
      }

      const guestUser: any = {
        id: `offline_${devId}`,
        email: 'offline@tukarta.local',
        user_metadata: { name: musicianName },
        app_metadata: { provider: 'offline_guest' },
        isOfflineGuest: true,
      };

      const guestSession: any = {
        user: guestUser,
        access_token: 'offline_access_token',
        refresh_token: 'offline_refresh_token',
      };

      await AsyncStorage.setItem(OFFLINE_GUEST_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
      setSession(guestSession);
      setIsOfflineGuest(true);
      setOnboardingCompleted(true);
    } catch (e) {
      console.warn('Failed to login as offline guest:', e);
    }
  };

  const signOut = async () => {
    lastFetchedUserId.current = null;
    setIsOfflineGuest(false);
    await AsyncStorage.removeItem(OFFLINE_GUEST_KEY);
    await AsyncStorage.removeItem(CACHED_USER_KEY);
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        onboardingCompleted,
        isOfflineGuest,
        loginAsOfflineGuest,
        signOut,
        refreshProfile,
      }}
    >
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
