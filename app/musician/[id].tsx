import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  Share2, 
  MapPin, 
  Star, 
  Music, 
  CheckCircle2, 
  MessageCircle,
  Heart,
  Music2,
  AlertCircle
} from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { 
  useMusicianProfile, 
  useMusicianSongs, 
  useMyKnownSongs, 
  useSongStats,
  useInviteMusician
} from '../../utils/hooks/useMusician';

const { width } = Dimensions.get('window');

export default function MusicianProfileScreen() {
  const { id: musicianId } = useLocalSearchParams();
  const router = useRouter();
  const [inviteSent, setInviteSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Real Data Hooks
  const { data: musicianData, isLoading: isMusicianLoading, error: musicianError } = useMusicianProfile(musicianId as string);
  const { data: musicianSongs, isLoading: isSongsLoading } = useMusicianSongs(musicianId as string);
  const { data: mySongs } = useMyKnownSongs();
  const { data: stats } = useSongStats(musicianId as string);
  const { mutate: inviteMusician, isPending: isInviting } = useInviteMusician();

  const handleInvite = () => {
    if (!musicianId) return;
    setInviteSent(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isMusicianLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  if (musicianError || !musicianData) {
    return (
      <View style={[styles.container, styles.center]}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={{ color: '#FFF', marginTop: 12 }}>Musician not found</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const user = musicianData;
  const profile = user.musician_profiles?.[0];
  const name = user.display_name || 'Anonymous';
  const handle = `@${user.display_name?.toLowerCase().replace(/\s/g, '') || 'user'}`;
  const location = user.city || 'Cebu City';
  const initials = getInitials(name);
  const roles = profile?.roles || [];
  const genres = profile?.genres || [];
  const rate = profile?.rate_amount ? `₱${profile.rate_amount} / gig` : 'Rate on request';
  
  // Calculate matching songs
  const matchingSongs = musicianSongs?.map(ms => ({
    ...ms.song,
    match: mySongs?.some(my => my.song_id === ms.song_id)
  })) || [];
  
  const matchCount = matchingSongs.filter(s => s.match).length;
  const totalMatchCount = matchingSongs.length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Cover Section */}
        <View style={styles.headerCover}>
          <LinearGradient 
            colors={['#1e3a7a', '#071420']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={StyleSheet.absoluteFill} 
          />
          
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glassHeaderBtn}>
              <View style={styles.backBtnRow}>
                <ChevronLeft size={18} color="#FFF" />
                <Text style={styles.headerBtnText}>Back</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.glassHeaderBtn}>
              <Share2 size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Avatar Area */}
          <View style={styles.avatarContainer}>
             <View style={styles.avatar}>
               {user.avatar_url ? (
                 <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%' }} />
               ) : (
                 <Text style={styles.avatarText}>{initials}</Text>
               )}
             </View>
          </View>
        </View>

        {/* Identity Section */}
        <View style={styles.content}>
          <View style={styles.identity}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.handleRow}>
              <Text style={styles.handleText}>{handle}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {roles.map((role: string) => <Pill key={role} label={role} variant="cyan" />)}
            {profile?.is_available && <Pill label="Available" variant="green" dotColor="#10B981" />}
            <Pill label={rate} variant="gold" />
          </View>

          {/* Match Context Card */}
          <GlassCard intensity={25} style={styles.matchCard}>
            <View style={styles.matchCardRow}>
              <View style={styles.matchIconCircle}>
                <Music2 size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.matchTitle}>
                  <Text style={{ color: '#10B981' }}>{matchCount} of {totalMatchCount} songs</Text> shared with you
                </Text>
                <Text style={styles.matchSubtitle}>Based on your known songs list</Text>
              </View>
            </View>
          </GlassCard>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <StatItem value={stats?.total || 0} label="Songs" hasBorder />
            <StatItem value={profile?.gig_count || 0} label="Gigs" hasBorder />
            <StatItem value={profile?.avg_rating || '5.0'} label="Rating" hasBorder isRating />
            <StatItem value={profile?.years_exp || '1+'} label="Yrs Exp" />
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button 
              title={inviteSent ? "Invite Sent" : "Invite to Gig"} 
              variant={inviteSent ? "glass" : "cyan"} 
              className="flex-1 rounded-2xl h-[56px]" 
              onPress={handleInvite}
              disabled={inviteSent}
            />
            <TouchableOpacity style={styles.squareActionBtn}>
              <MessageCircle size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.squareActionBtn}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Heart 
                size={22} 
                color={isFavorited ? "#EF4444" : "rgba(255,255,255,0.7)"} 
                fill={isFavorited ? "#EF4444" : "transparent"} 
              />
            </TouchableOpacity>
          </View>

          {/* Invite Confirmation Pill */}
          {inviteSent && (
            <View style={styles.confirmationPill}>
              <CheckCircle2 size={18} color="#10B981" />
              <View>
                <Text style={styles.confirmationTitle}>Invite sent to {name}!</Text>
                <Text style={styles.confirmationSub}>They will be notified to join your gig.</Text>
              </View>
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bioText}>{user.bio || `No bio provided yet. Just a talented ${roles[0] || 'musician'} ready to play!`}</Text>
          </View>

          {/* Genres Section */}
          {genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GENRES</Text>
              <View style={styles.genreList}>
                {genres.map((g: string, i: number) => (
                  <Pill 
                    key={g} 
                    label={g} 
                    variant={i < 3 ? "cyan" : i === 3 ? "gold" : "green"} 
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.hr} />

          {/* Songs Matching Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SONGS SHARED WITH YOU <Text style={{ color: '#10B981' }}>({matchCount})</Text></Text>
            </View>
            
            <View style={styles.songList}>
              {matchingSongs.slice(0, 5).map((s: any) => (
                <View key={s.id} style={styles.songRow}>
                  <View style={[styles.songMiniIcon, { backgroundColor: s.match ? '#00D4FF15' : 'rgba(255,255,255,0.05)' }]}>
                    <Music size={14} color={s.match ? '#00D4FF' : 'rgba(255,255,255,0.3)'} />
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{s.title}</Text>
                    <Text style={styles.songSubtitle}>{s.artist}</Text>
                  </View>
                  <View style={[styles.matchBadge, s.match ? styles.matchBadgeActive : styles.matchBadgeInactive]}>
                    <Text style={[styles.matchBadgeText, s.match ? styles.matchBadgeTextActive : styles.matchBadgeTextInactive]}>
                      {s.match ? '✓ Match' : 'No match'}
                    </Text>
                  </View>
                </View>
              ))}
              {matchingSongs.length === 0 && (
                <Text style={styles.emptySubtitle}>No songs listed yet.</Text>
              )}
            </View>

            {matchingSongs.length > 5 && (
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all {matchingSongs.length} songs →</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.hr} />

          {/* Recent Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionLabel}>RECENT REVIEWS</Text>
              <View style={styles.ratingInlineRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingInline}>{profile?.avg_rating || '5.0'}</Text>
              </View>
            </View>
            
            <View style={{ gap: 12 }}>
              <Text style={styles.emptySubtitle}>No reviews yet.</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
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
    height: 180,
    width: '100%',
    position: 'relative',
    marginBottom: 50,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    alignItems: 'center',
  },
  glassHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    left: width / 2 - 45,
    zIndex: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0b264d',
    borderWidth: 3,
    borderColor: '#071420',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 34,
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 30,
    color: '#F0F4FF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleText: {
    fontSize: 14,
    color: 'rgba(150, 175, 200, 0.8)',
  },
  dot: {
    color: 'rgba(150, 175, 200, 0.4)',
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(150, 175, 200, 0.8)',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  matchCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  matchCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  matchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  matchTitle: {
    fontSize: 15,
    color: '#F0F4FF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 24,
    color: '#F0F4FF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.5)',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  squareActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 30,
  },
  confirmationTitle: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  confirmationSub: {
    fontSize: 12,
    color: 'rgba(16, 185, 129, 0.6)',
  },
  section: {
    marginBottom: 35,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(200, 215, 235, 0.5)',
    letterSpacing: 1.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingInline: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 15,
    color: 'rgba(200, 215, 235, 0.8)',
    lineHeight: 24,
    marginTop: 10,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 35,
  },
  songList: {
    gap: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  songMiniIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    color: '#F0F4FF',
    fontWeight: 'bold',
  },
  songSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  matchBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  matchBadgeTextActive: {
    color: '#10B981',
  },
  matchBadgeTextInactive: {
    color: 'rgba(150, 175, 200, 0.4)',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.4)',
    fontStyle: 'italic',
    marginTop: 8,
  }
});
