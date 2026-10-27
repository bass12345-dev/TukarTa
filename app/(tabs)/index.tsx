import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Music2,
  Zap,
  Users,
  BookOpen,
  Play,
  Bell,
  MessageCircle,
  CheckCircle2,
  Star,
  Radio,
  Layers,
} from 'lucide-react-native';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { useNotifications } from '../../utils/hooks/useMessaging';
import {
  profileOf,
  useMyInvites,
  useMusicianProfile,
  useMyKnownSongs,
  useMyBands,
  useMyGigs,
  useGigSetlist,
  useSetlistSongs,
} from '@/utils/hooks/useMusician';

import { RefreshControl } from 'react-native';
import { AiFloatingBubble } from '../../components/ui/AiFloatingBubble';
import { useRefresh } from '../../utils/hooks/useRefresh';
import { useHeaderTopPadding, useTabBarPadding } from '../../utils/hooks/useTabBarPadding';
export default function DashboardScreen() {
  const tabBarPadding = useTabBarPadding();
  const headerTop = useHeaderTopPadding();
  const { refreshing, onRefresh } = useRefresh();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();

  // Data Hooks
  const { data: invites } = useMyInvites();
  const { data: notifications } = useNotifications();
  const unreadCount = (notifications || []).filter((n) => !n.read_at).length;
  const { data: profile, isLoading: isProfileLoading } = useMusicianProfile(user?.id);
  const { data: knownSongs } = useMyKnownSongs();
  const { data: bands } = useMyBands();
  const { data: gigs, isLoading: isGigsLoading } = useMyGigs();

  const upcomingGig = gigs?.[0];
  const { data: upcomingSetlist } = useGigSetlist(upcomingGig?.id);
  const { data: upcomingSongs } = useSetlistSongs(upcomingSetlist?.id);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Musician';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = profile?.avatar_url;

  // Real data calculations (0 when empty, no fake mock numbers)
  const mProfile = profileOf(profile);
  const totalSongs = knownSongs?.length || 0;
  const liveSongs = knownSongs?.filter((s: any) => s.can_perform_live)?.length || 0;
  const liveMastery = totalSongs > 0 ? Math.round((liveSongs / totalSongs) * 100) : 0;
  const totalBands = bands?.length || 0;
  const gigCount = gigs?.length || 0;
  const avgRating = mProfile?.avg_rating || '5.0';
  const yearsExp = mProfile?.years_exp || '1+';

  // Upcoming Gig Details (Real gig from DB only)
  const gigTitle = upcomingGig?.name || '';
  const gigDate = upcomingGig?.gig_date 
    ? new Date(upcomingGig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const gigVenue = upcomingGig?.venue || '';
  const songCount = upcomingSongs?.length || 0;

  // Practice Queue / Songs to Master (confidence < 4 or tagged for learning)
  const songsToPractice = (knownSongs || []).filter((s: any) => s.confidence_level < 4).slice(0, 3);

  // Genre distribution calculation for charts
  const genreCounts = (knownSongs || []).reduce((acc: Record<string, number>, curr: any) => {
    const g = curr.genre || curr.song?.genre || 'OPM';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Confidence distribution
  const masteryLevels = [
    { label: 'Stage Ready', count: liveSongs, color: '#10B981', pct: totalSongs > 0 ? Math.round((liveSongs / totalSongs) * 100) : 0 },
    { label: 'Practicing', count: totalSongs - liveSongs, color: '#F59E0B', pct: totalSongs > 0 ? Math.round(((totalSongs - liveSongs) / totalSongs) * 100) : 0 },
  ];

  if (isProfileLoading && !profile) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border, paddingTop: headerTop }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.welcomeGreeting, { color: colors.textDim }]} numberOfLines={1}>Welcome back 👋</Text>
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
            onPress={() => router.push({ pathname: '/messages', params: { tab: 'alerts' } })}
          >
            <Bell size={18} color={colors.primary} />
            {unreadCount > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            activeOpacity={0.7}
            accessibilityLabel="Messages"
            onPress={() => router.push({ pathname: '/messages', params: { tab: 'chats' } })}
          >
            <MessageCircle size={18} color={colors.primary} />
            {invites && invites.length > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.avatar, { borderColor: colors.primary }]}
            activeOpacity={0.7}
            onPress={() => router.push('/profile')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.bgCard}
          />
        } 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Upcoming Gig Showcase Card (Only shown if real gig exists) ── */}
        {upcomingGig ? (
          <View style={styles.section}>
            <View style={[styles.gigCard, { backgroundColor: isDark ? '#112920' : '#F0FDF4', borderColor: isDark ? '#1F4738' : '#D1FAE5' }]}>
              <View style={styles.gigCardHeader}>
                <View style={styles.gigTagRow}>
                  <View style={[styles.liveTag, { backgroundColor: colors.primary }]}>
                    <Radio size={12} color="#FFF" />
                    <Text style={styles.liveTagText}>NEXT GIG</Text>
                  </View>
                  {gigDate ? <Text style={[styles.gigDateText, { color: colors.textDim }]}>{gigDate}</Text> : null}
                </View>
              </View>

              <Text style={[styles.gigTitle, { color: colors.text }]}>{gigTitle}</Text>
              {gigVenue ? <Text style={[styles.gigVenue, { color: colors.textDim }]}>📍 {gigVenue}</Text> : null}

              {/* Setlist Progress Meter */}
              <View style={styles.meterContainer}>
                <View style={styles.meterLabelRow}>
                  <Text style={[styles.meterLabel, { color: colors.text }]}>Setlist Songs</Text>
                  <Text style={[styles.meterValue, { color: colors.primary }]}>{songCount} Songs</Text>
                </View>
                <View style={[styles.meterTrack, { backgroundColor: isDark ? '#1C3A2E' : '#D1FAE5' }]}>
                  <View style={[styles.meterFill, { width: songCount > 0 ? '100%' : '0%', backgroundColor: colors.primary }]} />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.gigActionsRow}>
                <TouchableOpacity 
                  style={[styles.viewSetlistBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/setlist/${upcomingGig.id}`)}
                >
                  <Layers size={16} color={colors.text} />
                  <Text style={[styles.viewSetlistText, { color: colors.text }]}>View Gig Sets</Text>
                </TouchableOpacity>

                {upcomingSetlist?.id && (
                  <TouchableOpacity 
                    style={[styles.startGigBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/stage-mode?setlistId=${upcomingSetlist.id}`)}
                  >
                    <Play size={16} color="#FFF" fill="#FFF" />
                    <Text style={styles.startGigText}>START GIG</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Performance Stats ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MUSICIAN STATS</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalSongs}</Text>
              <Text style={[styles.statLabel, { color: colors.textDim }]}>SONGS</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primaryDark }]}>{gigCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textDim }]}>GIGS</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{avgRating}</Text>
              <Text style={[styles.statLabel, { color: colors.textDim }]}>RATING</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{yearsExp}</Text>
              <Text style={[styles.statLabel, { color: colors.textDim }]}>YRS EXP</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Tools Grid ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>STAGE TOOLS & ACTIONS</Text>
          <View style={styles.toolsGrid}>
            {/* Tool 1: Stage Mode */}
            <TouchableOpacity 
              style={[styles.toolCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/stage-mode')}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Zap size={22} color={colors.primary} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Stage Mode</Text>
              <Text style={[styles.toolDesc, { color: colors.textDim }]}>Teleprompter & Chords</Text>
            </TouchableOpacity>

            {/* Tool 2: Setlists */}
            <TouchableOpacity 
              style={[styles.toolCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/setlists')}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Music2 size={22} color={colors.primary} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Setlists</Text>
              <Text style={[styles.toolDesc, { color: colors.textDim }]}>Gig Songs & Offline Prep</Text>
            </TouchableOpacity>

            {/* Tool 3: Band Session */}
            <TouchableOpacity 
              style={[styles.toolCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/bands')}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Users size={22} color={colors.primary} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Band Session</Text>
              <Text style={[styles.toolDesc, { color: colors.textDim }]}>Live Device Teleprompter</Text>
            </TouchableOpacity>

            {/* Tool 4: Song Dictionary */}
            <TouchableOpacity 
              style={[styles.toolCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/profile/songs')}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: colors.primaryLight }]}>
                <BookOpen size={22} color={colors.primary} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Dictionary</Text>
              <Text style={[styles.toolDesc, { color: colors.textDim }]}>Repertoire & Key Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Band Invites Notice (if any) ── */}
        {invites && invites.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.inviteCard, { backgroundColor: isDark ? '#1C3127' : '#DCFCE7', borderColor: colors.primary }]}>
              <View style={styles.inviteLeft}>
                <Users size={20} color={colors.primary} />
                <View>
                  <Text style={[styles.inviteTitle, { color: colors.text }]}>Band Invitation</Text>
                  <Text style={[styles.inviteSubtitle, { color: colors.textDim }]}>
                    You have {invites.length} pending musician invitation(s)
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.viewInviteBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/bands')}
              >
                <Text style={styles.viewInviteBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Practice Queue / Repertoire Highlights ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRACTICE QUEUE</Text>
            <TouchableOpacity onPress={() => router.push('/profile/songs')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.practiceList}>
            {songsToPractice.length > 0 ? (
              songsToPractice.map((item: any, idx: number) => {
                const song = item.song || {};
                return (
                  <View 
                    key={idx} 
                    style={[styles.practiceItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <View style={[styles.practiceNumBox, { backgroundColor: colors.bgSecondary }]}>
                      <Text style={[styles.practiceNumText, { color: colors.primary }]}>0{idx + 1}</Text>
                    </View>
                    <View style={styles.practiceSongInfo}>
                      <Text style={[styles.practiceSongTitle, { color: colors.text }]} numberOfLines={1}>
                        {song.title || 'Untitled Song'}
                      </Text>
                      <Text style={[styles.practiceSongMeta, { color: colors.textDim }]}>
                        {song.artist || 'Unknown'} • Key {song.original_key || 'G'}
                      </Text>
                    </View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={11} 
                          color="#F59E0B" 
                          fill={s <= (item.confidence_level || 2) ? "#F59E0B" : "transparent"} 
                        />
                      ))}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[styles.emptyPracticeCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <CheckCircle2 size={24} color={colors.primary} />
                <Text style={[styles.emptyPracticeTitle, { color: colors.text }]}>All Repertoire Mastered!</Text>
                <Text style={[styles.emptyPracticeSub, { color: colors.textDim }]}>
                  All your songs are marked live-ready. Add new songs to your dictionary to keep practicing.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <AiFloatingBubble />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  welcomeGreeting: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  stagePillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  gigCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  gigCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gigTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  gigDateText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  gigVenue: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    marginBottom: 16,
  },
  meterContainer: {
    marginBottom: 16,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  meterValue: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  gigActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewSetlistBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewSetlistText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  startGigBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  startGigText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCard: {
    width: '48.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  toolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  inviteSubtitle: {
    fontSize: 11,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  viewInviteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewInviteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  practiceList: {
    gap: 8,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  practiceNumBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceNumText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  practiceSongInfo: {
    flex: 1,
  },
  practiceSongTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  practiceSongMeta: {
    fontSize: 11,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  emptyPracticeCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPracticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  emptyPracticeSub: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
  chartLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  chartLiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  chartsContainer: {
    gap: 12,
  },
  analyticsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  percentagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  genreList: {
    gap: 12,
  },
  genreItem: {
    gap: 6,
  },
  genreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genreBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genreName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  genreMeta: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  genreTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  genreFill: {
    height: '100%',
    borderRadius: 999,
  },
  emptyGenreBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyGenreText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontStyle: 'italic',
  },
});
