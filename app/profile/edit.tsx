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
  ArrowLeft, 
  Camera, 
  User, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Globe,
  Music,
  DollarSign,
  MapPin,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { LocationPicker } from '../../components/ui/LocationPicker';
import { useAppTheme } from '../../context/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: string | null; lng: string | null }>({ lat: null, lng: null });
  const [showPicker, setShowPicker] = useState(false);

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
        setDisplayName(data.display_name || user?.user_metadata?.full_name || '');
        setLocation(data.city || '');
        if (data.lat && data.lng) {
          setCoords({ lat: data.lat.toString(), lng: data.lng.toString() });
        }
        
        // Profiles
        const profile = Array.isArray(data.musician_profiles) 
          ? data.musician_profiles[0] 
          : data.musician_profiles;
          
        if (profile) {
          setRole(profile.roles ? profile.roles.join(', ') : '');
          setRate(profile.rate_amount ? profile.rate_amount.toString() : '');
        }
      }
    } catch (err: any) {
      console.error('Fetch profile error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      
      const rolesArray = role.split(',').map(r => r.trim()).filter(Boolean);
      const rateNum = rate ? parseFloat(rate) : null;

      // 1. Update basic users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          city: location,
          lat: coords.lat ? parseFloat(coords.lat) : null,
          lng: coords.lng ? parseFloat(coords.lng) : null,
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      // 2. Update musician_profiles
      const { error: profileError } = await supabase
        .from('musician_profiles')
        .update({
          roles: rolesArray,
          rate_amount: rateNum,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.bgSecondary, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving}
          style={styles.doneBtnBox}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text style={styles.doneBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Info Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#16382C' : '#F0FDF4', borderColor: colors.border }]}>
              <User size={44} color="#10B981" />
            </View>
            <TouchableOpacity style={styles.cameraIcon}>
              <Camera size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarSubtext, { color: colors.textSecondary }]}>Change profile photo</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERAL INFO</Text>
          <View style={[styles.cardBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.inputItem}>
              <User size={18} color="#10B981" />
              <TextInput 
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Full Name"
                placeholderTextColor={colors.inputPlaceholder}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
            <View style={[styles.hr, { backgroundColor: colors.border }]} />
            <View style={styles.inputItem}>
              <Text style={[styles.atSymbol, { color: colors.textSecondary }]}>@</Text>
              <TextInput 
                style={[styles.input, { color: colors.textSecondary }]}
                placeholder="handle"
                placeholderTextColor={colors.inputPlaceholder}
                editable={false}
                value={displayName.toLowerCase().replace(/\s+/g, '')}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MUSICIAN DETAILS</Text>
          <View style={[styles.cardBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.inputItem}>
              <Music size={18} color="#10B981" />
              <TextInput 
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Primary Role (e.g. Singer, Guitarist)"
                placeholderTextColor={colors.inputPlaceholder}
                value={role}
                onChangeText={setRole}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LOCATION & RATE</Text>
          <View style={[styles.cardBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.inputItem} 
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <MapPin size={18} color="#10B981" />
              <View style={styles.locationDisplay}>
                <Text style={[styles.locationText, { color: location ? colors.text : colors.inputPlaceholder }]}>
                  {location || 'Select City'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.hr, { backgroundColor: colors.border }]} />
            <View style={styles.inputItem}>
              <DollarSign size={18} color="#10B981" />
              <TextInput 
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Hourly or Per Gig Rate (₱)"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
              />
            </View>
          </View>
        </View>

        <LocationPicker
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={(loc) => {
            setLocation(loc.city);
            setCoords({ lat: loc.lat, lng: loc.lng });
          }}
        />

        {/* Security Section */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY & PRIVACY</Text>
          <View style={[styles.cardBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SecurityLink label="Change Password" Icon={Lock} colors={colors} />
            <SecurityLink label="Two-Factor Auth" Icon={ShieldCheck} status="Off" colors={colors} />
            <SecurityLink label="Bio Visibility" Icon={Eye} status="Public" colors={colors} />
            <SecurityLink label="Location Sharing" Icon={Globe} status="On" isLast colors={colors} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SecurityLink({ label, Icon, status, isLast, colors }: any) {
  return (
    <View>
      <TouchableOpacity style={styles.securityItem} activeOpacity={0.7}>
        <View style={styles.securityLabelRow}>
          <Icon size={18} color="#10B981" />
          <Text style={[styles.securityText, { color: colors.text }]}>{label}</Text>
        </View>
        <View style={styles.securityRight}>
          {status && <Text style={[styles.securityStatus, { color: colors.textSecondary }]}>{status}</Text>}
          <ChevronRight size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {!isLast && <View style={[styles.hr, { backgroundColor: colors.border }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  doneBtnBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  doneBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSubtext: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
    height: '100%',
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
    marginHorizontal: 16,
  },
  locationDisplay: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  securityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityText: {
    fontSize: 14.5,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  securityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityStatus: {
    fontSize: 13,
    fontFamily: 'DM Sans',
  },
});
