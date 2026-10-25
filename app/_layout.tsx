import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../global.css";

import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useColorScheme } from '@/components/useColorScheme';

import { 
  DMSans_300Light,
  DMSans_400Regular, 
  DMSans_500Medium, 
  DMSans_700Bold 
} from '@expo-google-fonts/dm-sans';
import { 
  JetBrainsMono_400Regular, 
  JetBrainsMono_700Bold 
} from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider, useAuth } from '../context/auth';
import { AppThemeProvider, useAppTheme } from '../context/theme';
import { BandSessionProvider } from '../context/bandSession';
import { useRouter, useSegments } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectivityProvider } from '../context/connectivity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes: keeps data fresh across tab switches without redundant refetches
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days: cached data is persisted to disk for offline use
      networkMode: 'offlineFirst',      // serve cached data immediately; don't pause when offline
      refetchOnWindowFocus: false, // Prevents redundant refetch bursts on window focus
      refetchOnMount: false,       // Reuses fresh cached data when returning to screens
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'TUKARTA_QUERY_CACHE',
  throttleTime: 2000,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'DM Sans': DMSans_400Regular,
    'DM Sans Light': DMSans_300Light,
    'DM Sans Medium': DMSans_500Medium,
    'DM Sans Bold': DMSans_700Bold,
    'JetBrains Mono': JetBrainsMono_400Regular,
    'JetBrains Mono Bold': JetBrainsMono_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      <ConnectivityProvider>
        <AppThemeProvider>
          <AuthProvider>
            <BandSessionProvider>
              <RootLayoutNav />
            </BandSessionProvider>
          </AuthProvider>
        </AppThemeProvider>
      </ConnectivityProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useAppTheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const { session, isLoading, onboardingCompleted, isOfflineGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  // The app is portrait-only except Stage Mode, which unlocks rotation itself
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    
    const publicScreens = ['login', 'signup', 'forgot-password', 'reset-password', 'auth-callback', 'offline-gigs', 'stage-mode'];
    if (!session && !publicScreens.includes(String(segments[0]))) {
      // Redirect to login if not authenticated and trying to access tabs or protected routes
      router.replace('/login');
    } else if (session && isOfflineGuest) {
      // Offline guests have no account data: keep them on the Offline Gigs home instead of the account tabs
      const allowed = ['offline-gigs', 'stage-mode', 'login', 'signup'];
      if (!allowed.includes(String(segments[0]))) {
        router.replace('/offline-gigs');
      }
    } else if (session) {
      if (!onboardingCompleted && !inOnboarding) {
        // Redirect to onboarding if authenticated but not finished setup
        router.replace('/onboarding');
      } else if (onboardingCompleted && (inOnboarding || segments[0] === 'login' || segments[0] === 'signup' || segments[0] === undefined)) {
        // Redirect to home if already on login/signup/onboarding but authenticated+onboarded
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, segments, onboardingCompleted, isOfflineGuest]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
