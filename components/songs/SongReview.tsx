import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Music, Trash2 } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from '../ui/Button';
import { Pill } from '../ui/Pill';
import { useAddMultipleSongs } from '../../utils/hooks/useSongs';
import { useAppTheme } from '../../context/theme';

const MOCK_EXTRACTED_SONGS = [
  { id: '1', title: 'Hotel California', artist: 'Eagles', genre: 'Rock', stars: 5, status: 'LIVE' as const },
  { id: '2', title: 'Paraluman', artist: 'Adie', genre: 'OPM', stars: 4, status: 'LIVE' as const },
  { id: '3', title: 'Kundiman', artist: 'Parokya ni Edgar', genre: 'OPM', stars: 5, status: 'LIVE' as const },
  { id: '4', title: 'Sana', artist: 'I Belong to the Zoo', genre: 'OPM', stars: 3, status: 'LEARNING' as const },
  { id: '5', title: 'Faithfully', artist: 'Journey', genre: 'Rock', stars: 4, status: 'LIVE' as const },
  { id: '6', title: 'Harana', artist: 'Parokya ni Edgar', genre: 'OPM', stars: 5, status: 'LIVE' as const },
];

interface SongReviewProps {
  onSave: () => void;
  stepLabel?: string;
  initialSongs?: Array<{ title: string; artist: string; genre: string }>;
}

const CATEGORIES = ['OPM', 'Rock', 'Pop', 'Acoustic', 'Worship', 'Ballad', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Classical', 'Blues', 'Folk', 'Metal', 'Punk', 'Reggae', 'Soul'];

export function SongReview({ onSave, stepLabel, initialSongs = [] }: SongReviewProps) {
  const { colors, isDark } = useAppTheme();

  // Map extracted songs to the UI format
  const mappedSongs = useMemo(() => {
    return initialSongs
      .filter(s => {
        const title = s.title?.trim() || '';
        const artist = s.artist?.trim() || '';
        if (title.length < 2) return false;
        if (/^\d{1,2}:\d{2}$/.test(title)) return false;
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
      const songsToSave = songs.map(s => ({
        title: s.title,
        artist: s.artist,
        genre: s.genre,
      }));
      
      await saveMutation.mutateAsync(songsToSave);
      onSave();
    } catch (error) {
      console.error('Failed to save songs:', error);
    }
  };

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
        <View style={styles.badgeRow}>
          <Pill label={`✓ Extracted ${songs.length} songs`} variant="mint" />
          {stepLabel && <Pill label={stepLabel} variant="mint-subtle" />}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Confirm your songs</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Review detected songs and select genres. They will be added to your repertoire.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {songs.map((song) => (
          <View key={song.id} style={[styles.songRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
              <Music size={16} color="#10B981" />
            </View>

            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
              <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{song.artist}</Text>
              
              <View style={styles.genrePicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => updateGenre(song.id, cat)}
                      style={[
                        styles.genreMiniPill,
                        {
                          backgroundColor: song.genre === cat ? '#10B981' : colors.bgCard,
                          borderColor: song.genre === cat ? '#10B981' : colors.border,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.genreMiniText,
                        { color: song.genre === cat ? '#FFFFFF' : colors.textSecondary },
                        song.genre === cat && { fontWeight: '700' }
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.songMeta}>
              <View style={styles.metaBottom}>
                <Pill 
                  label={song.status} 
                  variant={song.status === 'LIVE' ? 'mint' : 'gold'} 
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

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: isDark ? 'rgba(10, 22, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
        <Button 
          title={saveMutation.isPending ? "Saving to profile..." : "Save to my profile →"} 
          variant="mint" 
          onPress={handleSave}
          disabled={saveMutation.isPending}
          icon={saveMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    lineHeight: 19,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songArtist: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginBottom: 6,
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
    borderWidth: 1,
  },
  genreMiniText: {
    fontSize: 10.5,
    fontFamily: 'DM Sans',
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  metaBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
