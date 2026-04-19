import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ChevronLeft, 
  Users, 
  Music, 
  MapPin, 
  Plus, 
  Settings, 
  Calendar,
  Share2,
  UserPlus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBandDetails, useBandMembers } from '../../../utils/hooks/useMusician';
import { useAuth } from '../../../context/auth';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Pill } from '../../../components/ui/Pill';

const { width } = Dimensions.get('window');

export default function BandHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: band, isLoading: loadingBand } = useBandDetails(id);
  const { data: members, isLoading: loadingMembers } = useBandMembers(id);

  if (loadingBand) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  if (!band) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Band not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLeader = band.leader_id === user?.id;
  const initials = band.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Band Hub</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Settings size={22} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Profile Header ── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#00D4FF', '#8B5CF6']} style={styles.avatarGradient} />
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.bandName}>{band.name}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#00D4FF" />
            <Text style={styles.locationText}>{band.city || 'Philippines'}</Text>
          </View>
          
          <View style={styles.genreTags}>
            {band.genres?.map((g: string) => (
              <Pill key={g} label={g} variant="cyan" />
            ))}
          </View>
        </View>

        {/* ── Action Grid ── */}
        <View style={styles.actionGrid}>
          <ActionCard icon={Calendar} title="Manage Gigs" count="3" color="#00D4FF" />
          <ActionCard icon={Music} title="Setlists" count="12" color="#8B5CF6" />
        </View>

        {/* ── Members Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MEMBERS</Text>
            {isLeader && (
              <TouchableOpacity 
                style={styles.addMemberBtn}
                onPress={() => router.push('/(tabs)/discover')} // Redirect to discover to find musicians
              >
                <UserPlus size={16} color="#00D4FF" />
                <Text style={styles.addMemberText}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.memberList}>
            {members?.map((member: any) => (
              <MemberListItem key={member.id} member={member} />
            ))}
            {loadingMembers && <ActivityIndicator size="small" color="rgba(255,255,255,0.2)" />}
          </View>
        </View>

        {/* ── Invitation Card (Demo/Mock for Leader) ── */}
        {isLeader && (
            <GlassCard style={styles.invitePromo} intensity={15}>
                 <View style={styles.promoIcon}>
                    <Share2 size={24} color="#00D4FF" />
                 </View>
                 <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>Invite via Email</Text>
                    <Text style={styles.promoSub}>Send a private link to your musician</Text>
                 </View>
                 <TouchableOpacity style={styles.promoAction}>
                    <Text style={styles.promoActionText}>Share</Text>
                 </TouchableOpacity>
            </GlassCard>
        )}

      </ScrollView>
    </View>
  );
}

function ActionCard({ icon: Icon, title, count, color }: any) {
  return (
    <TouchableOpacity style={styles.actionCardWrapper} activeOpacity={0.8}>
      <GlassCard style={styles.actionCard} intensity={10}>
        <View style={[styles.actionIconBox, { backgroundColor: `${color}15` }]}>
          <Icon size={22} color={color} />
        </View>
        <Text style={styles.actionCount}>{count}</Text>
        <Text style={styles.actionTitle}>{title}</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

function MemberListItem({ member }: any) {
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
         <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
         <Users size={18} color="rgba(255,255,255,0.2)" />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.user?.display_name}</Text>
        <Text style={styles.memberRole}>{member.role || 'Member'}</Text>
      </View>
      <Pill label={member.status === 'active' ? 'JOINED' : 'PENDING'} variant={member.status === 'active' ? 'cyan' : 'purple'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071420' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#071420' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#071420', gap: 20 },
  errorText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontFamily: 'DM Sans' },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  backLinkText: { color: '#00D4FF', fontSize: 14, fontFamily: 'DM Sans Bold' },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    zIndex: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans Bold' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  avatarContainer: { width: 100, height: 100, borderRadius: 34, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 20 },
  avatarGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.2 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#00D4FF', fontFamily: 'DM Sans Bold' },
  bandName: { fontSize: 26, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold', marginBottom: 8 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  locationText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans' },
  genreTags: { flexDirection: 'row', gap: 8 },
  actionGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32 },
  actionCardWrapper: { flex: 1 },
  actionCard: { borderRadius: 24, padding: 16 },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionCount: { fontSize: 20, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold', marginBottom: 2 },
  actionTitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans Bold' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, fontFamily: 'DM Sans Bold' },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0, 212, 255, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addMemberText: { fontSize: 12, color: '#00D4FF', fontWeight: '700', fontFamily: 'DM Sans Bold' },
  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 12, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  memberAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  memberRole: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans' },
  invitePromo: { marginHorizontal: 20, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: 'rgba(0, 212, 255, 0.2)' },
  promoIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 212, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', marginTop: 2 },
  promoAction: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#00D4FF' },
  promoActionText: { fontSize: 12, fontWeight: '700', color: '#071420', fontFamily: 'DM Sans Bold' }
});
