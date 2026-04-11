import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, MapPin, Star, Music2 } from 'lucide-react-native';

const MOCK_MUSICIANS = [
  {
    id: '1',
    name: 'Lara Cruz',
    initials: 'LC',
    role: 'Singer',
    genres: ['OPM', 'Pop', 'Rock'],
    location: 'Cebu City',
    match: 9,
    rating: 4.9,
    reviews: 28,
    avatarColor: '#1E40AF',
    avatarGlow: 'rgba(30,64,175,0.4)',
    available: true,
  },
  {
    id: '2',
    name: 'Karl Mendoza',
    initials: 'KM',
    role: 'Singer',
    genres: ['Rock', 'OPM', 'Acoustic'],
    location: 'Mandaue',
    match: 7,
    rating: 4.7,
    reviews: 15,
    avatarColor: '#065F46',
    avatarGlow: 'rgba(6,95,70,0.4)',
    available: true,
  },
  {
    id: '3',
    name: 'Anna Torres',
    initials: 'AT',
    role: 'Singer',
    genres: ['OPM', 'Jazz', 'Soul'],
    location: 'Cebu City',
    match: 6,
    rating: 4.8,
    reviews: 42,
    avatarColor: '#7C3AED',
    avatarGlow: 'rgba(124,58,237,0.4)',
    available: false,
  },
  {
    id: '4',
    name: 'Diego Reyes',
    initials: 'DR',
    role: 'Guitarist',
    genres: ['Blues', 'Rock', 'Funk'],
    location: 'Lapu-Lapu',
    match: 5,
    rating: 4.6,
    reviews: 19,
    avatarColor: '#B45309',
    avatarGlow: 'rgba(180,83,9,0.4)',
    available: true,
  },
];

const FILTERS = ['All', 'Singer', 'Guitarist', 'Bassist', 'Drummer', 'Keys'];

function StarRating({ value }: { value: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          color="#F59E0B"
          fill={s <= Math.round(value) ? '#F59E0B' : 'transparent'}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

function MatchBar({ value }: { value: number }) {
  const pct = (value / 10) * 100;
  const color =
    value >= 8 ? '#10B981' : value >= 5 ? '#00D4FF' : 'rgba(255,255,255,0.25)';
  return (
    <View style={styles.matchBarTrack}>
      <View style={[styles.matchBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = MOCK_MUSICIANS.filter((m) => {
    const matchFilter = activeFilter === 'All' || m.role === activeFilter;
    const matchQuery =
      query === '' ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()));
    return matchFilter && matchQuery;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>EXPLORE</Text>
          <Text style={styles.title}>Discover Musicians</Text>
        </View>
        <View style={styles.headerBadge}>
          <Music2 size={18} color="#00D4FF" />
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <Search size={16} color="rgba(255,255,255,0.35)" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name, genre, or song..."
          placeholderTextColor="rgba(255,255,255,0.22)"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* ── Filter Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterRow}
        alwaysBounceVertical={false}
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

      {/* ── Sorting label ── */}
      <Text style={styles.sortLabel}>
        {filtered.length} musicians near Cebu City · sorted by song match
      </Text>

      {/* ── Musician Cards ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: m.avatarColor }]}>
              <Text style={styles.avatarText}>{m.initials}</Text>
              {m.available && <View style={styles.availableDot} />}
            </View>

            {/* Info */}
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.musicianName}>{m.name}</Text>
                <View
                  style={[
                    styles.matchBadge,
                    {
                      backgroundColor:
                        m.match >= 8
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(0,212,255,0.08)',
                      borderColor:
                        m.match >= 8
                          ? 'rgba(16,185,129,0.45)'
                          : 'rgba(0,212,255,0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.matchText,
                      { color: m.match >= 8 ? '#10B981' : '#00D4FF' },
                    ]}
                  >
                    ♪ {m.match}/10
                  </Text>
                </View>
              </View>

              <Text style={styles.musicianRole}>
                {m.role} ·{' '}
                <Text style={styles.genreText}>{m.genres.join(', ')}</Text>
              </Text>

              <View style={styles.cardBottom}>
                <View style={styles.ratingPart}>
                  <StarRating value={m.rating} />
                  <Text style={styles.ratingVal}>{m.rating}</Text>
                  <Text style={styles.ratingCount}>({m.reviews})</Text>
                </View>
                <View style={styles.locationPart}>
                  <MapPin size={10} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.locationText}>{m.location}</Text>
                </View>
              </View>

              <MatchBar value={m.match} />
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Music2 size={40} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>No musicians found</Text>
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
    paddingBottom: 16,
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
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  /* Search */
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
    ...Platform.select({ web: { outline: 'none' } as any }),
  },

  /* Filters */
  filterRow: {
    height: 44,
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 34,
    borderRadius: 17,
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

  /* Sort label */
  sortLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    marginBottom: 12,
    fontFamily: 'DM Sans',
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 14,
    gap: 14,
  },

  /* Avatar */
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },

  /* Card body */
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  musicianName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  musicianRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
    marginBottom: 6,
  },
  genreText: {
    color: 'rgba(255,255,255,0.25)',
  },

  /* Match badge */
  matchBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },

  /* Bottom row */
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ratingPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'DM Sans Bold',
  },
  ratingCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'DM Sans',
  },
  locationPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'DM Sans',
  },

  /* Match bar */
  matchBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans',
  },
});
