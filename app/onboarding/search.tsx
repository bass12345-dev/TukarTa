import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Search, ChevronLeft, Music, Plus, Check } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { MOCK_SONGS } from '../../components/onboarding/constants';

export default function SongSearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'OPM', 'Rock', 'Pop'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
        {MOCK_SONGS.map((song) => (
          <View key={song.id} style={styles.songCard}>
            <View style={[styles.iconBox, { backgroundColor: `${song.color}15` }]}>
              <Music size={22} color={song.color} />
            </View>
            
            <View style={styles.songDetails}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songSub}>
                {song.artist} · {song.genre} · {song.duration}
              </Text>
            </View>

            <View style={styles.actionContainer}>
              <View style={[styles.badge, { backgroundColor: song.hasLyrics ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={[styles.badgeText, { color: song.hasLyrics ? '#10B981' : '#F59E0B' }]}>
                  {song.hasLyrics ? '✓ Lyrics' : 'No lyrics'}
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Plus size={18} color="rgba(255, 255, 255, 0.3)" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
    paddingTop: 60,
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
});
