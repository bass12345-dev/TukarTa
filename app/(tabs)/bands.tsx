import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Users, Plus, Music } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CreateBandModal } from '../../components/bands/CreateBandModal';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { useAuth } from '../../context/auth';
import { useMyBands } from '../../utils/hooks/useMusician';

const { width } = Dimensions.get('window');

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

export default function BandsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: bands, isLoading } = useMyBands();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <View style={styles.container}>
      <CreateBandModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MY GROUPS</Text>
          <Text style={styles.title}>Bands</Text>
        </View>
        <TouchableOpacity 
          style={styles.createBtn} 
          activeOpacity={0.7}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={18} color="#00D4FF" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* ── Band List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading bands...</Text>
          </View>
        ) : bands && bands.length > 0 ? (
          bands.map((item: any) => (
            <BandManagementCard 
              key={item.id}
              band={item.band}
              role={item.role}
              onPress={() => router.push(`/musician/band/${item.band.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Users size={48} color="rgba(255,255,255,0.08)" />
            <Text style={styles.emptyTitle}>No bands yet</Text>
            <Text style={styles.emptyText}>Create a band or wait for an invitation!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BandManagementCard({ band, role, onPress }: any) {
  const initials = band.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);
  const isLeader = role === 'leader';

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <GlassCard style={styles.bandCard} intensity={25}>
        <View style={styles.bandHeader}>
          <View style={styles.bandAvatar}>
            <LinearGradient
              colors={['#1e3a7a', '#071420']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.bandInfo}>
            <Text style={styles.bandName}>{band.name}</Text>
            <View style={styles.bandMeta}>
              <View style={styles.metaItem}>
                <Users size={12} color={THEME.textDim} />
                <Text style={styles.metaText}>{band.member_count?.[0]?.count || 1} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Music size={12} color={THEME.textDim} />
                <Text style={styles.metaText}>{band.genres?.slice(0, 2).join(', ') || 'Various'}</Text>
              </View>
            </View>
          </View>
          <Pill 
            label={role.toUpperCase()} 
            variant={isLeader ? 'cyan' : 'purple'} 
            className="px-3"
          />
        </View>

      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.cyan,
    letterSpacing: 1.8,
    marginBottom: 4,
    fontFamily: 'DM Sans',
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  createBtnText: {
    fontSize: 13,
    color: THEME.cyan,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 16,
  },
  bandCard: {
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bandAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1A2F',
  },
  avatarText: {
    fontSize: 18,
    color: THEME.cyan,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
    zIndex: 1,
  },
  bandInfo: {
    flex: 1,
    gap: 4,
  },
  bandName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  bandMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: THEME.textDim,
    fontFamily: 'DM Sans',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans Bold',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.15)',
    fontFamily: 'DM Sans',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
