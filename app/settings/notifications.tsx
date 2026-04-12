import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell, MessageSquare, Music, Star, Zap } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    gigs: true,
    messages: true,
    setlists: true,
    reviews: false,
    offers: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GIGS & BAND</Text>
          <NotificationToggle 
            label="Gig Invitations" 
            sublabel="When someone invites you to join a gig"
            Icon={Music} 
            value={settings.gigs} 
            onToggle={() => toggle('gigs')} 
          />
          <NotificationToggle 
            label="Setlist Updates" 
            sublabel="When a bandleader changes the setlist"
            Icon={Zap} 
            value={settings.setlists} 
            onToggle={() => toggle('setlists')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMUNICATION</Text>
          <NotificationToggle 
            label="Direct Messages" 
            sublabel="Alerts for new chat messages"
            Icon={MessageSquare} 
            value={settings.messages} 
            onToggle={() => toggle('messages')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PLATFORM</Text>
          <NotificationToggle 
            label="Ratings & Reviews" 
            sublabel="When a student or band leaves a review"
            Icon={Star} 
            value={settings.reviews} 
            onToggle={() => toggle('reviews')} 
          />
          <NotificationToggle 
            label="Marketplace Offers" 
            sublabel="Special deals on gear and services"
            Icon={Zap} 
            value={settings.offers} 
            onToggle={() => toggle('offers')} 
          />
        </View>

        <TouchableOpacity style={styles.systemSettingsBtn}>
           <Text style={styles.systemSettingsText}>Manage System Notifications</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function NotificationToggle({ label, sublabel, Icon, value, onToggle }: any) {
  return (
    <View style={styles.toggleWrapper}>
      <GlassCard style={styles.toggleCard} intensity={12} noPadding contentContainerStyle={styles.toggleContent}>
        <View style={styles.toggleLeft}>
          <View style={styles.iconBubble}>
            <Icon size={18} color="#00D4FF" />
          </View>
          <View style={styles.labelArea}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Text style={styles.toggleSublabel}>{sublabel}</Text>
          </View>
        </View>
        <Switch 
          value={value} 
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.05)', true: 'rgba(0, 212, 255, 0.4)' }}
          thumbColor={value ? '#00D4FF' : '#455a64'}
          ios_backgroundColor="rgba(255,255,255,0.05)"
        />
      </GlassCard>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
    fontFamily: 'DM Sans Bold',
  },
  toggleWrapper: {
    marginBottom: 12,
  },
  toggleCard: {
    borderRadius: 20,
    minHeight: 80,
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
    gap: 16,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelArea: {
    flex: 1,
    paddingRight: 10,
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
    lineHeight: 16,
  },
  systemSettingsBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  systemSettingsText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontFamily: 'DM Sans Medium',
    textDecorationLine: 'underline',
  }
});
