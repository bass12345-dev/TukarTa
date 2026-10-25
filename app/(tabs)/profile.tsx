import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Music,
  Settings,
  Star
} from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { 
  useMusicianProfile, 
  useMyBands, 
  useSongStats, 
  useMyGigs,
  useMusicianReviews
} from '../../utils/hooks/useMusician';
import { useInfiniteMySongs } from '../../utils/hooks/useSongs';

import { RefreshControl } from 'react-native';
import { useRefresh } from '../../utils/hooks/useRefresh';
import { useTabBarPadding } from '../../utils/hooks/useTabBarPadding';
const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const tabBarPadding = useTabBarPadding();
  const { refreshing, onRefresh } = useRefresh();
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  
  const { data: profileData, isLoading: isProfileLoading } = useMusicianProfile(user?.id);
  const { data: bandData } = useMyBands();
  const { data: statsData } = useSongStats(user?.id);
  const { data: myGigs } = useMyGigs();
  const { data: reviews } = useMusicianReviews(user?.id);
  const { data: songsData } = useInfiniteMySongs(4); // Just get the latest 4

  const profile = profileData;
  const mProfile = profile?.musician_profiles?.[0];
  const allSongs = songsData?.pages.flat() || [];
  const recentSongs = allSongs.slice(0, 4);

  // Ratings calculation
  const totalReviews = reviews?.length || 0;
  const avgRating = mProfile?.avg_rating || '5.0';
  const ratingCounts = [1, 2, 3, 4, 5].reduce((acc, level) => {
    acc[level] = reviews?.filter(r => r.rating === level).length || 0;
    return acc;
  }, {} as Record<number, number>);

  const getPercentage = (count: number) => totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%';

  // Real data mapping
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest Musician";
  const handle = `@${displayName.toLowerCase().replace(/\s/g, '') || 'musician'}`;
  const location = profile?.city || "Unknown Location";
  const initials = (displayName || 'Musician').split(' ').map((n: any) => n?.[0] || '').join('').toUpperCase().slice(0, 2);
  const roles = mProfile?.roles || [];
  const rate = mProfile?.rate_amount ? `₱${mProfile.rate_amount} / gig` : 'Rate on request';
  const yearsExp = mProfile?.years_exp || '1+';
  const isAvailable = mProfile?.is_available ?? true;

  if (isProfileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.bgCard}
          />
        }>
        
        {/* Header Cover Section */}
        <View style={styles.headerCover}>
          <LinearGradient 
            colors={['#166534', '#064E3B']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={StyleSheet.absoluteFill} 
          />
          
          <View style={styles.topActions}>
            <TouchableOpacity 
              style={styles.glassActionBtn}
              onPress={() => router.push('/settings')}
            >
              <View style={styles.actionBtnRow}>
                <Settings size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Settings</Text>
              </View>
            </TouchableOpacity>
            
            <Pill 
              label={isAvailable ? "Available for gigs" : "Not available"} 
              variant={isAvailable ? "green" : "gold"} 
              dotColor={isAvailable ? "#10B981" : "#F59E0B"}
            />
          </View>

          {/* Avatar Area */}
          <View style={styles.avatarContainer}>
             <View style={styles.avatar}>
               {profile?.avatar_url ? (
                 <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
               ) : (
                 <Text style={styles.avatarText}>{initials}</Text>
               )}
             </View>
          </View>
        </View>

        {/* Identity & Tags */}
        <View style={styles.content}>
          <View style={styles.identity}>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
            <View style={styles.handleRow}>
              <Text style={[styles.handleText, { color: colors.textDim }]}>{handle}</Text>
              <Text style={[styles.dot, { color: colors.textDim }]}>·</Text>
              <Text style={[styles.locationText, { color: colors.textDim }]}>{location}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {roles.map((role: string, i: number) => (
              <Pill key={role} label={role} variant={i % 2 === 0 ? "cyan" : "purple"} />
            ))}
            {roles.length === 0 && <Pill label="Musician" variant="cyan" />}
            <Pill label={rate} variant="gold" />
          </View>

          {/* My Songs Dictionary Banner */}
          <View style={styles.section}>
            <TouchableOpacity 
              activeOpacity={0.85}
              style={[
                styles.dictionaryCard,
                {
                  backgroundColor: isDark ? '#14382A' : '#ECFDF5',
                  borderColor: '#10B981',
                }
              ]}
              onPress={() => router.push('/profile/songs')}
            >
              <View style={[styles.dictionaryIconBox, { backgroundColor: '#10B981' }]}>
                <BookOpen size={24} color="#FFFFFF" />
              </View>
              <View style={styles.dictionaryInfo}>
                <View style={styles.dictionaryTitleRow}>
                  <Text style={[styles.dictionaryTitle, { color: colors.text }]}>My Songs Dictionary</Text>
                  <Pill label={`${statsData?.total || 0} SONGS`} variant="mint" />
                </View>
                <Text style={[styles.dictionarySub, { color: colors.textSecondary }]}>
                  Open all {statsData?.total || 0} songs with interactive lyrics, chords, & stage teleprompter
                </Text>
              </View>
              <ChevronRight size={22} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          {/* Ratings & Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              RATINGS & REVIEWS <Text style={{ color: '#F59E0B' }}>({totalReviews})</Text>
            </Text>
            
            {totalReviews > 0 ? (
              <>
                <View style={styles.ratingOverview}>
                   <View style={styles.ratingLead}>
                     <Text style={styles.ratingBig}>{avgRating}</Text>
                     <View style={styles.starsRow}>
                       {[1,2,3,4,5].map(i => (
                         <Star 
                           key={i} 
                           size={14} 
                           color="#F59E0B" 
                           fill={i <= Math.round(Number(avgRating)) ? "#F59E0B" : "transparent"} 
                         />
                       ))}
                     </View>
                     <Text style={styles.reviewSub}>{totalReviews} reviews</Text>
                   </View>
                   
                   <View style={styles.ratingBars}>
                     {[5,4,3,2,1].map(level => (
                       <RatingBar 
                         key={level}
                         level={level} 
                         percentage={getPercentage(ratingCounts[level])} 
                         count={String(ratingCounts[level])} 
                       />
                     ))}
                   </View>
                </View>

                {/* Featured Reviews */}
                <View style={{ gap: 12 }}>
                  {reviews?.map((item: any) => (
                    <GlassCard key={item.id} style={styles.reviewCard} intensity={15}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerAvatar}>
                          {item.reviewer?.avatar_url ? (
                            <Image source={{ uri: item.reviewer.avatar_url }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.reviewerInitials}>
                              {item.reviewer?.display_name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                          )}
                        </View>
                        <View style={styles.reviewMeta}>
                          <Text style={styles.reviewerName}>{item.reviewer?.display_name}</Text>
                          <Text style={styles.reviewDate}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[1,2,3,4,5].map(i => (
                            <Star 
                              key={i} 
                              size={10} 
                              color="#F59E0B" 
                              fill={i <= item.rating ? "#F59E0B" : "transparent"} 
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewBody}>"{item.content}"</Text>
                    </GlassCard>
                  ))}
                </View>
              </>
            ) : (
              <GlassCard style={styles.reviewCard} intensity={15}>
                <Text style={styles.emptyText}>No reviews yet. Be the first to rate this musician!</Text>
              </GlassCard>
            )}
          </View>

          <View style={styles.hr} />

        </View>
      </ScrollView>
    </View>
  );
}

