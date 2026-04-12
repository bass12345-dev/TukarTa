import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, Search, Music, Users, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { Image } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';
import { Mascot } from '../../components/ui/Mascot';
import { Button } from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Musician';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      const getProfile = async () => {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      getProfile();
    }
  }, [user]);

  const finalDisplayName = profile?.display_name || displayName;
  const finalAvatarUrl = profile?.avatar_url;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening 🎸</Text>
            <Text style={styles.profileName}>{finalDisplayName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleSignOut} 
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="var(--color-text-sec)" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                {finalAvatarUrl ? (
                  <Image source={{ uri: finalAvatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card Summary (Tightened) */}
        <View style={styles.statsSummary}>
           <Text style={styles.statsMiniText}>24 <Text style={styles.statsLabel}>Songs</Text>  ·  2 <Text style={styles.statsLabel}>Bands</Text>  ·  14 <Text style={styles.statsLabel}>Gigs</Text></Text>
           <View style={styles.ratingRow}>
              <Text style={styles.ratingValue}>★ 4.8</Text>
              <Text style={styles.instrumentText}>Singer · Guitarist</Text>
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
                 source={require('../../assets/images/icon.png')} 
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
            subtitle="3 active gigs" 
            orbVariant="cyan" 
            icon={<Music size={20} color="#00D4FF" />} 
            onPress={() => router.push('/setlist/default')}
          />
          <ActionCard 
            title="My Band" 
            subtitle="Tunog Cebu · 4" 
            orbVariant="gold" 
            icon={<Users size={20} color="#F59E0B" />} 
            onPress={() => {}}
          />
        </View>

        {/* Upcoming Gig */}
        <View style={styles.secLabelRow}>
          <Text style={styles.secLabel}>UPCOMING GIG</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/setlist/default')} style={styles.gigWrapper}>
          <GlassCard style={styles.gigCard} intensity={30}>
            <View style={styles.gigHeader}>
              <View>
                <Text style={styles.gigTitle}>Handuraw Café</Text>
                <Text style={styles.gigMeta}>Tomorrow · 8:00 PM · 90 min</Text>
              </View>
              <Pill label="Tonight" variant="gold" />
            </View>
            <View style={styles.hr} />
            <View style={styles.gigFooter}>
              <Text style={styles.gigSetlist}>Acoustic Vibes Mix · <Text style={{ color: 'var(--color-text)' }}>11 songs</Text></Text>
              <Pill label="3/4 ✓" variant="green" />
            </View>
          </GlassCard>
        </TouchableOpacity>
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
    backgroundColor: 'var(--color-bg)',
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
    color: 'var(--color-text-sec)',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: 'var(--color-text-sec)',
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
    color: 'var(--color-text-dim)',
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
    color: 'var(--color-text-sec)',
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
    backgroundColor: 'var(--color-surface)',
    borderWidth: 1,
    borderColor: 'var(--color-glass-border)',
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
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  featSubtitle: {
    fontSize: 13,
    color: 'var(--color-text-dim)',
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
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  gigMeta: {
    fontSize: 13,
    color: 'var(--color-text-sec)',
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
    backgroundColor: 'var(--color-glass-border)',
    marginVertical: 14,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gigSetlist: {
    fontSize: 13,
    color: 'var(--color-text-sec)',
    fontFamily: 'DM Sans',
  },
});

