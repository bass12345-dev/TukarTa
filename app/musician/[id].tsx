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
  ArrowLeft, 
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
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import {
  useMusicianProfile,
  useMusicianSongs,
  useMyKnownSongs,
  useSongStats,
  useInviteMusician,
  useMyBands
} from '../../utils/hooks/useMusician';
import { useStartConversation } from '../../utils/hooks/useMessaging';
import { useAppTheme } from '../../context/theme';
import { useAuth } from '@/context/auth';

const { width } = Dimensions.get('window');

export default function MusicianProfileScreen() {
  const { id: musicianId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [inviteSent, setInviteSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Real Data Hooks
  const { data: musicianData, isLoading: isMusicianLoading, error: musicianError } = useMusicianProfile(musicianId as string);
  const { data: musicianSongs, isLoading: isSongsLoading } = useMusicianSongs(musicianId as string);
  const { data: mySongs } = useMyKnownSongs();
  const { data: stats } = useSongStats(musicianId as string);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showBandPicker, setShowBandPicker] = useState(false);
  const { mutate: inviteMusician, isPending: isInviting } = useInviteMusician();
  const { data: myBands } = useMyBands();
  const { user: me } = useAuth();

  // Only bands you lead can send invites (the database enforces the same rule).
  const leadBands: { id: string; name: string }[] = (myBands || [])
    .map((m: any) => m.band)
    .filter((b: any) => b && b.leader_id === me?.id);

  const startChat = useStartConversation();

  // The database only opens chats with musicians you share a band or invite with.
  const handleMessage = () => {
    if (!musicianId) return;
    setInviteError(null);
    startChat.mutate(musicianId as string, {
      onSuccess: (conversationId) => router.push(`/chat/${conversationId}`),
      onError: (err: any) => setInviteError(err?.message || 'Could not open the chat.'),
    });
  };

  const sendInvite = (band: { id: string; name: string }) => {
    if (!musicianId) return;
    setInviteError(null);
    inviteMusician(
      { bandId: band.id, musicianId: musicianId as string, message: `Hey! Join ${band.name} on TukarTa.` },
      {
        onSuccess: () => {
          setInviteSent(true);
          setShowBandPicker(false);
        },
        onError: (err: any) => {
          setInviteError(
            /duplicate key/i.test(err?.message || '')
              ? 'This musician already has a pending invite from that band.'
              : err?.message || 'Could not send the invite.'
          );
        },
      }
    );
  };

  const handleInvite = () => {
    if (leadBands.length === 0) {
      setInviteError('Create a band first to invite musicians.');
      return;
    }
    if (leadBands.length === 1) {
      sendInvite(leadBands[0]);
      return;
    }
    setShowBandPicker(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isMusicianLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (musicianError || !musicianData) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={[styles.name, { color: colors.text }]}>Musician not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, profile } = musicianData;
  const initials = getInitials(user.display_name);

  // Dynamic shared songs overlap
  const sharedCount = (musicianSongs || []).filter(ms => 
    (mySongs || []).some(ms_my => ms_my.song_id === ms.song_id)
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Cover Section */}
        <View style={styles.headerCover}>
          <LinearGradient 
            colors={isDark ? ['#16382C', colors.bg] : ['#10B981', '#065F46']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={StyleSheet.absoluteFill} 
          />
          
          <View style={styles.topActions}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.glassHeaderBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.85)', borderColor: colors.border }]}
            >
              <View style={styles.backBtnRow}>
                <ArrowLeft size={18} color={colors.text} />
                <Text style={[styles.headerBtnText, { color: colors.text }]}>Back</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.glassHeaderBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.85)', borderColor: colors.border }]}
            >
              <Share2 size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Avatar Area */}
          <View style={styles.avatarContainer}>
             <View style={[styles.avatar, { borderColor: colors.bg, backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
               {user.avatar_url ? (
                 <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%' }} />
               ) : (
                 <Text style={[styles.avatarText, { color: '#10B981' }]}>{initials}</Text>
               )}
             </View>
          </View>
        </View>

        {/* Identity & Main Info */}
        <View style={styles.content}>
          <View style={styles.identity}>
            <Text style={[styles.name, { color: colors.text }]}>{user.display_name}</Text>
            
            <View style={styles.handleRow}>
              <Text style={[styles.handleText, { color: colors.textSecondary }]}>@{user.display_name.toLowerCase().replace(/\s+/g, '')}</Text>
              <Text style={[styles.dot, { color: colors.border }]}>•</Text>
              <MapPin size={14} color="#10B981" />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{user.city || 'Philippines'}</Text>
            </View>
          </View>

          {/* Roles Tags */}
          <View style={styles.tagRow}>
            {profile?.roles?.map((role: string, idx: number) => (
              <Pill 
                key={idx} 
                label={role} 
                variant={idx === 0 ? "mint" : "mint-subtle"} 
              />
            ))}
          </View>

          {/* Match Card */}
          <View style={[styles.matchCard, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: '#10B981' }]}>
            <View style={styles.matchCardRow}>
              <View style={styles.matchIconCircle}>
                <Music2 size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.matchTitle, { color: colors.text }]}>
                  {sharedCount} Shared Songs
                </Text>
                <Text style={[styles.matchSubtitle, { color: colors.textSecondary }]}>
                  {sharedCount > 0 ? "You both know these songs! Ready to jam." : "Add more songs to check repertoire overlap."}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={[styles.statsContainer, { borderColor: colors.border }]}>
            <StatItem value={stats?.total || 0} label="Songs" isBorder colors={colors} />
            <StatItem value="4.9" label="Rating" isBorder isRating colors={colors} />
            <StatItem value="12" label="Gigs" colors={colors} />
          </View>

          {/* Actions: Connect / Invite */}
          <View style={styles.actionRow}>
            <Button 
              title={inviteSent ? "Invitation Sent ✓" : "Invite to Band"}
              variant="mint"
              style={{ flex: 1 }}
              onPress={handleInvite}
              disabled={inviteSent || isInviting}
            />
            <TouchableOpacity 
              style={[styles.squareActionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Heart size={22} color={isFavorited ? "#EF4444" : colors.textSecondary} fill={isFavorited ? "#EF4444" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.squareActionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={handleMessage}
              disabled={startChat.isPending}
            >
              <MessageCircle size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showBandPicker && !inviteSent && (
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>INVITE FROM WHICH BAND?</Text>
              {leadBands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  disabled={isInviting}
                  onPress={() => sendInvite(b)}
                  style={[styles.squareActionBtn, { width: '100%', height: 44, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {inviteError && (
            <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 13 }}>{inviteError}</Text>
          )}

          {inviteSent && (
            <View style={[styles.confirmationPill, { backgroundColor: isDark ? '#16382C' : '#D1FAE5', borderColor: '#10B981' }]}>
              <CheckCircle2 size={18} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.confirmationTitle}>Invite Dispatched!</Text>
                <Text style={[styles.confirmationSub, { color: colors.textSecondary }]}>They will receive a notification in their TukarTa dashboard.</Text>
              </View>
            </View>
          )}

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</Text>
            <Text style={[styles.bioText, { color: colors.text }]}>
              {user.bio || "No bio added yet. A versatile musician ready to perform live gigs and collaborate on stage."}
            </Text>
            
            <View style={styles.genreList}>
              {profile?.genres?.map((g: string, idx: number) => (
                <Pill key={idx} label={g} variant="mint-subtle" />
              ))}
            </View>
          </View>

          <View style={[styles.hr, { backgroundColor: colors.border }]} />

          {/* Repertoire / Song Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REPERTOIRE ({musicianSongs?.length || 0})</Text>
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>Live Ready</Text>
            </View>

            <View style={styles.songList}>
              {isSongsLoading ? (
                <ActivityIndicator color="#10B981" style={{ marginVertical: 20 }} />
              ) : musicianSongs?.length === 0 ? (
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>No songs listed yet.</Text>
              ) : (
                musicianSongs?.slice(0, 5).map((item, idx) => {
                  const isShared = (mySongs || []).some(ms => ms.song_id === item.song_id);
                  return (
                    <View key={item.id} style={styles.songRow}>
                      <View style={[styles.songMiniIcon, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                        <Music size={18} color="#10B981" />
                      </View>
                      <View style={styles.songInfo}>
                        <Text style={[styles.songTitle, { color: colors.text }]}>{item.song?.title || 'Unknown Title'}</Text>
                        <Text style={[styles.songSubtitle, { color: colors.textSecondary }]}>{item.song?.artist || 'Unknown Artist'}</Text>
                      </View>
                      
                      <View style={[
                        styles.matchBadge, 
                        isShared 
                          ? { backgroundColor: isDark ? '#16382C' : '#D1FAE5', borderColor: '#10B981' }
                          : { backgroundColor: colors.bgCard, borderColor: colors.border }
                      ]}>
                        <Text style={[styles.matchBadgeText, { color: isShared ? '#10B981' : colors.textSecondary }]}>
                          {isShared ? '✓ MATCH' : item.song?.genre || 'Song'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {musicianSongs && musicianSongs.length > 5 && (
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all {musicianSongs.length} songs →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatItem({ value, label, isBorder, isRating, colors }: any) {
  return (
    <View style={[styles.statItem, isBorder && [styles.statBorder, { borderRightColor: colors.border }]]}>
      <Text style={[styles.statValue, { color: colors.text }, isRating && { color: '#F59E0B' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -42,
    left: '50%',
    transform: [{ translateX: -45 }],
    zIndex: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  content: {
    paddingHorizontal: 20,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 14,
  },
  name: {
    fontSize: 26,
    fontFamily: 'DM Sans',
    fontWeight: '800',
    marginBottom: 4,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
  },
  dot: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  matchCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  matchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 14,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderRightWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'DM Sans',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  squareActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  confirmationSub: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: 'DM Sans',
    marginTop: 4,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  hr: {
    height: 1,
    marginBottom: 26,
  },
  songList: {
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  songMiniIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songSubtitle: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 13.5,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  emptySubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'DM Sans',
  },
});
