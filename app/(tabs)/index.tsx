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
  useSongStats, 
  useMyBands, 
  useMyGigs 
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
  const { data: stats } = useSongStats(user?.id);
  const { data: bands } = useMyBands();
  const { data: gigs, isLoading: isGigsLoading } = useMyGigs();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Musician';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = profile?.avatar_url;
  
  const mProfile = profile?.musician_profiles?.[0];
  const roles = mProfile?.roles || ['Musician'];
  const rating = mProfile?.avg_rating || '5.0';
  
  const upcomingGig = gigs?.[0]; // First gig is next one due to order by gig_date

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
            <Text style={styles.greeting}>Good evening 🎸</Text>
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
              onPress={handleSignOut} 
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <LogOut size={20} color={THEME.textSec} />
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

        {/* Profile Card Summary (Dynamic) */}
        <View style={styles.statsSummary}>
           <Text style={styles.statsMiniText}>
             {stats?.total || 0} <Text style={styles.statsLabel}>Songs</Text>  ·  
             {bands?.length || 0} <Text style={styles.statsLabel}>Bands</Text>  ·  
             {gigs?.length || 0} <Text style={styles.statsLabel}>Gigs</Text>
           </Text>
           <View style={styles.ratingRow}>
              <Text style={styles.ratingValue}>★ {rating}</Text>
              <Text style={styles.instrumentText}>{roles.join(' · ')}</Text>
           </View>
        </View>

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

        {/* Quick Actions List */}
        <View style={styles.secLabelRow}>
          <Text style={styles.secLabel}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.actionList}>
          <ActionCard 
            title="AI Setlist Agent" 
            subtitle="Chat to build your set" 
            orbVariant="purple" 
            icon={<MessageSquare size={20} color="#8B5CF6" />} 
            onPress={() => router.push('/ai-agent')}
          />
          <ActionCard 
            title="Find Musicians" 
            subtitle="Browse by songs known" 
            orbVariant="green" 
            icon={<Search size={20} color="#10B981" />} 
            onPress={() => router.push('/discover')}
          />
          <ActionCard 
            title="My Setlists" 
            subtitle={`${gigs?.length || 0} active gigs`} 
            orbVariant="cyan" 
            icon={<Music size={20} color="#00D4FF" />} 
            onPress={() => router.push('/setlist/default')}
          />
          <ActionCard 
            title="My Band" 
            subtitle={(bands?.[0] as any)?.band?.name || 'Create a band'} 
            orbVariant="gold" 
            icon={<Users size={20} color="#F59E0B" />} 
            onPress={() => router.push('/bands')}
          />
        </View>

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
              <Text style={styles.featSubtitle}>No upcoming gigs scheduled.</Text>
              <Button 
                title="Create Gig" 
                variant="glass" 
                size="sm" 
                className="mt-4" 
                onPress={() => router.push('/gigs/new')} 
              />
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActionCard({ title, subtitle, orbVariant, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.featCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.featContent}>
        <Text style={styles.featTitle}>{title}</Text>
        <Text style={styles.featSubtitle}>{subtitle}</Text>
      </View>
      <Orb variant={orbVariant} size={48}>
        {icon}
      </Orb>
    </TouchableOpacity>
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
  actionList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 28,
  },
  featCard: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.glassBorder,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  featContent: {
    flex: 1,
    gap: 4,
  },
  featTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  featSubtitle: {
    fontSize: 13,
    color: THEME.textDim,
    fontFamily: 'DM Sans',
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
