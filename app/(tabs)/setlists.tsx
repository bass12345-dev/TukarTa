import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  ChevronRight,
  Plus,
  MapPin,
  Music2,
  Users,
} from 'lucide-react-native';
import { useMyGigs } from '@/utils/hooks/useMusician';
import { useAppTheme } from '@/context/theme';
import { CreateGigModal } from '@/components/gigs/CreateGigModal';

import { useTabBarPadding } from '../../utils/hooks/useTabBarPadding';
export default function SetlistsScreen() {
  const tabBarPadding = useTabBarPadding();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [showCreateGigModal, setShowCreateGigModal] = React.useState(false);
  const { data: gigs, isLoading: isGigsLoading } = useMyGigs();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <CreateGigModal
        visible={showCreateGigModal}
        onClose={() => setShowCreateGigModal(false)}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.screenEyebrow, { color: colors.primary }]}>PERFORMANCE GIGS</Text>
            <Text style={[styles.screenTitle, { color: colors.text }]}>My Gigs</Text>
          </View>

          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => setShowCreateGigModal(true)}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Select a gig to view its real setlists, song charts, lyrics, and stage chords.
        </Text>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]} 
        showsVerticalScrollIndicator={false}
      >
        {isGigsLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading your gigs...</Text>
          </View>
        ) : !gigs || gigs.length === 0 ? (
          <View style={styles.centerState}>
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: colors.border }]}>
              <Calendar size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Gigs Scheduled Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create a gig or join a band to start organizing sets, chords, and live stage lyrics.
            </Text>
            <TouchableOpacity
              style={[styles.createGigBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => setShowCreateGigModal(true)}
            >
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.createGigBtnText}>Create a Gig</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gigsList}>
            {gigs.map((gig: any) => {
              const name = gig.name || 'Untitled Gig';
              const venue = gig.venue || 'TBA';
              const bandName = gig.band?.name || 'My Band';
              const dateStr = gig.gig_date 
                ? new Date(gig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Date TBA';

              return (
                <TouchableOpacity
                  key={gig.id}
                  style={[styles.gigCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/setlist/${gig.id}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.calendarBadge, { backgroundColor: isDark ? '#16382C' : '#ECFDF5' }]}>
                      <Calendar size={18} color={colors.primary} />
                      <Text style={[styles.calendarBadgeText, { color: colors.primary }]}>{dateStr}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </View>

                  <Text style={[styles.gigName, { color: colors.text }]} numberOfLines={1}>{name}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{venue}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={13} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{bandName}</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.viewSetsRow}>
                      <Music2 size={14} color={colors.primary} />
                      <Text style={[styles.viewSetsText, { color: colors.primary }]}>Open Setlists & Songs →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 20,
  },
  createGigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  createGigBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  stateText: {
    fontSize: 13,
    fontFamily: 'DM Sans',
  },
  gigsList: {
    gap: 14,
  },
  gigCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  calendarBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  gigName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  viewSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewSetsText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
});
