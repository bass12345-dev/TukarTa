import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, MapPin, Star, Music2, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDiscoverMusicians } from '../../utils/hooks/useMusician';

const FILTERS = ['All', 'Singer', 'Guitarist', 'Bassist', 'Drummer', 'Keys'];

function StarRating({ value }: { value: number }) {
  const rating = value || 0;
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          color="#F59E0B"
          fill={s <= Math.round(rating) ? '#F59E0B' : 'transparent'}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

function MatchBar({ value }: { value: number }) {
  const cappedValue = Math.min(value, 10);
  const pct = (cappedValue / 10) * 100;
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

  const { data: musicians, isLoading, error } = useDiscoverMusicians();

  const filtered = (musicians || []).filter((m) => {
    const roles = m.musician_profile?.roles || [];
    const matchFilter = activeFilter === 'All' || roles.includes(activeFilter);
    
    const musicianName = m.display_name || '';
    const genres = m.musician_profile?.genres || [];
    
    const matchQuery =
      query === '' ||
      musicianName.toLowerCase().includes(query.toLowerCase()) ||
      genres.some((g: string) => g.toLowerCase().includes(query.toLowerCase()));
    return matchFilter && matchQuery;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = ['#1E40AF', '#065F46', '#7C3AED', '#B45309', '#BE123C'];
    const index = parseInt(id.slice(-1), 16) % colors.length;
    return colors[isNaN(index) ? 0 : index];
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>EXPLORE</Text>
          <Text style={styles.title}>Discover Musicians</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerBadge}
          onPress={() => router.push('/(tabs)')}
        >
          <Music2 size={18} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Search size={16} color="rgba(255,255,255,0.35)" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name, genre..."
          placeholderTextColor="rgba(255,255,255,0.22)"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
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
      </View>

      {!isLoading && !error && (
        <Text style={styles.sortLabel}>
          {filtered.length} musicians · sorted by song match
        </Text>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={styles.emptyText}>Finding talent...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerState}>
            <AlertCircle size={40} color="#EF4444" />
            <Text style={styles.emptyText}>Something went wrong</Text>
          </View>
        )}

        {!isLoading && !error && filtered.map((m) => {
          const profile = m.musician_profile;
          const matchScore = m.match_score || 0;
          const initials = getInitials(m.display_name || 'M');
          const avatarColor = getAvatarColor(m.id);
          const primaryRole = profile?.roles?.[0] || 'Musician';
          const genres = profile?.genres || [];

          return (
            <TouchableOpacity
              key={m.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/musician/${m.id}`)}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                {m.avatar_url ? (
                   <View style={styles.avatarPlaceholder} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
                {profile?.is_available && <View style={styles.availableDot} />}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.musicianName} numberOfLines={1}>{m.display_name}</Text>
                  <View
                    style={[
                      styles.matchBadge,
                      {
                        backgroundColor:
                          matchScore >= 8
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(0,212,255,0.08)',
                        borderColor:
                          matchScore >= 8
                            ? 'rgba(16,185,129,0.45)'
                            : 'rgba(0,212,255,0.3)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        { color: matchScore >= 8 ? '#10B981' : '#00D4FF' },
                      ]}
                    >
                      ♪ {matchScore}
                    </Text>
                  </View>
                </View>

                <Text style={styles.musicianRole} numberOfLines={1}>
                  {primaryRole} ·{' '}
                  <Text style={styles.genreText}>{genres.slice(0, 3).join(', ')}</Text>
                </Text>

                <View style={styles.cardBottom}>
                  <View style={styles.ratingPart}>
                    <StarRating value={profile?.avg_rating || 5} />
                    <Text style={styles.ratingVal}>{profile?.avg_rating || '5.0'}</Text>
                    <Text style={styles.ratingCount}>({profile?.rating_count || 0})</Text>
                  </View>
                  <View style={styles.locationPart}>
                    <MapPin size={10} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.locationText}>{m.city || 'Cebu'}</Text>
                  </View>
                </View>

                <MatchBar value={matchScore} />
              </View>
            </TouchableOpacity>
          );
        })}

        {!isLoading && !error && filtered.length === 0 && (
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
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  filterRow: {
    height: 44,
    marginBottom: 10,
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
  },
  filterTextActive: {
    color: '#00D4FF',
  },
  sortLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },
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
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  },
  musicianRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  genreText: {
    color: 'rgba(255,255,255,0.25)',
  },
  matchBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '700',
  },
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
  },
  ratingCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
  locationPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.2)',
  },
});
