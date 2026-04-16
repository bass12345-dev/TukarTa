import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Music, Trash2, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import { Button } from '../ui/Button';
import { Orb } from '../ui/Orb';
import { Pill } from '../ui/Pill';
import { useAddMultipleSongs } from '../../utils/hooks/useSongs';
import { ActivityIndicator } from 'react-native';

const THEME = {
  bg: '#071420',
  text: '#F0F4FF',
  textSec: 'rgba(200, 215, 235, 0.6)',
  textDim: 'rgba(150, 175, 200, 0.35)',
  surface: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
};

const MOCK_EXTRACTED_SONGS = [
  { id: '1', title: 'Hotel California', artist: 'Eagles', genre: 'Rock', stars: 5, status: 'LIVE' as const, variant: 'cyan' },
  { id: '2', title: 'Paraluman', artist: 'Adie', genre: 'OPM', stars: 4, status: 'LIVE' as const, variant: 'purple' },
  { id: '3', title: 'Kundiman', artist: 'Parokya ni Edgar', genre: 'OPM', stars: 5, status: 'LIVE' as const, variant: 'gold' },
  { id: '4', title: 'Sana', artist: 'I Belong to the Zoo', genre: 'OPM', stars: 3, status: 'LEARNING' as const, variant: 'pink' },
  { id: '5', title: 'Faithfully', artist: 'Journey', genre: 'Rock', stars: 4, status: 'LIVE' as const, variant: 'cyan' },
  { id: '6', title: 'Harana', artist: 'Parokya ni Edgar', genre: 'OPM', stars: 5, status: 'LIVE' as const, variant: 'green' },
];

interface SongReviewProps {
  onSave: () => void;
  stepLabel?: string;
  initialSongs?: Array<{ title: string; artist: string; genre: string }>;
}

const CATEGORIES = ['OPM', 'Rock', 'Pop', 'Acoustic', 'Worship', 'Ballad', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Classical', 'Blues', 'Folk', 'Metal', 'Punk', 'Reggae', 'Soul', 'Latin'];

export function SongReview({ onSave, stepLabel, initialSongs = [] }: SongReviewProps) {
  // Map extracted songs to the UI format
  const mappedSongs = useMemo(() => {
    return initialSongs
      .filter(s => {
        const title = s.title?.trim() || '';
        const artist = s.artist?.trim() || '';
        // Skip if title is empty or too short
        if (title.length < 2) return false;
        // Skip things that look like timestamps (e.g. "12:00", "3:45")
        if (/^\d{1,2}:\d{2}$/.test(title)) return false;
        // Skip purely numeric strings (likely battery or page numbers)
        if (/^\d+$/.test(title) && artist.toLowerCase() === 'unknown artist') return false;
        return true;
      })
      .map((s, idx) => ({
        id: `extracted-${idx}-${Date.now()}`,
        title: s.title,
        artist: s.artist,
        genre: s.genre || 'Pop',
        stars: 5,
        status: 'LIVE' as const,
        variant: ['cyan', 'purple', 'gold', 'green', 'pink'][idx % 5]
      }));
  }, [initialSongs]);

  const [songs, setSongs] = useState(mappedSongs.length > 0 ? mappedSongs : MOCK_EXTRACTED_SONGS);
  const saveMutation = useAddMultipleSongs();

  const removeSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  const updateGenre = (id: string, genre: string) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, genre } : s));
  };

  const handleSave = async () => {
    try {
      // Prepare songs for saving
      const songsToSave = songs.map(s => ({
        title: s.title,
        artist: s.artist,
        genre: s.genre
      }));
      
      await saveMutation.mutateAsync(songsToSave);
      onSave(); // Navigate away
    } catch (error) {
      console.error('Failed to save songs:', error);
      alert('Failed to save songs to profile.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Pill label={`✓ AI extracted ${songs.length} songs`} variant="green" />
          {stepLabel && <Pill label={stepLabel} variant="cyan" />}
        </View>
        <Text style={styles.title}>Confirm your songs</Text>
        <Text style={styles.subtitle}>
          Rate confidence. Only "Live" songs appear to bands.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {songs.map((song) => (
          <View key={song.id} style={styles.songRow}>
            <Orb variant={song.variant as any} size={34}>
              <Music size={14} color={getVariantColor(song.variant)} />
            </Orb>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songArtist}>{song.artist}</Text>
              
              <View style={styles.genrePicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => updateGenre(song.id, cat)}
                      style={[
                        styles.genreMiniPill, 
                        song.genre === cat && styles.genreMiniPillActive
                      ]}
                    >
                      <Text style={[
                        styles.genreMiniText,
                        song.genre === cat && styles.genreMiniTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.songMeta}>
              <View style={styles.stars}>
                <Text style={styles.starText}>{'★'.repeat(song.stars)}<Text style={styles.starOff}>{'★'.repeat(5 - song.stars)}</Text></Text>
              </View>
              <View style={styles.metaBottom}>
                <Pill 
                  label={song.status} 
                  variant={song.status === 'LIVE' ? 'green' : 'gold'} 
                  style={styles.statusPill} 
                />
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => removeSong(song.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={saveMutation.isPending ? "Saving to profile..." : "Save to my profile →"} 
          variant="cyan" 
          onPress={handleSave}
          disabled={saveMutation.isPending}
          icon={saveMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : null}
        />
      </View>
    </View>
  );
}

function getVariantColor(variant: string) {
  switch (variant) {
    case 'cyan': return '#00D4FF';
    case 'purple': return '#8B5CF6';
    case 'gold': return '#F59E0B';
    case 'green': return '#10B981';
    case 'pink': return '#EC4899';
    default: return '#00D4FF';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.glassBorder,
    gap: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: THEME.text,
    fontFamily: 'DM Sans Bold',
  },
  songArtist: {
    fontSize: 11.5,
    color: THEME.textSec,
    fontFamily: 'DM Sans',
    marginBottom: 8,
  },
  genrePicker: {
    marginTop: 2,
  },
  genreScroll: {
    gap: 6,
    paddingRight: 10,
  },
  genreMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreMiniPillActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: '#00D4FF',
  },
  genreMiniText: {
    fontSize: 10,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans Bold',
  },
  genreMiniTextActive: {
    color: '#00D4FF',
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  metaBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  starText: {
    fontSize: 11,
    color: '#F59E0B',
  },
  starOff: {
    color: 'rgba(255, 255, 255, 0.12)',
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: THEME.glassBorder,
  },
});
