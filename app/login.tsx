import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowRight, Camera, Lock, Mail, Music2, Search, Zap } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

WebBrowser.maybeCompleteAuthSession();

// ─── Feature card data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: '1',
    icon: Music2,
    title: 'AI Setlists',
    subtitle: 'Smart generation',
    color: '#00D4FF',
    glowColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.22)',
    tagBg: 'rgba(0,212,255,0.1)',
    tag: 'AI',
  },
  {
    id: '2',
    icon: Camera,
    title: 'Screenshot Import',
    subtitle: 'Scan & import songs',
    color: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.22)',
    tagBg: 'rgba(139,92,246,0.1)',
    tag: 'New',
  },
  {
    id: '3',
    icon: Search,
    title: 'Find Musicians',
    subtitle: 'By songs they know',
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.22)',
    tagBg: 'rgba(16,185,129,0.1)',
    tag: 'Match',
  },
  {
    id: '4',
    icon: Zap,
    title: 'Stage Mode',
    subtitle: 'Live chords & lyrics',
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.22)',
    tagBg: 'rgba(245,158,11,0.1)',
    tag: 'Live',
  },
];

// ─── Feature card (matches setlist / alerts card pattern) ─────────────────────
function FeatureCard({ icon: Icon, title, subtitle, color, glowColor, tagBg, tag }: typeof FEATURES[0]) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureCardInner}>
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: glowColor }]}>
          <Icon size={18} color={color} />
        </View>

        {/* Text */}
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>

        {/* Tag */}
        <View style={[styles.tagBadge, { backgroundColor: tagBg }]}>
          <Text style={[styles.tagText, { color }]}>{tag}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
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
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background gradient */}
      <LinearGradient
        colors={['#071420', '#0d2d45', '#071420']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow orbs */}
      <View style={styles.orbTopLeft} />
      <View style={styles.orbBottomRight} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.eyebrow}>MUSICIANS PLATFORM</Text>
          <Text style={styles.heroTitle}>Welcome Back</Text>
          <Text style={styles.heroSubtitle}>
            Build smarter setlists. Find musicians who already know your songs.
          </Text>
        </View>

        {/* ── Feature Cards ── */}
        <View style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} {...f} />
          ))}
        </View>

        {/* ── Auth card ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.authCard}>
            <View style={[styles.topAccent, { backgroundColor: '#00D4FF' }]} />

            <View style={styles.authCardInner}>
              <Text style={styles.authTitle}>Welcome Back</Text>
              <Text style={styles.authSubtitle}>Sign in to access your setlists and network</Text>

              <View style={styles.form}>
                <TextField
                  label="Email Address"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon={<Mail size={18} color="#FFF" />}
                />
                <TextField
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={<Lock size={18} color="#FFF" />}
                />

                <Button
                  title={isLoggingIn ? 'Signing In...' : 'Sign In'}
                  onPress={handleEmailAuth}
                  disabled={isLoggingIn}
                />
              </View>

              <TouchableOpacity 
                style={styles.toggleMode}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.toggleText}>
                  Don't have an account? Sign Up
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={[styles.googleBtn, isLoggingIn && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleGoogleLogin}
                disabled={isLoggingIn}
              >
                <View style={styles.googleLogoCircle}>
                  {isLoggingIn ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.googleLogoText}>G</Text>
                  )}
                </View>
                <Text style={styles.googleBtnText}>
                  Continue with Google
                </Text>
                {!isLoggingIn && <ArrowRight size={16} color="#1A1A1A" style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>

              <Text style={styles.footerText}>
                By continuing you agree to our{' '}
                <Text style={styles.footerLink}>Terms</Text> &{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },

  /* Ambient orbs */
  orbTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(139,92,246,0.07)',
  },

  /* Scroll */
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 28,
  },

  /* Hero */
  heroSection: {
    alignItems: 'center',
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 2,
    opacity: 0.8,
    fontFamily: 'DM Sans',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'DM Sans Bold',
    lineHeight: 42,
  },
  logoTukar: {
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
  logoTa: {
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(200,215,235,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'DM Sans',
    maxWidth: 300,
  },

  /* Feature grid */
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
  },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: 0,
  },
  topAccent: {
    height: 3,
    width: '100%',
    opacity: 0.9,
  },
  featureCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    letterSpacing: 0.3,
  },

  /* Auth card */
  authCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    overflow: 'hidden',
  },
  authCardInner: {
    padding: 20,
    gap: 14,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  authSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
    marginTop: -6,
    marginBottom: 8,
  },
  form: {
    gap: 4,
  },
  toggleMode: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleText: {
    color: '#00D4FF',
    fontSize: 13,
    fontFamily: 'DM Sans Medium',
    opacity: 0.8,
  },

  /* Google button */
  googleBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginTop: -4,
  },
  googleLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  googleBtnText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'DM Sans',
  },

  /* Email button */
  emailBtn: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emailBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },

  /* Footer */
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(150,175,200,0.3)',
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
  footerLink: {
    color: 'rgba(0,212,255,0.5)',
  },
});
