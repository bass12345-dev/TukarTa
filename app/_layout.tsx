import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
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
import { useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const { session, isLoading, onboardingCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setColorScheme(colorScheme ?? 'light');
  }, [colorScheme]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    
    if (!session && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access tabs
      router.replace('/login');
    } else if (session) {
      if (!onboardingCompleted && !inOnboarding) {
        // Redirect to onboarding if authenticated but not finished setup
        router.replace('/onboarding');
      } else if (onboardingCompleted && (inOnboarding || segments[0] === 'login' || segments[0] === 'signup' || segments[0] === undefined)) {
        // Redirect to home if already on login/signup/onboarding but authenticated+onboarded
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, segments, onboardingCompleted]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
