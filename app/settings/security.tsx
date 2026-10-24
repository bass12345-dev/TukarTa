import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, TextInput, Alert, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Lock, ShieldCheck, Eye, EyeOff, ShieldAlert, Smartphone } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      if (Platform.OS === 'web') {
        window.alert('Please fill out all password fields');
      } else {
        Alert.alert('Incomplete Fields', 'Please fill out all password fields');
      }
      return;
    }
    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Passwords do not match');
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
      return;
    }
    if (Platform.OS === 'web') {
      window.alert('Password updated successfully');
    } else {
      Alert.alert('Success', 'Password updated successfully');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CHANGE PASSWORD</Text>
          <View style={[styles.formCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.inputItem}>
              <Lock size={18} color={colors.textDim} />
              <TextInput 
                style={[styles.input, { color: colors.inputText }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholder="Current Password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPass}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} color={colors.textDim} /> : <Eye size={18} color={colors.textDim} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.hr, { backgroundColor: colors.border }]} />

            <View style={styles.inputItem}>
              <Lock size={18} color={colors.textDim} />
              <TextInput 
                style={[styles.input, { color: colors.inputText }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholder="New Password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPass}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={[styles.hr, { backgroundColor: colors.border }]} />

            <View style={styles.inputItem}>
              <Lock size={18} color={colors.textDim} />
              <TextInput 
                style={[styles.input, { color: colors.inputText }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.updateBtn, { backgroundColor: colors.primary }]} 
            onPress={handleUpdatePassword}
            activeOpacity={0.85}
          >
            <Text style={styles.updateBtnText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* 2FA Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AUTHENTICATION</Text>
          <View style={[styles.featureCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.featureLeft}>
              <View style={[styles.iconBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Smartphone size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Two-Factor Authentication</Text>
                <Text style={[styles.featureSub, { color: colors.textDim }]}>
                  Require a verification code on every new sign in
                </Text>
              </View>
            </View>
            <Switch 
              value={twoFactor} 
              onValueChange={setTwoFactor} 
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : (twoFactor ? '#FFFFFF' : '#9CA3AF')}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DATA ACCESS</Text>
          <View style={[styles.featureCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.featureLeft}>
              <View style={[styles.iconBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <ShieldCheck size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Cloud Setlist Backup</Text>
                <Text style={[styles.featureSub, { color: colors.textDim }]}>
                  Automated encrypted sync with PostgreSQL Supabase
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: Platform.OS === 'ios' ? 100 : 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: 'DM Sans',
    paddingLeft: 4,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
  },
  updateBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  updateBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  featureCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  featureLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 10,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
});
