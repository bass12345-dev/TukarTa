import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Music, Sparkles, Play } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';

const MOCK_SETLIST_SONGS = [
  { id: '1', title: 'Hotel California', artist: 'Eagles', key: 'Am', duration: '6:30', variant: 'cyan' },
  { id: '2', title: 'Faithfully', artist: 'Journey', key: 'E', duration: '4:26', variant: 'purple' },
  { id: '3', title: 'Paraluman', artist: 'Adie', key: 'C', duration: '3:58', variant: 'gold' },
  { id: '4', title: 'Kundiman', artist: 'Parokya ni Edgar', key: 'G', duration: '4:10', variant: 'green' },
  { id: '5', title: 'More Than Words', artist: 'Extreme', key: 'G', duration: '5:56', variant: 'cyan' },
  { id: '6', title: 'Sana', artist: 'I Belong to the Zoo', key: 'D', duration: '3:44', variant: 'pink' },
  { id: '7', title: 'Tadhana', artist: 'Up Dharma Down', key: 'A', duration: '5:02', variant: 'purple' },
];

export default function SetlistDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MoreVertical size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Acoustic Vibes Mix</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>3/4 ✓</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Handuraw Café · 90 min · 11 songs</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.agentBtn} activeOpacity={0.8} onPress={() => router.push('/ai-agent')}>
          <Sparkles size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>AI Agent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.stageBtn} activeOpacity={0.8} onPress={() => router.push('/stage-mode')}>
           <Play size={18} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
           <Text style={styles.btnTextBold}>Stage Mode</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {MOCK_SETLIST_SONGS.map((song, index) => (
          <TouchableOpacity key={song.id} style={styles.songRow} activeOpacity={0.7} onPress={() => router.push('/stage-mode')}>
             <Text style={styles.songIndex}>{String(index + 1).padStart(2, '0')}</Text>
             
             <Orb variant={song.variant as any} size={40} style={styles.orb}>
                <Music size={16} color={getVariantColor(song.variant)} />
             </Orb>

             <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songArtist}>{song.artist}</Text>
             </View>

             <View style={styles.songMeta}>
                <View style={styles.keyBadge}>
                   <Text style={styles.keyText}>{song.key}</Text>
                </View>
                <Text style={styles.durationText}>{song.duration}</Text>
             </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    backgroundColor: 'var(--color-bg)',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  agentBtn: {
    flex: 1,
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stageBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#00D4FF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  btnTextBold: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  songIndex: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.2)',
    fontFamily: 'JetBrains Mono',
    width: 24,
    marginRight: 12,
  },
  orb: {
    marginRight: 16,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keyBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    minWidth: 34,
    alignItems: 'center',
  },
  keyText: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '700',
    fontFamily: 'JetBrains Mono',
  },
  durationText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.25)',
    fontFamily: 'DM Sans',
    width: 38,
    textAlign: 'right',
  },
});
