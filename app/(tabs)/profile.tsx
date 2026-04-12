import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Edit2, 
  MapPin, 
  Star, 
  Music, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  MoreVertical,
  Share2
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('users')
          .select('*, musician_profiles(*)')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  // Sample data to match screenshot perfectly if DB is empty
  const displayName = profile?.display_name || "Marco Rivera";
  const handle = profile?.handle || "@marcorivera";
  const location = profile?.location || "Cebu City, PH";
  const initials = displayName.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
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
            <TouchableOpacity style={styles.glassActionBtn}>
              <View className="flex-row items-center gap-2">
                <Edit2 size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
            
            <Pill 
              label="Available for gigs" 
              variant="green" 
              dotColor="#10B981" 
              className="bg-brand-green-dim/40 border-brand-green/30"
            />
          </View>

          {/* Avatar Positioned Overlap */}
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
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.handleRow}>
              <Text style={styles.handleText}>{handle}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            <Pill label="Singer" variant="cyan" />
            <Pill label="Guitarist" variant="purple" />
            <Pill label="₱1,500 / gig" variant="gold" />
          </View>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <StatItem value="24" label="Songs" hasBorder />
            <StatItem value="14" label="Gigs" hasBorder />
            <StatItem value="4.8" label="Rating" hasBorder isRating />
            <StatItem value="8" label="Yrs Exp" />
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bioText}>
              Acoustic singer-guitarist from Cebu. 8 years of live gigging across bars, cafés, weddings, and church worship. OPM, Pop, and Classic Rock specialist.
            </Text>
          </View>

          {/* Genres Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>GENRES</Text>
            <View style={styles.genreList}>
              <Pill label="OPM" variant="cyan" />
              <Pill label="Acoustic" variant="cyan" />
              <Pill label="Pop" variant="cyan" />
              <Pill label="Classic Rock" variant="purple" />
              <Pill label="80s / 90s" variant="purple" />
              <Pill label="Kundiman" variant="gold" />
            </View>
          </View>

          <View style={styles.hr} />

          {/* Available For */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AVAILABLE FOR</Text>
            <View style={styles.checkList}>
              <CheckItem label="Bar & Café gigs" />
              <CheckItem label="Weddings & corporate events" />
              <CheckItem label="Church / worship team" />
            </View>
          </View>

          {/* Songs I Know */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SONGS I KNOW <Text style={{ color: '#00D4FF' }}>(24)</Text></Text>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Plus size={14} color="#00D4FF" />
                <Text style={styles.addText}>Add songs</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.songList}>
              <SongRow title="Hotel California" subtitle="Eagles · Rock" rating={5} status="LIVE" statusVariant="green" iconColor="#00D4FF" />
              <SongRow title="Paraluman" subtitle="Adie · OPM" rating={4} status="LIVE" statusVariant="green" iconColor="#F59E0B" />
              <SongRow title="Kundiman" subtitle="Parokya ni Edgar · OPM" rating={5} status="LIVE" statusVariant="green" iconColor="#8B5CF6" />
              <SongRow title="Sana" subtitle="I Belong to the Zoo · OPM" rating={3} status="LEARNING" statusVariant="gold" iconColor="#EC4899" />
            </View>

            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View all 24 songs →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          {/* Ratings & Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RATINGS & REVIEWS <Text style={{ color: '#F59E0B' }}>(12)</Text></Text>
            
            <View style={styles.ratingOverview}>
               <View style={styles.ratingLead}>
                 <Text style={styles.ratingBig}>4.8</Text>
                 <View style={styles.starsRow}>
                   {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#F59E0B" fill={i <= 4 ? "#F59E0B" : "transparent"} />)}
                 </View>
                 <Text style={styles.reviewSub}>12 reviews</Text>
               </View>
               
               <View style={styles.ratingBars}>
                 <RatingBar level={5} percentage="75%" count="9" />
                 <RatingBar level={4} percentage="15%" count="2" />
                 <RatingBar level={3} percentage="10%" count="1" />
                 <RatingBar level={2} percentage="0%" count="0" />
                 <RatingBar level={1} percentage="0%" count="0" />
               </View>
            </View>

            {/* Featured Reviews */}
            <View style={{ gap: 12 }}>
              <GlassCard style={styles.reviewCard} intensity={15}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitials}>AB</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>Ace Banda</Text>
                    <Text style={styles.reviewDate}>2 weeks ago</Text>
                  </View>
                  <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />)}
                  </View>
                </View>
                <Text style={styles.reviewBody}>
                  "Marco knew the whole setlist before the gig. Super professional, crowd loved him. Will definitely hire again!"
                </Text>
              </GlassCard>

              <GlassCard style={styles.reviewCard} intensity={15}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewerAvatar, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.reviewerInitials}>JR</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>Jojo Reyes</Text>
                    <Text style={styles.reviewDate}>1 month ago</Text>
                  </View>
                  <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />)}
                  </View>
                </View>
                <Text style={styles.reviewBody}>
                  "Fantastic acoustic set at our wedding. Knew all our requests and even added a few surprises. Highly recommend."
                </Text>
              </GlassCard>
            </View>
          </View>

          <View style={styles.hr} />

          {/* My Bands Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MY BANDS</Text>
            <View style={{ gap: 12 }}>
              <BandCard title="Tunog Cebu" subtitle="4 members · OPM, Acoustic" initials="TC" role="LEADER" roleVariant="cyan" />
              <BandCard title="Sunday Session" subtitle="3 members · Rock, Pop" initials="SS" role="MEMBER" roleVariant="purple" />
            </View>
          </View>

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
          colors={['#1e3a7a', '#071420']}
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
    backgroundColor: '#071420',
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
    backgroundColor: '#0b1e30',
    borderWidth: 4,
    borderColor: '#071420',
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
    color: '#00D4FF',
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
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 22,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.5)',
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
    color: 'rgba(200, 215, 235, 0.5)',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans Bold',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 15,
    color: 'rgba(200, 215, 235, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: 'rgba(200, 215, 235, 0.9)',
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
    color: '#00D4FF',
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
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  songSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
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
    color: '#00D4FF',
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
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  reviewSub: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.5)',
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
    color: 'rgba(150, 175, 200, 0.6)',
    width: 10,
  },
  ratingBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: 'rgba(150, 175, 200, 0.4)',
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
    gap: 1,
  },
  reviewBody: {
    fontSize: 13,
    color: 'rgba(200, 215, 235, 0.8)',
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
    color: '#00D4FF',
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
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
  }
});
