import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Lock, Mail, Music2, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { supabase } from '../utils/supabase';
import { useAppTheme } from '../context/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const returnUrl = AuthSession.makeRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: returnUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const res = await WebBrowser.openAuthSessionAsync(data.url, returnUrl);

      if (res.type === 'success' && res.url) {
        const hash = res.url.split('#')[1];
        if (!hash) return;
        
        const params = Object.fromEntries(new URLSearchParams(hash));
        
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (sessionError) throw sessionError;
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message || 'An error occurred during sign in.');
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
        email,
        password,
      });
      if (error) throw error;
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                  value={email}
                  onChangeText={setEmail}
                  leftIcon={<Mail size={18} color={colors.primary} />}
                />
                <TextField
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={<Lock size={18} color={colors.primary} />}
                />

                <Button
                  variant="mint"
                  title={isLoggingIn ? 'Signing In...' : 'Sign In'}
                  onPress={handleEmailAuth}
                  disabled={isLoggingIn}
                />
              </View>

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
        </KeyboardAvoidingView>

        {/* ── Footer note ── */}
        <View style={styles.footerNote}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.footerNoteText}>Protected with Supabase Auth & Offline Cache</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
