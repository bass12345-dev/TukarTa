import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Music, Star as StarIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';

const THEME = {
  bg: '#071420',
  text: '#F0F4FF',
  textSec: 'rgba(200, 215, 235, 0.6)',
  textDim: 'rgba(150, 175, 200, 0.35)',
  surface: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
};

const MOCK_EXTRACTED_SONGS = [
  { id: '1', title: 'Hotel California', info: 'Eagles · Rock', stars: 5, status: 'LIVE', variant: 'cyan' },
  { id: '2', title: 'Paraluman', info: 'Adie · OPM', stars: 4, status: 'LIVE', variant: 'purple' },
  { id: '3', title: 'Kundiman', info: 'Parokya ni Edgar · OPM', stars: 5, status: 'LIVE', variant: 'gold' },
  { id: '4', title: 'Sana', info: 'I Belong to the Zoo · OPM', stars: 3, status: 'LEARNING', variant: 'pink' },
  { id: '5', title: 'Faithfully', info: 'Journey · Rock', stars: 4, status: 'LIVE', variant: 'cyan' },
  { id: '6', title: 'Harana', info: 'Parokya ni Edgar · OPM', stars: 5, status: 'LIVE', variant: 'green' },
];

export default function ReviewSongsScreen() {
  const router = useRouter();
  const [songs] = useState(MOCK_EXTRACTED_SONGS);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Pill label={`✓ AI extracted ${songs.length} songs`} variant="green" />
          <Pill label="Step 2 of 3" variant="cyan" />
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
              <Text style={styles.songArtist}>{song.info}</Text>
            </View>
            <View style={styles.songMeta}>
              <View style={styles.stars}>
                <Text style={styles.starText}>{'★'.repeat(song.stars)}<Text style={styles.starOff}>{'★'.repeat(5 - song.stars)}</Text></Text>
              </View>
              <Pill 
                label={song.status} 
                variant={song.status === 'LIVE' ? 'green' : 'gold'} 
                style={styles.statusPill} 
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Save to my profile →" 
          variant="cyan" 
          onPress={() => router.replace('/(tabs)')} 
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
    paddingTop: 24,
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
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 5,
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
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: THEME.glassBorder,
  },
});
