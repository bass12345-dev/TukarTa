import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MessageSquare, Search, Music, Users, LogOut, Bell, UserPlus, Check, X as CloseX } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useMyInvites, 
  useMusicianProfile, 
  useMyKnownSongs, 
  useMyBands, 
  useMyGigs,
  useGigSetlist,
  useSetlistSongs
} from '../../utils/hooks/useMusician';
import { ActivityIndicator } from 'react-native';

const THEME = {
  bg: '#071420',
  text: '#F0F4FF',
  textSec: 'rgba(200, 215, 235, 0.6)',
  textDim: 'rgba(150, 175, 200, 0.35)',
  surface: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  cyan: '#00D4FF',
  purple: '#8B5CF6',
  gold: '#F59E0B',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // Real Data Hooks
  const { data: invites } = useMyInvites();
  const { data: profile, isLoading: isProfileLoading } = useMusicianProfile(user?.id);
  const { data: knownSongs } = useMyKnownSongs();
  const { data: bands } = useMyBands();
  const { data: gigs, isLoading: isGigsLoading } = useMyGigs();

  // 1. Advanced Calculations
  const totalSongs = knownSongs?.length || 0;
  const liveSongs = knownSongs?.filter(s => s.can_perform_live).length || 0;
  const masteryPercentage = totalSongs > 0 ? Math.round((liveSongs / totalSongs) * 100) : 0;
  
  // Genres distribution
  const genresMap = knownSongs?.reduce((acc: any, s) => {
    const g = s.genre || (s.song as any)?.genre || 'General';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.entries(genresMap || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3);

  // Learning Priority (Confidence < 3)
  const toLearn = knownSongs?.filter(s => s.confidence_level < 3).slice(0, 5) || [];
  
  // Productivity Score (Simulated level based on repertoire)
  const level = Math.floor(totalSongs / 10) + 1;
  const xpProgress = (totalSongs % 10) * 10;

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Musician';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = profile?.avatar_url;
  
  const mProfile = profile?.musician_profiles?.[0];
  const roles = mProfile?.roles || ['Musician'];
  const rating = mProfile?.avg_rating || '5.0';
  
  const upcomingGig = gigs?.[0]; // First gig is next one due to order by gig_date
  const { data: upcomingSetlist } = useGigSetlist(upcomingGig?.id);
  const { data: upcomingSongs } = useSetlistSongs(upcomingSetlist?.id);

  const gigSongsCount = upcomingSongs?.length || 0;
  const songsToLearnCount = upcomingSongs?.filter((s: any) => s.notes?.includes('[LEARN]')).length || 0;
  const gigReadiness = gigSongsCount > 0 ? Math.round(((gigSongsCount - songsToLearnCount) / gigSongsCount) * 100) : 100;

  if (isProfileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.profileName}>{displayName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push('/messages')} 
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <Bell size={20} color={THEME.textSec} />
              {invites && invites.length > 0 && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Mastery Hub */}
        <View style={styles.masteryHub}>
          <GlassCard style={styles.masteryCard} intensity={20}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryInfo}>
                <Text style={styles.masteryTitle}>Mastery Hub</Text>
                <Text style={styles.masterySubtitle}>Your performance readiness</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>LVL {level}</Text>
              </View>
            </View>
            
            <View style={styles.masteryContent}>
              <View style={styles.chartContainer}>
                <View style={styles.progressCircleBase}>
                  <View style={[styles.progressCircleFill, { height: `${masteryPercentage}%` }]} />
                  <View style={styles.progressInner}>
                    <Text style={styles.progressValue}>{masteryPercentage}%</Text>
                    <Text style={styles.progressLabel}>LIVE</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.statsColumn}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{totalSongs}</Text>
                  <Text style={styles.miniStatLabel}>Total Songs</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: THEME.cyan }]}>{liveSongs}</Text>
                  <Text style={styles.miniStatLabel}>Ready for Stage</Text>
                </View>
              </View>
            </View>

            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpTitle}>Next level progress</Text>
                <Text style={styles.xpValue}>{xpProgress}%</Text>
              </View>
              <View style={styles.xpBarBase}>
                <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Gig Mastery Analytics */}
        {upcomingGig && (
          <View style={styles.masteryHub}>
            <GlassCard style={[styles.masteryCard, { borderColor: 'rgba(245, 158, 11, 0.2)' }]} intensity={15}>
              <View style={styles.masteryHeader}>
                <View style={styles.masteryInfo}>
                  <Text style={[styles.masteryTitle, { fontSize: 16 }]}>Gig Readiness: {upcomingGig.name}</Text>
                  <Text style={styles.masterySubtitle}>Learning progress for this gig</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: THEME.gold + '22', borderColor: THEME.gold + '44' }]}>
                  <Text style={[styles.levelText, { color: THEME.gold }]}>{gigReadiness}%</Text>
                </View>
              </View>
              
              <View style={styles.masteryContent}>
                <View style={styles.chartContainer}>
                  <View style={[styles.progressCircleBase, { borderColor: THEME.gold + '22' }]}>
                    <View style={[styles.progressCircleFill, { height: `${gigReadiness}%`, backgroundColor: THEME.gold }]} />
                    <View style={styles.progressInner}>
                      <Text style={styles.progressValue}>{gigReadiness}%</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.statsColumn}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{gigSongsCount}</Text>
                    <Text style={styles.miniStatLabel}>Setlist Songs</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={[styles.miniStatValue, { color: THEME.gold }]}>{songsToLearnCount}</Text>
                    <Text style={styles.miniStatLabel}>Still to Learn</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Genre DNA */}
        <View style={styles.genreSection}>
          <Text style={styles.secLabel}>GENRE DISTRIBUTION</Text>
          <View style={styles.genreRow}>
            {topGenres.map(([genre, count]: any, idx) => (
              <View key={genre} style={styles.genreItem}>
                <View style={[styles.genrePill, { backgroundColor: idx === 0 ? THEME.cyan : idx === 1 ? THEME.purple : THEME.gold + '44' }]}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
                <Text style={styles.genreCount}>{count} songs</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Growth & Productivity */}
        {toLearn.length > 0 && (
          <View style={styles.growthSection}>
            <View style={styles.secLabelRow}>
              <Text style={styles.secLabel}>NEED TO LEARN</Text>
              <TouchableOpacity onPress={() => router.push('/profile/songs')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.learningScroll}>
              {toLearn.map((item: any) => (
                <GlassCard key={item.song.id} style={styles.learningCard} intensity={10}>
                  <Music size={16} color={THEME.cyan} style={{ marginBottom: 8 }} />
                  <Text style={styles.learningTitle} numberOfLines={1}>{item.song.title}</Text>
                  <Text style={styles.learningArtist} numberOfLines={1}>{item.song.artist}</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceText}>Confidence: </Text>
                    <Text style={[styles.confidenceValue, { color: THEME.gold }]}>{item.confidence_level}/5</Text>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Premium Banner */}
        <TouchableOpacity activeOpacity={0.9} style={styles.premiumWrapper}>
          <LinearGradient
            colors={['#3d1a6e', '#1e3a7a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumBanner}
          >
            <View style={styles.bannerIconContainer}>
               <Image 
                 source={require('@/assets/images/icon.png')} 
                 style={{ width: 32, height: 32 }} 
                 resizeMode="contain" 
               />
            </View>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTitleRow}>
                <Text style={styles.crown}>👑</Text>
                <Text style={styles.premiumTitle}>Premium plan</Text>
              </View>
              <Text style={styles.premiumSubtitle}>Unlimited setlists, Stage Mode, Marketplace access</Text>
              <Button title="View plan" variant="glass" size="sm" style={styles.bannerBtn} />
            </View>
          </LinearGradient>
        </TouchableOpacity>


        {/* AI Suggestions */}
        <View style={styles.secLabelRow}>
          <Text style={styles.secLabel}>TUKARTA SUGGESTS</Text>
        </View>
        <TouchableOpacity 
          style={styles.suggestionCard}
          onPress={() => router.push('/ai-agent')}
        >
          <LinearGradient
            colors={['rgba(0, 212, 255, 0.1)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.suggestionGradient}
          >
            <Orb variant="purple" size={40}>
              <Bell size={18} color={THEME.purple} />
            </Orb>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>Master your {topGenres[0]?.[0] || 'repertoire'}</Text>
              <Text style={styles.suggestionText}>
                You have {toLearn.length} songs needing practice. Mastering them will boost your Stage Readiness to {masteryPercentage + 5}%.
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Upcoming Gig */}
        <View style={styles.secLabelRow}>
          <Text style={styles.secLabel}>UPCOMING GIG</Text>
        </View>
        
        {upcomingGig ? (
          <TouchableOpacity onPress={() => router.push(`/setlist/${upcomingGig.id}`)} style={styles.gigWrapper}>
            <GlassCard style={styles.gigCard} intensity={30}>
              <View style={styles.gigHeader}>
                <View>
                  <Text style={styles.gigTitle}>{upcomingGig.name}</Text>
                  <Text style={styles.gigMeta}>
                    {new Date(upcomingGig.gig_date).toLocaleDateString()} · {upcomingGig.venue}
                  </Text>
                </View>
                {new Date(upcomingGig.gig_date).toDateString() === new Date().toDateString() && (
                  <Pill label="Today" variant="gold" />
                )}
              </View>
              <View style={styles.hr} />
              <View style={styles.gigFooter}>
                <Text style={styles.gigSetlist}>
                  {upcomingGig.band?.name} · <Text style={{ color: THEME.text }}>{upcomingGig.duration_min} min</Text>
                </Text>
                <Pill label="View Setlist" variant="cyan" />
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <View style={styles.gigWrapper}>
            <GlassCard style={styles.gigCard} intensity={15}>
              <Text style={styles.suggestionText}>No upcoming gigs scheduled.</Text>
              <Button 
                title="Create Gig" 
                variant="glass" 
                size="sm" 
                style={{ marginTop: 16 }}
                onPress={() => router.push('/ai-agent')} 
              />
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4FF',
    borderWidth: 1.5,
    borderColor: '#071420',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 18,
    color: '#00D4FF',
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  masteryHub: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  masteryCard: {
    padding: 20,
    borderRadius: 24,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  masteryInfo: {
    gap: 2,
  },
  masteryTitle: {
    fontSize: 20,
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  masterySubtitle: {
    fontSize: 13,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
  levelBadge: {
    backgroundColor: THEME.cyan + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cyan + '44',
  },
  levelText: {
    color: THEME.cyan,
    fontSize: 12,
    fontFamily: 'DM Sans Bold',
  },
  masteryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 20,
  },
  chartContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleBase: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressCircleFill: {
    width: '100%',
    backgroundColor: THEME.cyan,
    opacity: 0.3,
  },
  progressInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  progressLabel: {
    fontSize: 9,
    color: THEME.textSec,
    fontFamily: 'DM Sans Bold',
  },
  statsColumn: {
    flex: 1,
    gap: 16,
  },
  miniStat: {
    gap: 2,
  },
  miniStatValue: {
    fontSize: 20,
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  miniStatLabel: {
    fontSize: 11,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
  xpContainer: {
    gap: 8,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTitle: {
    fontSize: 12,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
  xpValue: {
    fontSize: 12,
    color: THEME.cyan,
    fontFamily: 'DM Sans Bold',
  },
  xpBarBase: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: THEME.cyan,
    borderRadius: 3,
  },
  genreSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  genreItem: {
    alignItems: 'flex-start',
    gap: 4,
  },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  genreText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'DM Sans Bold',
  },
  genreCount: {
    fontSize: 10,
    color: THEME.textDim,
    fontFamily: 'DM Sans',
    marginLeft: 4,
  },
  growthSection: {
    marginBottom: 28,
  },
  learningScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 4,
  },
  learningCard: {
    width: 140,
    padding: 15,
    borderRadius: 20,
  },
  learningTitle: {
    fontSize: 14,
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  learningArtist: {
    fontSize: 11,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 9,
    color: THEME.textDim,
    fontFamily: 'DM Sans',
  },
  confidenceValue: {
    fontSize: 9,
    fontFamily: 'DM Sans Bold',
  },
  seeAll: {
    fontSize: 12,
    color: THEME.cyan,
    fontFamily: 'DM Sans Bold',
  },
  suggestionCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  suggestionGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  suggestionContent: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 15,
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  suggestionText: {
    fontSize: 12,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
  statsSummary: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsMiniText: {
    fontSize: 18,
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
    fontWeight: 'normal',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'DM Sans Bold',
  },
  instrumentText: {
    fontSize: 12,
    color: THEME.textDim,
    fontFamily: 'DM Sans',
  },
  premiumWrapper: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  premiumBanner: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  bannerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  crown: {
    fontSize: 16,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  premiumSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'DM Sans',
  },
  bannerBtn: {
    width: 110,
    height: 36,
  },
  secLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  secLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textSec,
    letterSpacing: 1.2,
    fontFamily: 'DM Sans Bold',
    opacity: 0.6,
  },
  gigWrapper: {
    paddingHorizontal: 16,
  },
  gigCard: {
    marginBottom: 28,
    borderRadius: 24,
    padding: 20,
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  gigMeta: {
    fontSize: 13,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
    backgroundColor: THEME.glassBorder,
    marginVertical: 14,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gigSetlist: {
    fontSize: 13,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
});
