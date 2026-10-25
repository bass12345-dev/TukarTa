import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Alert 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  CreditCard,
  Sun,
  Moon,
  Laptop,
  Music,
  CheckCircle2,
  Check
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useAppTheme, ThemeMode } from '../../context/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { themeMode, setThemeMode, isDark, colors } = useAppTheme();

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut();
        router.replace('/login');
      } catch (err) {
        console.error('Error signing out:', err);
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        await doLogout();
      }
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of TukarTa?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout }
      ]
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Appearance / Theme Switcher */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.themeCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.themeCardLabel, { color: colors.text }]}>Theme Mode</Text>
            <Text style={[styles.themeCardSub, { color: colors.textDim }]}>
              Choose how TukarTa looks on your device
            </Text>

            <View style={styles.themeOptionsRow}>
              <ThemeOptionButton
                label="Light"
                icon={Sun}
                isSelected={themeMode === 'light'}
                onPress={() => setThemeMode('light')}
                colors={colors}
              />
              <ThemeOptionButton
                label="Dark"
                icon={Moon}
                isSelected={themeMode === 'dark'}
                onPress={() => setThemeMode('dark')}
                colors={colors}
              />
              <ThemeOptionButton
                label="System"
                icon={Laptop}
                isSelected={themeMode === 'system'}
                onPress={() => setThemeMode('system')}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
          <SettingsItem 
            label="Update Profile" 
            sublabel="Identity, Role, and Gig Rates"
            Icon={User} 
            onPress={() => router.push('/profile/edit')} 
            colors={colors}
          />
          <SettingsItem 
            label="My Song Dictionary" 
            sublabel="Repertoire, Live Readiness, and Chords"
            Icon={Music} 
            onPress={() => router.push('/profile/songs')} 
            colors={colors}
          />
          <SettingsItem 
            label="Professional Subscription" 
            sublabel="Manage Pro plan and offline gig cache"
            Icon={CreditCard} 
            onPress={() => router.push('/settings/subscription')} 
            colors={colors}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
          <SettingsItem 
            label="Notification Settings" 
            sublabel="Gig alerts, Band invites, and Reminders"
            Icon={Bell} 
            onPress={() => router.push('/settings/notifications')} 
            colors={colors}
          />
          <SettingsItem 
            label="Security & Privacy" 
            sublabel="Password, Session and Account Security"
            Icon={ShieldCheck} 
            onPress={() => router.push('/settings/security')} 
            colors={colors}
          />
        </View>

        {/* Offline Readiness Banner */}
        <View style={styles.section}>
          <View style={[styles.statusBanner, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={[styles.statusIconBox, { backgroundColor: colors.primaryLight }]}>
              <CheckCircle2 size={20} color={colors.primary} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>Offline Stage Sync</Text>
              <Text style={[styles.statusSub, { color: colors.textDim }]}>
                Setlists & lyrics are cached locally for zero-latency gigs
              </Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT & ABOUT</Text>
          <SettingsItem 
            label="Help & Support" 
            sublabel="FAQs, Stage Mode tips, and Contact"
            Icon={HelpCircle} 
            onPress={() => router.push('/settings/support')} 
            colors={colors}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.logoutCardWrapper, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textDim }]}>
          TukarTa v1.0.4 • Built for Live Performing Bands
        </Text>
      </ScrollView>
    </View>
  );
}

function ThemeOptionButton({ label, icon: Icon, isSelected, onPress, colors }: any) {
  return (
    <TouchableOpacity 
      style={[
        styles.themeOptionBtn, 
        { 
          backgroundColor: isSelected ? colors.primaryLight : colors.bg,
          borderColor: isSelected ? colors.primary : colors.border
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={20} color={isSelected ? colors.primaryDark : colors.textMuted} />
      <Text 
        style={[
          styles.themeOptionText, 
          { 
            color: isSelected ? colors.primaryDark : colors.text,
            fontWeight: isSelected ? '800' : '600'
          }
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
          <Check size={10} color="#FFF" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function SettingsItem({ label, sublabel, Icon, onPress, colors }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.itemWrapper}>
      <View 
        style={[
          styles.itemCard, 
          { 
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }
        ]}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.iconBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Icon size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
            {sublabel && (
              <Text style={[styles.itemSublabel, { color: colors.textDim }]} numberOfLines={1}>
                {sublabel}
              </Text>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={colors.textDim} />
      </View>
    </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
    paddingTop: 20,
  },
  section: {
    marginBottom: 26,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: 'DM Sans',
    paddingLeft: 4,
  },
  themeCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  themeCardLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  themeCardSub: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    marginTop: 2,
    marginBottom: 16,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  themeOptionText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWrapper: {
    marginBottom: 10,
  },
  itemCard: {
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  itemSublabel: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  statusIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  statusSub: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  logoutCardWrapper: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
    fontFamily: 'DM Sans',
  }
});
