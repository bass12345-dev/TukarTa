import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Search, ArrowLeft, Music, Plus, Check, FileCode2 } from 'lucide-react-native';
import { useSearchSongs, useAddSong } from '../../utils/hooks/useSongs';
import { useAppTheme } from '../../context/theme';

export function SongSearch({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const segments = useSegments();
  const isInOnboarding = segments[0] === 'onboarding';
  const { colors, isDark } = useAppTheme();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [addedSongs, setAddedSongs] = useState<Set<string | number>>(new Set());

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results, isLoading } = useSearchSongs(debouncedSearch);
  const addSongMutation = useAddSong();

  const handleAdd = async (song: any) => {
    try {
      await addSongMutation.mutateAsync(song);
      setAddedSongs(prev => new Set([...prev, song.id]));
    } catch (error) {
      console.error('Failed to add song:', error);
    }
  };

  const filters = ['All', 'OPM', 'Rock', 'Pop'];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['#132821', colors.bg] : ['#F0FDF4', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
          onPress={onBack}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>Search songs</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search from 1M+ tracks powered by LRCLIB + TheAudioDB with synced chords & lyrics.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search size={20} color={colors.primary} />
          <TextInput
            style={[styles.input, { color: colors.inputText }]}
            placeholder="Search by title or artist (e.g. Ang Huling El Bimbo)..."
            placeholderTextColor={colors.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity 
                key={filter} 
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? '#10B981' : colors.bgCard,
                    borderColor: isActive ? '#10B981' : colors.border,
                  }
                ]}
              >
                <Text 
                  style={[
                    styles.filterText, 
                    { color: isActive ? '#FFFFFF' : colors.text },
                    isActive && { fontWeight: '700' }
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        SEARCH RESULTS
      </Text>

      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Searching songs & lyrics...</Text>
          </View>
        ) : debouncedSearch && results?.length === 0 ? (
          <View style={styles.loaderContainer}>
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>No songs found for "{debouncedSearch}"</Text>
          </View>
        ) : (
          (results || []).map((song, idx) => (
            <View key={song.id} style={[styles.songCard, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                <Music size={22} color="#10B981" />
              </View>
              
              <View style={styles.songDetails}>
                <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
                <Text style={[styles.songSub, { color: colors.textSecondary }]}>
                  {song.artist} {song.album ? `· ${song.album}` : ''} {song.duration ? `· ${song.duration}` : ''}
                </Text>
              </View>

              <View style={styles.actionContainer}>
                <View 
                  style={[
                    styles.badge, 
                    { 
                      backgroundColor: song.hasLyrics 
                        ? (isDark ? '#16382C' : '#D1FAE5') 
                        : (isDark ? '#2D2010' : '#FEF3C7') 
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.badgeText, 
                      { color: song.hasLyrics ? '#10B981' : '#D97706' }
                    ]}
                  >
                    {song.hasLyrics ? '✓ Synced' : 'Chords'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[
                      styles.importChordBtn,
                      {
                        borderColor: '#10B981',
                        backgroundColor: isDark ? '#16382C' : '#ECFDF5',
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: isInOnboarding ? '/onboarding/import' : '/songs/import',
                        params: { title: song.title, artist: song.artist },
                      })
                    }
                  >
                    <FileCode2 size={13} color="#10B981" />
                    <Text style={styles.importChordBtnText}>+ Chords</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.addButton, 
                      { borderColor: colors.border },
                      addedSongs.has(song.id) && styles.addedButton
                    ]}
                    onPress={() => handleAdd(song)}
                    disabled={addedSongs.has(song.id) || addSongMutation.isPending}
                  >
                    {addedSongs.has(song.id) ? (
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <Plus size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  filterContainer: {
    marginBottom: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 12,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  resultsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songDetails: {
    flex: 1,
    marginLeft: 14,
  },
  songTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 3,
  },
  songSub: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  actionContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importChordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  importChordBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  addedButton: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
});
