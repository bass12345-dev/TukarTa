import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Lock, Mail, Music2, ShieldCheck, Zap } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { KeyboardScreen } from '../components/ui/KeyboardScreen';
import { TextField } from '../components/ui/TextField';
import {
  supabase,
  extractAndSetSessionFromUrl,
  describeAuthUrl,
  AUTH_REDIRECT_PATH,
} from '../utils/supabase';
import { useAppTheme } from '../context/theme';
import { useAuth } from '../context/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { loginAsOfflineGuest } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Warm up custom tabs on Android for faster, reliable OAuth return
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.warmUpAsync().catch(() => {});
      return () => {
        WebBrowser.coolDownAsync().catch(() => {});
      };
    }
  }, []);

  const handleOfflineGuestEntry = async () => {
    try {
      await loginAsOfflineGuest('Stage Musician');
      router.replace('/offline-gigs');
    } catch (e) {
      console.warn('Offline guest entry failed:', e);
      Alert.alert('Offline Mode', 'Could not start Offline Gig Mode. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);

      const returnUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : AuthSession.makeRedirectUri({
              scheme: 'tukarta',
              path: AUTH_REDIRECT_PATH,
            });
      console.log('[GoogleAuth] redirectTo =', describeAuthUrl(returnUrl));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: returnUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;

      // On Web, Supabase redirects the window directly when skipBrowserRedirect is false
      if (Platform.OS === 'web') {
        if (data?.url && typeof window !== 'undefined') {
          window.location.href = data.url;
        }
        return;
      }

      if (!data?.url) {
        throw new Error('Could not generate Google sign-in URL.');
      }

      console.log('[GoogleAuth] provider url host =', data.url.split('/').slice(0, 3).join('/'));
      const res = await WebBrowser.openAuthSessionAsync(data.url, returnUrl);
      console.log('[GoogleAuth] browser result =', res.type, 'url' in res ? describeAuthUrl(res.url) : '');

      if (res.type === 'success' && res.url) {
        const parsed = await extractAndSetSessionFromUrl(res.url);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.success) {
          router.replace('/(tabs)');
          return;
        }
      }

      // On Android, Chrome Custom Tabs may dismiss after triggering the OS deep link intent;
      // check if the deep link listener or initial URL already established the session.
      const latestUrl = await Linking.getInitialURL();
      if (latestUrl && (latestUrl.includes('access_token=') || latestUrl.includes('code='))) {
        const parsed = await extractAndSetSessionFromUrl(latestUrl);
        if (parsed.success) {
          router.replace('/(tabs)');
          return;
        }
      }

      const { data: sessionCheck } = await supabase.auth.getSession();
      if (sessionCheck?.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message || 'An error occurred during Google sign in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Authentication Error', error.message);
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Subtle top mint background wash */}
      <LinearGradient
        colors={isDark ? ['#132821', colors.bg] : ['#F0FDF4', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardScreen>
        {/* ── Brand Header ── */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Music2 size={26} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          
          <Text style={[styles.appName, { color: colors.text }]}>TukarTa</Text>
          <View style={[styles.eyebrowChip, { backgroundColor: isDark ? colors.bgCard : '#F0FDF4', borderColor: colors.border }]}>
            <Text style={styles.eyebrow}>SETLIST HUB & MUSICIAN NETWORK</Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Build live setlists, prepare offline packages, and sync seamlessly with your band.
          </Text>
        </View>

        {/* ── Auth card ── */}
        <View>
          <View style={[styles.authCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.topAccent} />

            <View style={styles.authCardInner}>
              <Text style={[styles.authHeading, { color: colors.text }]}>Sign in to your account</Text>
              <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>Access your repertoire, setlists, and band gigs</Text>

              {/* Google Button */}
              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: isDark ? colors.bgSecondary : '#FFFFFF', borderColor: colors.border }, isLoggingIn && { opacity: 0.7 }]}
                onPress={handleGoogleLogin}
                activeOpacity={0.85}
                disabled={isLoggingIn}
              >
                <View style={[styles.googleLogoCircle, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.border }]}>
                  <Text style={styles.googleLogoText}>G</Text>
                </View>
                <Text style={[styles.googleBtnText, { color: colors.text }]}>
                  {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or sign in with email</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.form}>
                <TextField
                  label="Email Address"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon={<Mail size={18} color={colors.primary} />}
                />
                <TextField
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="current-password"
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={<Lock size={18} color={colors.primary} />}
                />
                <TouchableOpacity
                  onPress={() => router.push('/forgot-password')}
                  style={styles.forgotLink}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.toggleHighlight}>Forgot password?</Text>
                </TouchableOpacity>

                <Button
                  variant="mint"
                  title={isLoggingIn ? 'Signing In...' : 'Sign In'}
                  onPress={handleEmailAuth}
                  disabled={isLoggingIn}
                />
              </View>

              {/* ── Offline Gig Mode Divider & Button ── */}
              <View style={styles.offlineDividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or perform without internet</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[
                  styles.offlineGigBtn,
                  {
                    backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                    borderColor: '#10B981',
                  },
                ]}
                onPress={handleOfflineGuestEntry}
                activeOpacity={0.85}
              >
                <View style={styles.offlineIconCircle}>
                  <Zap size={16} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.offlineGigBtnTitle, { color: isDark ? '#FFFFFF' : '#064E3B' }]}>
                    Continue in Offline Gig Mode
                  </Text>
                  <Text style={[styles.offlineGigBtnSub, { color: isDark ? '#A7F3D0' : '#059669' }]}>
                    Open your downloaded gigs in Stage Mode — no internet needed
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.toggleMode}
                onPress={() => router.push('/signup')}
              >
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                  Don't have an account? <Text style={styles.toggleHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Footer note ── */}
        <View style={styles.footerNote}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.footerNoteText}>Protected with Supabase Auth & Offline Cache</Text>
        </View>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  appName: {
    fontFamily: 'DM Sans',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  eyebrowChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'DM Sans',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  authCard: {
    borderWidth: 1,
    borderRadius: 22,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    backgroundColor: '#10B981',
    width: '100%',
  },
  authCardInner: {
    padding: 22,
  },
  authHeading: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 12.5,
    marginBottom: 20,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
  },
  googleLogoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  googleLogoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA4335',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  form: {
    gap: 12,
  },
  offlineDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  offlineGigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
  },
  offlineIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  offlineGigBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  offlineGigBtnSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  toggleMode: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
  },
  toggleHighlight: {
    color: '#10B981',
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 26,
  },
  footerNoteText: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '600',
  },
});
