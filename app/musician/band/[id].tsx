import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  Users,
  Music,
  MapPin,
  Calendar,
  UserPlus,
  Crown,
  Radio,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useBandDetails, useBandMembers, useMyGigs } from '../../../utils/hooks/useMusician';
import { useTransferLeadership } from '../../../utils/hooks/useRehearsals';
import { useAuth } from '../../../context/auth';
import { useAppTheme } from '../../../context/theme';
import { supabase } from '../../../utils/supabase';

export default function BandHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();

  const { data: band, isLoading: loadingBand } = useBandDetails(id);
  const { data: members, isLoading: loadingMembers } = useBandMembers(id);
  const { data: allGigs } = useMyGigs();
  const transferLeadership = useTransferLeadership(id!);

  const confirmTransfer = (memberUserId: string, name: string) => {
    const doTransfer = () =>
      transferLeadership.mutate(memberUserId, {
        onError: (e: any) => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(e.message);
          else Alert.alert('Could not pass leadership', e.message);
        },
      });
    const message = `${name} will become the band leader. You stay in the band as a member.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) doTransfer();
    } else {
      Alert.alert('Make band leader?', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Make leader', onPress: doTransfer },
      ]);
    }
  };

  const bandGigs = (allGigs || []).filter((g: any) => g.band_id === id);

  const { data: setlistCount } = useQuery({
    queryKey: ['band-setlist-count', id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from('setlists')
        .select('id', { count: 'exact', head: true })
        .eq('band_id', id);
      return count || 0;
    },
  });

  if (loadingBand) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!band) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, gap: 16 }]}>
        <Text style={{ color: colors.textDim, fontSize: 16 }}>Band not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backLink, { backgroundColor: colors.bgSecondary }]}
        >
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLeader = band.leader_id === user?.id;
  const initials = (band.name || 'B')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const activeMembers = (members || []).filter((m: any) => m.status === 'active');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Band Profile</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.bandName, { color: colors.text }]}>{band.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#10B981" />
            <Text style={{ color: colors.textDim, fontSize: 13 }}>{band.city || 'Philippines'}</Text>
          </View>

          {band.genres?.length > 0 && (
            <View style={styles.genreTags}>
              {band.genres.map((g: string) => (
                <View
                  key={g}
                  style={[styles.genrePill, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}
                >
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {isLeader && (
            <View style={[styles.leaderBadge, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <Crown size={12} color="#10B981" />
              <Text style={styles.leaderBadgeText}>YOU LEAD THIS BAND</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: Users, label: 'Members', value: activeMembers.length, color: '#10B981' },
            { icon: Calendar, label: 'Gigs', value: bandGigs.length, color: '#F59E0B' },
            { icon: Music, label: 'Setlists', value: setlistCount ?? 0, color: '#6366F1' },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <s.icon size={20} color={s.color} />
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => router.push(`/band-practice/${id}`)}
          >
            <BookOpen size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: colors.text }]}>Band Practice & Dictionary</Text>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/setlists')}
          >
            <Calendar size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: colors.text }]}>Manage Gigs & Setlists</Text>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/bands')}
          >
            <Radio size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: colors.text }]}>Start a Live Session</Text>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              MEMBERS ({members?.length || 0})
            </Text>
            {isLeader && (
              <TouchableOpacity
                style={[styles.inviteBtn, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}
                onPress={() => router.push('/(tabs)/discover')}
              >
                <UserPlus size={15} color="#10B981" />
                <Text style={styles.inviteText}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ gap: 10 }}>
            {members?.map((member: any) => {
              const isActive = member.status === 'active';
              const memberIsLeader = member.user_id === band.leader_id || member.role === 'leader';
              return (
                <View
                  key={member.id}
                  style={[styles.memberItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: colors.bgSecondary }]}>
                    {memberIsLeader ? (
                      <Crown size={18} color="#10B981" />
                    ) : (
                      <Users size={18} color={colors.textDim} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.user?.display_name || 'Musician'}
                      {member.user_id === user?.id ? ' (You)' : ''}
                    </Text>
                    <Text style={{ color: colors.textDim, fontSize: 12 }}>
                      {(member.role || 'member').toString().replace(/^./, (c: string) => c.toUpperCase())}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' },
                    ]}
                  >
                    <Text style={{ color: isActive ? '#10B981' : '#F59E0B', fontSize: 10, fontWeight: '800' }}>
                      {isActive ? 'JOINED' : 'PENDING'}
                    </Text>
                  </View>
                  {isLeader && isActive && !memberIsLeader && (
                    <TouchableOpacity
                      onPress={() => confirmTransfer(member.user_id, member.user?.display_name || 'This member')}
                      style={[styles.leaderBtn, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}
                      accessibilityLabel={`Make ${member.user?.display_name || 'this member'} the band leader`}
                    >
                      <Crown size={13} color="#10B981" />
                      <Text style={styles.inviteText}>Make leader</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {loadingMembers && <ActivityIndicator size="small" color="#10B981" />}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  scrollContent: { paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' },
  profileSection: { alignItems: 'center', marginTop: 24, marginBottom: 24, paddingHorizontal: 20 },
  avatar: { width: 92, height: 92, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  bandName: { fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  genreTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  genrePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  genreText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  leaderBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  actionsCol: { paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  inviteText: { fontSize: 12, color: '#10B981', fontWeight: '800' },
  memberItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 12, gap: 12, borderWidth: 1 },
  memberAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 15, fontWeight: '700' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  leaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
});
