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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';

export default function SignupScreen() {
  const router = useRouter();
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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color="#00D4FF" />
          </TouchableOpacity>
        </View>

        {/* ── Focused Auth Card ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.authCard}>
            <View style={[styles.topAccent, { backgroundColor: '#00D4FF' }]} />

            <View style={styles.authCardInner}>
              {isSubmitted ? (
                <View style={styles.successView}>
                  <View style={styles.successIconBubble}>
                    <Mail size={32} color="#00D4FF" />
                  </View>
                  <Text style={styles.successTitle}>Check your email</Text>
                  <Text style={styles.successSubtitle}>
                    We've sent a confirmation link to <Text style={styles.successEmail}>{email}</Text>. Please click the link in the email to activate your account.
                  </Text>
                  <Button 
                    title="Back to Log In" 
                    onPress={() => router.replace('/login')}
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.authTitle}>Create Account</Text>
                  <Text style={styles.authSubtitle}>Join the Cebuano musicians network and build smarter setlists.</Text>

                  <View style={styles.form}>
                    <TextField
                      label="Full Name"
                      placeholder="Marco Rivera"
                      value={fullName}
                      onChangeText={setFullName}
                      leftIcon={<User size={18} color="#FFF" />}
                    />
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
                      title={isLoggingIn ? 'Creating account...' : 'Create Account'}
                      onPress={handleSignup}
                      disabled={isLoggingIn}
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.toggleMode}
                    onPress={() => router.replace('/login')}
                  >
                    <Text style={styles.toggleText}>
                      Already have an account? Log In
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.footerText}>
                    By signing up, you agree to our{' '}
                    <Text style={styles.footerLink}>Terms</Text> &{' '}
                    <Text style={styles.footerLink}>Privacy Policy</Text>
                  </Text>
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
    backgroundColor: '#071420',
  },
  orbTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 212, 255, 0.07)',
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(139, 92, 246, 0.07)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  authCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    width: '100%',
    opacity: 0.9,
  },
  authCardInner: {
    padding: 20,
    gap: 14,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  authSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'DM Sans',
    lineHeight: 20,
    marginBottom: 10,
  },
  form: {
    gap: 4,
  },
  toggleMode: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleText: {
    color: '#00D4FF',
    fontSize: 14,
    fontFamily: 'DM Sans Medium',
    opacity: 0.8,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.3)',
    fontFamily: 'DM Sans',
    lineHeight: 18,
    marginTop: 10,
  },
  footerLink: {
    color: 'rgba(0, 212, 255, 0.5)',
  },
  successView: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  successIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  successEmail: {
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
});
