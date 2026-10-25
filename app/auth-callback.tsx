import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/theme';
import { describeAuthUrl, extractAndSetSessionFromUrl, supabase } from '../utils/supabase';

/**
 * Landing route for the OAuth deep link (tukarta://auth-callback). It is intentionally not
 * auth-guarded: it finishes the session exchange, then sends the user into the app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const incomingUrl = Linking.useURL();
  const [message, setMessage] = React.useState('Finishing sign in…');
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    if (handledRef.current) return;

    (async () => {
      const url = incomingUrl ?? (await Linking.getInitialURL());
      console.log('[AuthCallback] url =', describeAuthUrl(url));

      if (url) {
        const result = await extractAndSetSessionFromUrl(url);
        if (result.error) {
          handledRef.current = true;
          setMessage(result.error);
          setTimeout(() => router.replace('/login'), 2500);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        handledRef.current = true;
        router.replace('/(tabs)');
      } else if (url) {
        // A URL arrived but yielded no session; stop waiting.
        handledRef.current = true;
        router.replace('/login');
      }
    })().catch((e) => {
      console.warn('[AuthCallback] failed:', e);
      handledRef.current = true;
      router.replace('/login');
    });
  }, [incomingUrl]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
