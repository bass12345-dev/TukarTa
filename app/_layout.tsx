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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setColorScheme(colorScheme ?? 'light');
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
