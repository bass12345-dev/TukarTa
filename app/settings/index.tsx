import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  CreditCard
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { GlassCard } from '../../components/ui/GlassCard';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <SettingsItem 
            label="Update Profile" 
            sublabel="Identity, Role, and Rates"
            Icon={User} 
            onPress={() => router.push('/profile/edit')} 
          />
          <SettingsItem 
            label="Professional Subscription" 
            sublabel="Manage your plan"
            Icon={CreditCard} 
            onPress={() => {}} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <SettingsItem 
            label="Notification Settings" 
            sublabel="Alerts, Gigs, and Messages"
            Icon={Bell} 
            onPress={() => {}} 
          />
          <SettingsItem 
            label="Security & Privacy" 
            sublabel="Password and 2FA"
            Icon={ShieldCheck} 
            onPress={() => {}} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <SettingsItem 
            label="Help & Support" 
            sublabel="FAQs and Contact"
            Icon={HelpCircle} 
            onPress={() => {}} 
          />
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <GlassCard style={styles.logoutCard} intensity={20}>
            <LogOut size={20} color="#FF4B4B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </GlassCard>
        </TouchableOpacity>

        <Text style={styles.version}>TukarTa v1.0.4 (Beta)</Text>
      </ScrollView>
    </View>
  );
}

function SettingsItem({ label, sublabel, Icon, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.itemWrapper}>
      <GlassCard style={styles.itemCard} intensity={12} noPadding contentContainerStyle={styles.itemContent}>
        <View style={styles.itemLeft}>
          <View style={styles.iconBubble}>
            <Icon size={20} color="#00D4FF" />
          </View>
          <View>
            <Text style={styles.itemLabel}>{label}</Text>
            {sublabel && <Text style={styles.itemSublabel}>{sublabel}</Text>}
          </View>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
      </GlassCard>
    </TouchableOpacity>
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
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: 'DM Sans Bold',
    paddingLeft: 4,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  itemCard: {
    height: 72,
    borderRadius: 20,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  itemSublabel: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  logoutCard: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.2)',
  },
  logoutText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.15)',
    fontSize: 12,
    marginTop: 30,
    fontFamily: 'DM Sans',
  }
});
