import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Bell, MessageSquare, Music, Star, Zap } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../../utils/hooks/useMessaging';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { data: saved } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const settings = saved ?? DEFAULT_NOTIFICATION_SETTINGS;

  const toggle = (key: keyof NotificationSettings) => {
    updateSettings.mutate({ ...settings, [key]: !settings[key] });
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>GIGS & BAND</Text>
          <NotificationToggle 
            label="Gig Invitations" 
            sublabel="When someone invites you to join a gig"
            Icon={Music} 
            value={settings.gigs} 
            onToggle={() => toggle('gigs')} 
            colors={colors}
          />
          <NotificationToggle 
            label="Setlist Updates" 
            sublabel="When a bandleader changes the setlist"
            Icon={Zap} 
            value={settings.setlists} 
            onToggle={() => toggle('setlists')} 
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COMMUNITY</Text>
          <NotificationToggle 
            label="Direct Messages" 
            sublabel="Musicians messaging you about opportunities"
            Icon={MessageSquare} 
            value={settings.messages} 
            onToggle={() => toggle('messages')} 
            colors={colors}
          />
          <NotificationToggle 
            label="Ratings & Reviews" 
            sublabel="When an organizer leaves feedback on your profile"
            Icon={Star} 
            value={settings.reviews} 
            onToggle={() => toggle('reviews')} 
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ANNOUNCEMENTS</Text>
          <NotificationToggle 
            label="Gear Offers & Tips" 
            sublabel="Stage Mode updates, tips, and promotions"
            Icon={Bell} 
            value={settings.offers} 
            onToggle={() => toggle('offers')} 
            colors={colors}
          />
        </View>

      </ScrollView>
    </View>
  );
}

function NotificationToggle({ label, sublabel, Icon, value, onToggle, colors }: any) {
  return (
    <View style={styles.toggleWrapper}>
      <View style={[styles.toggleCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.toggleContent}>
          <View style={styles.toggleLeft}>
            <View style={[styles.iconBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={styles.labelArea}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.toggleSublabel, { color: colors.textDim }]}>{sublabel}</Text>
            </View>
          </View>
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : (value ? '#FFFFFF' : '#9CA3AF')}
          />
        </View>
      </View>
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
  toggleWrapper: {
    marginBottom: 10,
  },
  toggleCard: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 76,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  toggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelArea: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  toggleSublabel: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
});