function BandCard({ title, subtitle, initials, role, roleVariant }: any) {
  return (
    <GlassCard 
      intensity={12} 
      style={styles.bandCard} 
      noPadding 
      contentContainerStyle={styles.bandContent}
    >
      <View style={styles.bandIcon}>
        <LinearGradient
          colors={['#166534', '#064E3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.bandInitials}>{initials}</Text>
      </View>
      <View style={styles.bandInfo}>
        <Text style={styles.bandTitle}>{title}</Text>
        <Text style={styles.bandSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Pill label={role} variant={roleVariant} className="px-[12px] h-[24px]" />
    </GlassCard>
  );
}

function StatItem({ value, label, hasBorder, isRating }: any) {
  return (
    <View style={[styles.statItem, hasBorder && styles.statBorder]}>
      <Text style={[styles.statValue, isRating && { color: '#F59E0B' }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.greenDot} />
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );
}

function SongRow({ title, subtitle, rating, status, statusVariant, iconColor }: any) {
  return (
    <View style={styles.songRow}>
      <View style={[styles.songIcon, { backgroundColor: iconColor + '20' }]}>
        <Music size={16} color={iconColor} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{title}</Text>
        <Text style={styles.songSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.songMeta}>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#F59E0B" fill={i <= rating ? "#F59E0B" : "transparent"} />)}
        </View>
        <Pill label={status} variant={statusVariant} className="px-2 py-0 rounded-sm" />
      </View>
    </View>
  );
}

function RatingBar({ level, percentage, count }: any) {
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLevel}>{level}</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: percentage }]} />
      </View>
      <Text style={styles.ratingBarCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerCover: {
    height: 240,
    width: '100%',
    position: 'relative',
    marginBottom: 60,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  glassActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DM Sans Medium',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    left: width / 2 - 50,
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    color: '#10B981',
    fontFamily: 'DM Sans Bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    color: '#166534',
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleText: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  dot: {
    color: '#64748B',
  },
  locationText: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 0,
    paddingVertical: 15,
    marginBottom: 30,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: '#D1FAE5',
  },
  statValue: {
    fontSize: 22,
    color: '#166534',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'DM Sans Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 35,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans Bold',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    fontFamily: 'DM Sans',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hr: {
    height: 1,
    backgroundColor: '#D1FAE5',
    marginBottom: 35,
  },
  checkList: {
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  checkLabel: {
    fontSize: 15,
    color: '#166534',
    fontFamily: 'DM Sans',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addText: {
    fontSize: 13,
    color: '#10B981',
    fontFamily: 'DM Sans Bold',
  },
  songList: {
    gap: 16,
    marginBottom: 20,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  songIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 16,
    color: '#166534',
    fontFamily: 'DM Sans Bold',
  },
  songSubtitle: {
    fontSize: 13,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'DM Sans Bold',
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 25,
  },
  ratingLead: {
    alignItems: 'center',
    gap: 4,
  },
  ratingBig: {
    fontSize: 44,
    color: '#166534',
    fontFamily: 'DM Sans Bold',
  },
  reviewSub: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  ratingBars: {
    flex: 1,
    gap: 4,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBarLevel: {
    fontSize: 10,
    color: '#10B981',
    width: 10,
  },
  ratingBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  ratingBarCount: {
    fontSize: 10,
    color: '#64748B',
    width: 10,
    textAlign: 'right',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'DM Sans Bold',
  },
  reviewDate: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'DM Sans',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    fontFamily: 'DM Sans',
    fontStyle: 'italic',
  },
  bandCard: {
    height: 70,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  bandContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bandIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bandInitials: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'DM Sans Bold',
    zIndex: 1,
  },
  bandInfo: {
    flex: 1,
    marginLeft: 16,
  },
  bandTitle: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  bandSubtitle: {
    fontSize: 13,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'DM Sans',
    fontStyle: 'italic',
  },
  dictionaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dictionaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dictionaryInfo: {
    flex: 1,
    gap: 4,
  },
  dictionaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dictionaryTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.3,
  },
  dictionarySub: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
});
