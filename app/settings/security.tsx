import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, TextInput, Alert, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock, ShieldCheck, Eye, EyeOff, ShieldAlert, Smartphone } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export default function SecurityScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    Alert.alert('Success', 'Password updated successfully');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHANGE PASSWORD</Text>
          <GlassCard style={styles.formCard} intensity={12}>
            <View style={styles.inputItem}>
              <Lock size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="rgba(255,255,255,0.2)"
                secureTextEntry={!showPass}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
              </TouchableOpacity>
            </View>
            <View style={styles.hr} />
            <View style={styles.inputItem}>
              <Lock size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="rgba(255,255,255,0.2)"
                secureTextEntry={!showPass}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <View style={styles.hr} />
            <View style={styles.inputItem}>
              <Lock size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="rgba(255,255,255,0.2)"
                secureTextEntry={!showPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </GlassCard>
          <Button 
            title="Update Password" 
            variant="glass" 
            style={styles.actionBtn}
            onPress={handleUpdatePassword}
          />
        </View>

        {/* 2FA Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TWO-FACTOR AUTHENTICATION</Text>
          <GlassCard style={styles.toggleCard} intensity={12} contentContainerStyle={styles.toggleContent}>
            <View style={styles.toggleLeft}>
              <View style={styles.iconBubble}>
                <Smartphone size={20} color="#00D4FF" />
              </View>
              <View style={styles.labelArea}>
                <Text style={styles.toggleLabel}>2FA Authentication</Text>
                <Text style={styles.toggleSublabel}>Secure your account with a secondary verification code.</Text>
              </View>
            </View>
            <Switch 
              value={twoFactor} 
              onValueChange={setTwoFactor}
              trackColor={{ false: 'rgba(255,255,255,0.05)', true: 'rgba(0, 212, 255, 0.4)' }}
              thumbColor={twoFactor ? '#00D4FF' : '#455a64'}
            />
          </GlassCard>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY SETTINGS</Text>
          <GlassCard style={styles.privacyCard} intensity={12}>
            <PrivacyItem label="Public Profile" sublabel="Allow anyone to view your musician details" active />
            <View style={styles.hr} />
            <PrivacyItem label="Show Rates" sublabel="Display your hourly rate on search results" active />
            <View style={styles.hr} />
            <PrivacyItem label="Online Status" sublabel="Let others see when you are active" />
          </GlassCard>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FF4B4B' }]}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.deleteBtn}>
             <ShieldAlert size={18} color="#FF4B4B" />
             <Text style={styles.deleteText}>Delete Account Permanently</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function PrivacyItem({ label, sublabel, active }: any) {
  return (
    <View style={styles.privacyItem}>
      <View style={styles.privacyInfo}>
        <Text style={styles.privacyLabel}>{label}</Text>
        <Text style={styles.privacySublabel}>{sublabel}</Text>
      </View>
      <Switch 
        value={active} 
        onValueChange={() => {}} 
        trackColor={{ false: 'rgba(255,255,255,0.05)', true: 'rgba(0, 212, 255, 0.4)' }}
        thumbColor={active ? '#00D4FF' : '#455a64'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
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
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
    fontFamily: 'DM Sans Bold',
  },
  formCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 44,
  },
  actionBtn: {
    height: 52,
    borderRadius: 16,
  },
  toggleCard: {
    borderRadius: 20,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelArea: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  toggleSublabel: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
  privacyCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  privacyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  privacyLabel: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  privacySublabel: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.1)',
  },
  deleteText: {
    color: '#FF4B4B',
    fontSize: 15,
    fontFamily: 'DM Sans Bold',
  }
});
