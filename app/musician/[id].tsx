import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Platform 
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
  XCircle
} from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const { width } = Dimensions.get('window');

// Mock data matching the screenshot specifically for "Lara Cruz"
const MUSICIANS_DATA: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Lara Cruz',
    handle: '@laracruz',
    location: 'Cebu City, PH',
    initials: 'LC',
    role: 'Singer',
    rate: '₱2,000 / gig',
    matchCount: 9,
    totalMatch: 11,
    stats: {
      songs: '38',
      gigs: '28',
      rating: '4.9',
      exp: '5'
    },
    about: 'OPM and pop vocalist based in Cebu City. 5 years performing in bars, cafés, and weddings. Known for strong high notes and crowd engagement. Available most weekday evenings and weekends.',
    genres: ['OPM', 'Pop', 'Rock', 'Acoustic', 'R&B'],
    matchingSongs: [
      { id: 's1', title: 'Hotel California', artist: 'Eagles', match: true },
      { id: 's2', title: 'Paraluman', artist: 'Adie', match: true },
      { id: 's3', title: 'Faithfully', artist: 'Journey', match: true },
      { id: 's4', title: 'Tadhana', artist: 'Up Dharma Down', match: false },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Rico Band',
        initials: 'RB',
        date: '3 weeks ago',
        rating: 5,
        text: 'Lara is an absolute pro. Knew every song in our setlist and even harmonized perfectly without rehearsal.'
      },
      {
        id: 'r2',
        name: 'Mia Lim',
        initials: 'ML',
        date: '1 month ago',
        rating: 5,
        text: 'Hired Lara for a café gig as a last-minute replacement. She showed up prepared, connected with the crowd immediately.'
      }
    ]
  }
};

export default function MusicianProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [inviteSent, setInviteSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fallback to Lara Cruz if ID not found for demo purposes
  const musician = MUSICIANS_DATA[id as string] || MUSICIANS_DATA['1'];

  const handleInvite = () => {
    setInviteSent(true);
    // Auto-hide after some time or keep it persistent as per screenshot
  };

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
              <View className="flex-row items-center gap-1">
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
               <Text style={styles.avatarText}>{musician.initials}</Text>
             </View>
          </View>
        </View>

        {/* Identity Section */}
        <View style={styles.content}>
          <View style={styles.identity}>
            <Text style={styles.name}>{musician.name}</Text>
            <View style={styles.handleRow}>
              <Text style={styles.handleText}>{musician.handle}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.locationText}>{musician.location}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            <Pill label={musician.role} variant="cyan" />
            <Pill label="Available" variant="green" dotColor="#10B981" />
            <Pill label={musician.rate} variant="gold" />
          </View>

          {/* Match Context Card */}
          <GlassCard intensity={25} className="bg-[#00D4FF]/5 border-[#00D4FF]/20 mt-4 mb-2">
            <View style={styles.matchCardRow}>
              <View style={styles.matchIconCircle}>
                <Music2 size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.matchTitle}>
                  <Text style={{ color: '#10B981' }}>{musician.matchCount} of {musician.totalMatch} songs</Text> match your setlist
                </Text>
                <Text style={styles.matchSubtitle}>Acoustic Vibes Mix · Handuraw Café</Text>
              </View>
            </View>
          </GlassCard>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <StatItem value={musician.stats.songs} label="Songs" hasBorder />
            <StatItem value={musician.stats.gigs} label="Gigs" hasBorder />
            <StatItem value={musician.stats.rating} label="Rating" hasBorder isRating />
            <StatItem value={musician.stats.exp} label="Yrs Exp" />
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button 
              title="Invite to Gig" 
              variant="cyan" 
              className="flex-1 rounded-2xl h-[56px]" 
              onPress={handleInvite}
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
                <Text style={styles.confirmationTitle}>Invite sent to {musician.name}!</Text>
                <Text style={styles.confirmationSub}>She'll be notified for Handuraw Café · Tomorrow</Text>
              </View>
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bioText}>{musician.about}</Text>
          </View>

          {/* Genres Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>GENRES</Text>
            <View style={styles.genreList}>
              {musician.genres.map((g: string, i: number) => (
                <Pill 
                  key={g} 
                  label={g} 
                  variant={i < 3 ? "cyan" : i === 3 ? "gold" : "green"} 
                  className={cn("px-4", i >= 3 && "bg-opacity-20")}
                />
              ))}
            </View>
          </View>

          <View style={styles.hr} />

          {/* Songs Matching Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SONGS MATCHING YOUR SETLIST <Text style={{ color: '#10B981' }}>({musician.matchCount})</Text></Text>
            </View>
            
            <View style={styles.songList}>
              {musician.matchingSongs.map((s: any) => (
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
            </View>

            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View all {musician.stats.songs} of her songs →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          {/* Recent Reviews Section */}
          <View style={styles.section}>
            <View className="flex-row items-center gap-2 mb-4">
              <Text style={styles.sectionLabel}>RECENT REVIEWS</Text>
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingInline}>{musician.stats.rating}</Text>
              </View>
            </View>
            
            <View style={{ gap: 12 }}>
              {musician.reviews.map((r: any) => (
                <GlassCard key={r.id} style={styles.reviewCard} intensity={15}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitials}>{r.initials}</Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{r.name}</Text>
                      <Text style={styles.reviewDate}>{r.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />)}
                    </View>
                  </View>
                  <Text style={styles.reviewBody}>{r.text}</Text>
                </GlassCard>
              ))}
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
  headerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
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
    fontFamily: 'DM Sans Bold',
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
    color: 'rgba(150, 175, 200, 0.8)',
    fontFamily: 'DM Sans',
  },
  dot: {
    color: 'rgba(150, 175, 200, 0.4)',
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(150, 175, 200, 0.8)',
    fontFamily: 'DM Sans',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  matchCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans Medium',
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
    fontFamily: 'DM Sans Bold',
  },
  confirmationSub: {
    fontSize: 12,
    color: 'rgba(16, 185, 129, 0.6)',
    fontFamily: 'DM Sans',
  },
  section: {
    marginBottom: 35,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(200, 215, 235, 0.5)',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans Bold',
  },
  ratingInline: {
    fontSize: 13,
    color: '#F59E0B',
    fontFamily: 'DM Sans Bold',
  },
  bioText: {
    fontSize: 15,
    color: 'rgba(200, 215, 235, 0.8)',
    lineHeight: 24,
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans Bold',
  },
  songSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans Bold',
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
    fontFamily: 'DM Sans Bold',
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
    backgroundColor: '#3b82f6',
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
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  reviewDate: {
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.4)',
    fontFamily: 'DM Sans',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 14,
    color: 'rgba(200, 215, 235, 0.8)',
    lineHeight: 22,
    fontFamily: 'DM Sans',
    fontStyle: 'italic',
  }
});
