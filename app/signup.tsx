import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { ArrowLeft, Mail, Lock, User, Music2, CheckCircle2 } from 'lucide-react-native';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { useAppTheme } from '../context/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing Fields', 'Please fill in all fields (Name, Email, Password).');
      return;
    }

    try {
      setIsLoggingIn(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.brandBadge}>
            <Music2 size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </View>

        {/* ── Auth Card ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.authCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.topAccent} />

            <View style={styles.authCardInner}>
              {isSubmitted ? (
                <View style={styles.successView}>
                  <View style={[styles.successIconBubble, { backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4', borderColor: colors.border }]}>
                    <CheckCircle2 size={36} color="#10B981" />
                  </View>
                  <Text style={[styles.successTitle, { color: colors.text }]}>Check your email</Text>
                  <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                    We've sent a verification link to <Text style={[styles.successEmail, { color: colors.primary }]}>{email}</Text>. Please click it to activate your account.
                  </Text>
                  <Button 
                    variant="mint"
                    title="Back to Sign In" 
                    onPress={() => router.replace('/login')}
                  />
                </View>
              ) : (
                <>
                  <Text style={[styles.authTitle, { color: colors.text }]}>Create Account</Text>
                  <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
                    Join TukarTa to manage setlists, extract songs, and sync with fellow bandmates.
                  </Text>

                  <View style={styles.form}>
                    <TextField
                      label="Full Name"
                      placeholder="e.g. Ely Buendia"
                      value={fullName}
                      onChangeText={setFullName}
                      leftIcon={<User size={18} color={colors.primary} />}
                    />
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
                      title={isLoggingIn ? 'Creating account...' : 'Create Account'}
                      onPress={handleSignup}
                      disabled={isLoggingIn}
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.toggleMode}
                    onPress={() => router.push('/login')}
                  >
                    <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                      Already have an account? <Text style={styles.toggleHighlight}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
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
  authTitle: {
    fontFamily: 'DM Sans',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  toggleMode: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
  },
  toggleHighlight: {
    color: '#10B981',
    fontWeight: '700',
  },
  successView: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  successIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontFamily: 'DM Sans',
    fontSize: 20,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  successEmail: {
    fontWeight: '700',
  },
});
