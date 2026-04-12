import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  Camera, 
  User, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Globe,
  Music,
  DollarSign
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { GlassCard } from '../../components/ui/GlassCard';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [rate, setRate] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*, musician_profiles(*)')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setDisplayName(data.display_name || '');
        const mProfile = data.musician_profiles?.[0];
        if (mProfile) {
          setRole(mProfile.roles?.[0] || '');
          setRate(mProfile.rate_amount?.toString() || '');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    try {
      setSaving(true);
      
      // 1. Update User Record
      const { error: userError } = await supabase
        .from('users')
        .update({ display_name: displayName })
        .eq('id', user.id);
      
      if (userError) throw userError;

      // 2. Update Musician Profile Record
      const { error: musicianError } = await supabase
        .from('musician_profiles')
        .upsert({ 
          user_id: user.id,
          roles: [role],
          rate_amount: rate ? parseFloat(rate) : null
        }, { onConflict: 'user_id' });

      if (musicianError) throw musicianError;

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#00D4FF" />
          ) : (
            <Text style={styles.doneBtn}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Info Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
               <User size={48} color="#00D4FF" />
            </View>
            <TouchableOpacity style={styles.cameraIcon}>
              <Camera size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarSubtext}>Tap to change photo</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>GENERAL INFO</Text>
          <GlassCard style={styles.inputGroup} intensity={12}>
            <View style={styles.inputItem}>
              <User size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
            <View style={styles.hr} />
            <View style={styles.inputItem}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput 
                style={styles.input}
                placeholder="handle"
                placeholderTextColor="rgba(255,255,255,0.2)"
                editable={false} // Placeholder for handle logic
                value={displayName.toLowerCase().replace(' ', '')}
              />
            </View>
          </GlassCard>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>MUSICIAN DETAILS</Text>
          <GlassCard style={styles.inputGroup} intensity={12}>
            <View style={styles.inputItem}>
              <Music size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="Primary Role (e.g. Singer)"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={role}
                onChangeText={setRole}
              />
            </View>
            <View style={styles.hr} />
            <View style={styles.inputItem}>
              <DollarSign size={18} color="rgba(255,255,255,0.4)" />
              <TextInput 
                style={styles.input}
                placeholder="Hourly Rate (₱)"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
              />
            </View>
          </GlassCard>
        </View>

        {/* Security Section (Based on screenshot) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>SECURITY & PRIVACY</Text>
          <GlassCard style={styles.inputGroup} intensity={12}>
            <SecurityLink label="Change Password" Icon={Lock} />
            <SecurityLink label="Two-Factor Auth" Icon={ShieldCheck} status="Off" />
            <SecurityLink label="Bio Visibility" Icon={Eye} status="Public" />
            <SecurityLink label="Location Sharing" Icon={Globe} status="On" />
          </GlassCard>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SecurityLink({ label, Icon, status }: any) {
  return (
    <View>
      <TouchableOpacity style={styles.securityItem} activeOpacity={0.7}>
        <View style={styles.securityLabelRow}>
          <Icon size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.securityText}>{label}</Text>
        </View>
        <View style={styles.securityRight}>
          {status && <Text style={styles.securityStatus}>{status}</Text>}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.hr} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  doneBtn: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00D4FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#071420',
  },
  avatarSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 12,
    fontFamily: 'DM Sans',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: 'DM Sans Bold',
  },
  inputGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  atSymbol: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
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
    marginLeft: 46,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  securityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityText: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans',
  },
  securityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  chevron: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.2)',
    marginTop: -2,
  }
});
