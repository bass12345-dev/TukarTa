import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { KeyboardScreen } from '../components/ui/KeyboardScreen';
import { TextField } from '../components/ui/TextField';
import { useAppTheme } from '../context/theme';
import { supabase } from '../utils/supabase';

const RESET_REDIRECT_PATH = 'reset-password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [email, setEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const trimmedEmail = email.trim();
  const isValid = /^\S+@\S+\.\S+$/.test(trimmedEmail);

  const handleSend = async () => {
    if (!isValid) {
      Alert.alert('Invalid Email', 'Enter the email address you signed up with.');
      return;
    }
    try {
      setIsSending(true);
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/${RESET_REDIRECT_PATH}`
          : AuthSession.makeRedirectUri({ scheme: 'tukarta', path: RESET_REDIRECT_PATH });
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
      if (error) throw error;
      setIsSent(true);
    } catch (error: any) {
      Alert.alert('Could Not Send Link', error?.message || 'Please try again in a moment.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.bgSecondary, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardScreen>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.topAccent} />
          <View style={styles.cardInner}>
            {isSent ? (
              <View style={styles.successView}>
                <View style={[styles.iconBubble, { backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4', borderColor: colors.border }]}>
                  <CheckCircle2 size={36} color="#10B981" />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  If an account exists for <Text style={{ color: colors.primary, fontWeight: '700' }}>{trimmedEmail}</Text>, we sent a link to reset your password. Open it on this phone.
                </Text>
                <Button variant="mint" title="Back to Sign In" onPress={() => router.replace('/login')} />
                <TouchableOpacity onPress={() => setIsSent(false)} style={styles.linkBtn}>
                  <Text style={[styles.linkText, { color: colors.textSecondary }]}>Use a different email</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Forgot password?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter your account email and we'll send you a link to set a new password.
                </Text>
                <TextField
                  label="Email Address"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon={<Mail size={18} color={colors.primary} />}
                />
                <Button
                  variant="mint"
                  title={isSending ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleSend}
                  disabled={isSending || !isValid}
                  style={!isValid ? { opacity: 0.55 } : undefined}
                />
              </>
            )}
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', marginBottom: 24 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  topAccent: { height: 3, backgroundColor: '#10B981', width: '100%' },
  cardInner: { padding: 22 },
  title: { fontFamily: 'DM Sans', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  successView: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtn: { paddingVertical: 6 },
  linkText: { fontSize: 13, fontWeight: '600' },
});
