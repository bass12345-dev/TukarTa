import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, ChevronRight, Calendar, Music2, Clock, ListMusic } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreateGigModal } from '../../components/gigs/CreateGigModal';
import { useMyGigs } from '../../utils/hooks/useMusician';


const FILTERS = ['All', 'Upcoming', 'Past', 'Draft'];

export default function SetlistsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: gigs, isLoading } = useMyGigs();

  const filtered = !gigs ? [] : activeFilter === 'All'
    ? gigs
    : gigs.filter((s: any) => {
        // Simple logic for tags based on date if not present
        const date = new Date(s.gig_date);
        const isPast = date < new Date();
        if (activeFilter === 'Upcoming') return !isPast;
        if (activeFilter === 'Past') return isPast;
        return true;
      });

  const totalSongs = 0; // Will be calculated once we have setlists/songs

  return (
    <View style={styles.container}>
      <CreateGigModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MY GIGS</Text>
          <Text style={styles.title}>Setlists</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          activeOpacity={0.8}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#071420" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Summary Bar ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <ListMusic size={13} color="#00D4FF" />
          <Text style={styles.summaryChipText}>{gigs?.length || 0} gigs</Text>
        </View>
        <View style={styles.summaryChip}>
          <Music2 size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.summaryChipText}>
            {totalSongs} total songs
          </Text>
        </View>
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Setlist Cards ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((gig: any) => {
          const date = new Date(gig.gig_date);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const isPast = date < new Date();
          const themeColor = isPast ? '#8B5CF6' : '#00D4FF';
          const glowColor = isPast ? 'rgba(139,92,246,0.18)' : 'rgba(0,212,255,0.18)';
          const borderColor = isPast ? 'rgba(139,92,246,0.22)' : 'rgba(0,212,255,0.22)';

          return (
            <TouchableOpacity
              key={gig.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/setlist/${gig.id}`)}
            >
              <View style={[styles.card, { borderColor }]}>
                <View style={[styles.topAccent, { backgroundColor: themeColor }]} />
                <View style={styles.cardInner}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconBubble, { backgroundColor: glowColor }]}>
                      <Calendar size={18} color={themeColor} />
                    </View>
                    <View style={styles.titleArea}>
                      <Text style={styles.setTitle} numberOfLines={1}>{gig.name}</Text>
                      <Text style={styles.setVenue} numberOfLines={1}>{gig.venue}</Text>
                      <Text style={styles.bandContext}>{gig.band?.name}</Text>
                    </View>
                    <View style={[styles.tagBadge, { backgroundColor: isPast ? 'rgba(139,92,246,0.1)' : 'rgba(0,212,255,0.1)', borderColor }]}>
                      <Text style={[styles.tagText, { color: themeColor }]}>{isPast ? 'Past' : 'Upcoming'}</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Calendar size={12} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.statText}>{dateStr}</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                      <Clock size={12} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.statText}>{gig.duration_min} min</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerHint}>Tap to manage gig & setlist</Text>
                    <ChevronRight size={16} color={themeColor} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <ListMusic size={48} color="rgba(255,255,255,0.08)" />
            <Text style={styles.emptyTitle}>No setlists found</Text>
            <Text style={styles.emptyText}>Tap + to create your first setlist</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 1.8,
    marginBottom: 4,
    fontFamily: 'DM Sans',
    opacity: 0.85,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  addBtn: {
    backgroundColor: '#00D4FF',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    boxShadow: [{
      color: 'rgba(0, 212, 255, 0.4)',
      offsetX: 0,
      offsetY: 4,
      blurRadius: 10,
    }],
    elevation: 8,
  },

  /* Summary */
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DM Sans',
  },

  /* Filters */
  filterRow: {
    marginBottom: 8,
    height: 44,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  filterPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderColor: '#00D4FF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  filterTextActive: {
    color: '#00D4FF',
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
    paddingTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    width: '100%',
    opacity: 0.9,
  },
  cardInner: {
    padding: 16,
    gap: 12,
  },

  /* Card top row */
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  setTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  setVenue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  bandContext: {
    fontSize: 10,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    letterSpacing: 0.3,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  statSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  songCountBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  songCountText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  songCountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },

  /* Progress */
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.8,
  },

  /* Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans',
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans Bold',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.15)',
    fontFamily: 'DM Sans',
  },
});
