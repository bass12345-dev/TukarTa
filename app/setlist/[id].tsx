import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Music, Sparkles, Play, Plus } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { useGigDetails, useGigSetlist, useSetlistSongs } from '../../utils/hooks/useMusician';
import { SongPickerModal } from '../../components/setlists/SongPickerModal';
import { ActivityIndicator } from 'react-native';

const THEME = {
  bg: '#071420',
  text: '#F0F4FF',
  textSec: 'rgba(200, 215, 235, 0.6)',
  textDim: 'rgba(150, 175, 200, 0.35)',
  surface: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
};


export default function SetlistDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showPicker, setShowPicker] = React.useState(false);

  // 1. Data Hooks
  const { data: gig, isLoading: loadingGig } = useGigDetails(id as string);
  const { data: setlist, isLoading: loadingSetlist } = useGigSetlist(id as string);
  const { data: songs, isLoading: loadingSongs } = useSetlistSongs(setlist?.id);

  if (loadingGig || loadingSetlist) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#00D4FF" size="large" />
      </View>
    );
  }

  const dateStr = gig?.gig_date 
    ? new Date(gig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No Date';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SongPickerModal 
        visible={showPicker} 
        onClose={() => setShowPicker(false)} 
        setlistId={setlist?.id}
        currentSongCount={songs?.length || 0}
      />

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
          <Text style={styles.title}>{gig?.name || 'Untitled Gig'}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{songs?.length || 0} songs</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{gig?.venue || 'No Venue'} · {gig?.band?.name} · {dateStr}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.agentBtn} 
          activeOpacity={0.8} 
          onPress={() => router.push({ pathname: '/ai-agent', params: { gigId: id } })}
        >
          <Sparkles size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>AI Agent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addManualBtn} 
          activeOpacity={0.8} 
          onPress={() => setShowPicker(true)}
        >
           <Plus size={18} color="#FFF" style={{ marginRight: 8 }} />
           <Text style={styles.btnText}>Add Song</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.stageBtn} 
          activeOpacity={0.8} 
          onPress={() => router.push({ 
            pathname: '/stage-mode', 
            params: { setlistId: setlist?.id } 
          })}
        >
           <Play size={18} color="#FFF" fill="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingSongs ? (
          <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />
        ) : songs?.length === 0 ? (
          <View style={styles.emptyState}>
            <Music size={48} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyTitle}>Empty Setlist</Text>
            <Text style={styles.emptySubtitle}>Tap "Add Song" or use the AI Agent to build your set.</Text>
          </View>
        ) : (
          songs?.map((item: any, index: number) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.songRow} 
              activeOpacity={0.7} 
              onPress={() => router.push({ 
                pathname: '/stage-mode', 
                params: { setlistId: setlist?.id, initialSongId: item.song.id } 
              })}
            >
               <Text style={styles.songIndex}>{String(index + 1).padStart(2, '0')}</Text>
               
               <Orb variant={getSongVariant(index)} size={40} style={styles.orb}>
                  <Music size={16} color={getSongColor(index)} />
               </Orb>

               <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.song.title}</Text>
                  <Text style={styles.songArtist}>{item.song.artist}</Text>
               </View>

               <View style={styles.songMeta}>
                  <View style={styles.keyBadge}>
                     <Text style={styles.keyText}>{item.song.original_key || '?'}</Text>
                  </View>
                  <Text style={styles.durationText}>{Math.floor((item.song.duration_sec || 0) / 60)}:{(item.song.duration_sec || 0) % 60}</Text>
               </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getSongVariant(index: number) {
  const variants = ['cyan', 'purple', 'gold', 'green', 'pink'];
  return variants[index % variants.length] as any;
}

function getSongColor(index: number) {
  const colors = ['#00D4FF', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];
  return colors[index % colors.length];
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  agentBtn: {
    flex: 1.5,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addManualBtn: {
    flex: 1.5,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stageBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#00D4FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'DM Sans',
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
