import React, { useState } from 'react';
import {
  View,
  Image,
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
import { useAppTheme } from '../../context/theme';

import { RefreshControl } from 'react-native';
import { useRefresh } from '../../utils/hooks/useRefresh';
import { useHeaderTopPadding, useTabBarPadding } from '../../utils/hooks/useTabBarPadding';
const FILTERS = ['All', 'Singer', 'Guitarist', 'Bassist', 'Drummer', 'Keys'];

// Roles are stored as short codes (e.g. 'drum', 'bass'), so each filter matches several codes.
const ROLE_CODES: Record<string, string[]> = {
  Singer: ['singer', 'vocal', 'vocals', 'vocalist'],
  Guitarist: ['guitar', 'guitarist'],
  Bassist: ['bass', 'bassist'],
  Drummer: ['drum', 'drums', 'drummer'],
  Keys: ['keys', 'keyboard', 'keyboardist', 'piano'],
};

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined);

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

function MatchBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 50 ? '#10B981' : pct > 0 ? '#34D399' : 'rgba(255,255,255,0.25)';
  return (
    <View style={styles.matchBarTrack}>
      <View style={[styles.matchBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function DiscoverScreen() {
  const tabBarPadding = useTabBarPadding();
  const headerTop = useHeaderTopPadding();
  const { refreshing, onRefresh } = useRefresh();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');

  const { data: musicians, isLoading, error } = useDiscoverMusicians();

  const filtered = (musicians || []).filter((m) => {
    const roles: string[] = (m.musician_profile?.roles || []).map((r: string) => r.toLowerCase());
    const matchFilter =
      activeFilter === 'All' || roles.some((r) => (ROLE_CODES[activeFilter] || [activeFilter.toLowerCase()]).includes(r));
    
    const musicianName = m.display_name || '';
    const genres = m.musician_profile?.genres || [];
    
    const matchQuery =
      query === '' ||
      musicianName.toLowerCase().includes(query.toLowerCase()) ||
      genres.some((g: string) => g.toLowerCase().includes(query.toLowerCase()));
    return matchFilter && matchQuery;
  });

  // Scale the library bars against the largest library in the current list.
  const maxLibrary = Math.max(1, ...filtered.map((m) => m.library_size || 0));

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const palette = isDark 
      ? ['#065F46', '#1E3A8A', '#5B21B6', '#92400E', '#831843'] 
      : ['#D1FAE5', '#DBEAFE', '#EDE9FE', '#FEF3C7', '#FFE4E6'];
    const index = parseInt(id.slice(-1), 16) % palette.length;
    return palette[isNaN(index) ? 0 : index];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border, paddingTop: headerTop }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>EXPLORE</Text>
          <Text style={[styles.title, { color: colors.text }]}>Discover Musicians</Text>
        </View>
        <TouchableOpacity 
          style={[styles.headerBadge, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Music2 size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textDim} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name, genre..."
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.searchInput,
            { color: colors.inputText },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
          ]}
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
                style={[
                  styles.filterPill, 
                  { 
                    backgroundColor: active ? colors.primary : colors.bgCard,
                    borderColor: active ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { 
                      color: active ? '#FFFFFF' : colors.text,
                      fontWeight: active ? '700' : '600'
                    }
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!isLoading && !error && (
        <Text style={[styles.sortLabel, { color: colors.textDim }]}>
          {filtered.length} musicians · same genres first, then songs in common
        </Text>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.bgCard}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textDim }]}>Finding talent...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerState}>
            <AlertCircle size={40} color="#EF4444" />
            <Text style={[styles.emptyText, { color: colors.text }]}>Something went wrong</Text>
          </View>
        )}

        {!isLoading && !error && filtered.map((m) => {
          const profile = m.musician_profile;
          const libraryCount = m.library_size || 0;
          const initials = getInitials(m.display_name || 'M');
          const avatarColor = getAvatarColor(m.id);
          const primaryRole = cap(profile?.roles?.[0]) || 'Musician';
          const genres = profile?.genres || [];

          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.card, 
                { 
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border
                }
              ]}
              activeOpacity={0.8}
              onPress={() => router.push(`/musician/${m.id}`)}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor, borderWidth: 1, borderColor: colors.border }]}>
                {m.avatar_url ? (
                  <Image source={{ uri: m.avatar_url }} style={styles.avatarPlaceholder} />
                ) : (
                  <Text style={[styles.avatarText, { color: isDark ? '#FFFFFF' : colors.primaryDark }]}>{initials}</Text>
                )}
                {profile?.is_available && <View style={styles.availableDot} />}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.musicianName, { color: colors.text }]} numberOfLines={1}>{m.display_name}</Text>
                  <View
                    style={[
                      styles.matchBadge,
                      {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        { color: colors.primaryDark },
                      ]}
                    >
                      ♪ {m.genre_overlap || 0}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.musicianRole, { color: colors.primary }]} numberOfLines={1}>
                  {primaryRole} ·{' '}
                  <Text style={[styles.genreText, { color: colors.textDim }]}>{genres.slice(0, 3).join(', ')}</Text>
                </Text>

                <View style={styles.cardBottom}>
                  <View style={styles.ratingPart}>
                    <StarRating value={profile?.avg_rating || 5} />
                    <Text style={styles.ratingVal}>{profile?.avg_rating || '5.0'}</Text>
                    <Text style={[styles.ratingCount, { color: colors.textDim }]}>({profile?.rating_count || 0})</Text>
                  </View>
                  <View style={styles.locationPart}>
                    <MapPin size={10} color={colors.textDim} />
                    <Text style={[styles.locationText, { color: colors.textDim }]}>{m.city || 'Cebu'}</Text>
                  </View>
                </View>

                <Text style={[styles.ratingCount, { color: colors.textDim, marginTop: 2 }]}>
                  {libraryCount} songs known · {m.genre_overlap || 0} shared genres
                </Text>
                <MatchBar value={libraryCount} max={maxLibrary} />
              </View>
            </TouchableOpacity>
          );
        })}

        {!isLoading && !error && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Music2 size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textDim }]}>No musicians found</Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.3,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  filterRow: {
    height: 44,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterPill: {
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'DM Sans',
  },
  filterTextActive: {
  },
  sortLabel: {
    fontSize: 11,
    paddingHorizontal: 20,
    marginBottom: 10,
    fontFamily: 'DM Sans',
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
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  availableDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    fontFamily: 'DM Sans',
  },
  musicianRole: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  genreText: {
    fontFamily: 'DM Sans',
  },
  matchBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans',
  },
  ratingCount: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  locationPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  matchBarTrack: {
    height: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  centerState: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  emptyState: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
});
