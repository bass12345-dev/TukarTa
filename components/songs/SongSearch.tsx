import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Search, ChevronLeft, Music, Plus, Check } from 'lucide-react-native';
import { Pill } from '../ui/Pill';
import { useSearchSongs, useAddSong } from '../../utils/hooks/useSongs';
import { ActivityIndicator } from 'react-native';

const COLORS = ['#00D4FF', '#8B5CF6', '#34D399', '#F59E0B', '#F472B6'];

interface SongSearchProps {
  onBack: () => void;
}

export function SongSearch({ onBack }: SongSearchProps) {
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
      alert('Failed to add song');
    }
  };

  const filters = ['All', 'OPM', 'Rock', 'Pop'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={24} color="#00D4FF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Search songs</Text>
        <Text style={styles.subtitle}>
          Powered by LRCLIB + TheAudioDB — no sign-up needed.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="rgba(255, 255, 255, 0.4)" />
          <TextInput
            style={styles.input}
            placeholder="Hotel California"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity key={filter} onPress={() => setActiveFilter(filter)}>
              <Pill 
                label={filter} 
                variant={activeFilter === filter ? "cyan" : "outline"}
                style={styles.filterPill}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>RESULTS FROM LRCLIB & THEAUDIODB</Text>

      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={styles.loaderText}>Searching LRCLIB...</Text>
          </View>
        ) : results?.length === 0 ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.loaderText}>No songs found for "{debouncedSearch}"</Text>
          </View>
        ) : (
          (results || []).map((song, idx) => (
            <View key={song.id} style={styles.songCard}>
              <View style={[styles.iconBox, { backgroundColor: `${COLORS[idx % COLORS.length]}15` }]}>
                <Music size={22} color={COLORS[idx % COLORS.length]} />
              </View>
              
              <View style={styles.songDetails}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songSub}>
                  {song.artist} {song.album ? `· ${song.album}` : ''} {song.duration ? `· ${song.duration}` : ''}
                </Text>
              </View>

              <View style={styles.actionContainer}>
                <View style={[styles.badge, { backgroundColor: song.hasLyrics ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                  <Text style={[styles.badgeText, { color: song.hasLyrics ? '#10B981' : '#F59E0B' }]}>
                    {song.hasLyrics ? '✓ Lyrics' : 'No lyrics'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, addedSongs.has(song.id) && styles.addedButton]}
                  onPress={() => handleAdd(song)}
                  disabled={addedSongs.has(song.id) || addSongMutation.isPending}
                >
                  {addedSongs.has(song.id) ? (
                    <Check size={18} color="#10B981" />
                  ) : (
                    <Plus size={18} color="rgba(255, 255, 255, 0.3)" />
                  ) }
                </TouchableOpacity>
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
    backgroundColor: '#071420',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00D4FF',
    fontFamily: 'DM Sans',
    marginLeft: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'DM Sans',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  filterContainer: {
    marginBottom: 30,
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 24,
    height: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(150, 175, 200, 0.4)',
    fontFamily: 'DM Sans Bold',
    marginLeft: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  resultsScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songDetails: {
    flex: 1,
    marginLeft: 16,
  },
  songTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  songSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
  actionContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedButton: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
});
