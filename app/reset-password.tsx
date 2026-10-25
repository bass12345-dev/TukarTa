import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle2, Lock } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { KeyboardScreen } from '../components/ui/KeyboardScreen';
import { TextField } from '../components/ui/TextField';
import { useAppTheme } from '../context/theme';
import { describeAuthUrl, extractAndSetSessionFromUrl, supabase } from '../utils/supabase';

const MIN_PASSWORD_LENGTH = 8;

type Phase = 'verifying' | 'ready' | 'invalid' | 'done';

/** Opened from the password-reset email (tukarta://reset-password#access_token=...). */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const incomingUrl = Linking.useURL();
  const [phase, setPhase] = React.useState<Phase>('verifying');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [touched, setTouched] = React.useState({ password: false, confirm: false });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = incomingUrl ?? (await Linking.getInitialURL());
      console.log('[ResetPassword] url =', describeAuthUrl(url));
      if (url) {
        const result = await extractAndSetSessionFromUrl(url);
        if (cancelled) return;
        if (result.success) {
          setPhase('ready');
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      // Only trust an existing session if we were handed a recovery link; otherwise the link is invalid/expired.
      setPhase(data.session && url ? 'ready' : 'invalid');
    })().catch(() => !cancelled && setPhase('invalid'));
    return () => {
      cancelled = true;
    };
  }, [incomingUrl]);

  const passwordError =
    touched.password && password && password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined;
  const confirmError =
    touched.confirm && confirmPassword && confirmPassword !== password
      ? 'Passwords do not match.'
      : undefined;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password;

  const handleSave = async () => {
    if (!canSubmit) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPhase('done');
    } catch (error: any) {
      Alert.alert('Could Not Update Password', error?.message || 'Please request a new reset link.');
    } finally {
      setIsSaving(false);
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
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.topAccent} />
          <View style={styles.cardInner}>
            {phase === 'verifying' && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Verifying your reset link…</Text>
              </View>
            )}

            {phase === 'invalid' && (
              <View style={styles.centerBox}>
                <Text style={[styles.title, { color: colors.text }]}>Link expired</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  This reset link is invalid or has expired. Request a new one to continue.
                </Text>
                <Button variant="mint" title="Request New Link" onPress={() => router.replace('/forgot-password')} />
                <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkBtn}>
                  <Text style={[styles.linkText, { color: colors.textSecondary }]}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {phase === 'ready' && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Set a new password</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Choose a password you haven't used before.
                </Text>
                <TextField
                  label="New Password"
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  secureTextEntry
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  error={passwordError}
                  leftIcon={<Lock size={18} color={colors.primary} />}
                />
                <TextField
                  label="Confirm New Password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                  error={confirmError}
                  leftIcon={<Lock size={18} color={colors.primary} />}
                />
                <Button
                  variant="mint"
                  title={isSaving ? 'Saving...' : 'Update Password'}
                  onPress={handleSave}
                  disabled={isSaving || !canSubmit}
                  style={!canSubmit ? { opacity: 0.55 } : undefined}
                />
              </>
            )}

            {phase === 'done' && (
              <View style={styles.centerBox}>
                <CheckCircle2 size={44} color="#10B981" />
                <Text style={[styles.title, { color: colors.text }]}>Password updated</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  You're signed in with your new password.
                </Text>
                <Button variant="mint" title="Continue" onPress={() => router.replace('/(tabs)')} />
              </View>
            )}
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', marginTop: 24 },
  topAccent: { height: 3, backgroundColor: '#10B981', width: '100%' },
  cardInner: { padding: 22 },
  centerBox: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  title: { fontFamily: 'DM Sans', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  linkBtn: { paddingVertical: 6 },
  linkText: { fontSize: 13, fontWeight: '600' },
});
