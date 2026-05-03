import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, MoreVertical, Music, Sparkles, Play, Plus, Video, BookOpen, Layers } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { Orb } from '@/components/ui/Orb';
import { useGigDetails, useGigSetlists, useSetlistSongs, useToggleLearnStatus, useCreateSetlist } from '@/utils/hooks/useMusician';
import { SongPickerModal } from '@/components/setlists/SongPickerModal';

const THEME = {
  bg: '#071420',
  text: '#F0F4FF',
  textSec: 'rgba(200, 215, 235, 0.6)',
  textDim: 'rgba(150, 175, 200, 0.35)',
  surface: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  cyan: '#00D4FF',
};


export default function SetlistDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showPicker, setShowPicker] = React.useState(false);
  const [activeSetlistIdx, setActiveSetlistIdx] = React.useState(0);

  // 1. Data Hooks
  const { data: gig, isLoading: loadingGig } = useGigDetails(id as string);
  const { data: setlists, isLoading: loadingSetlists } = useGigSetlists(id as string);
  
  const currentSetlist = setlists?.[activeSetlistIdx];
  const { data: songs, isLoading: loadingSongs } = useSetlistSongs(currentSetlist?.id);
  const toggleLearn = useToggleLearnStatus();
  const createSetlist = useCreateSetlist();

  const handleYoutubeSearch = async (title: string, artist: string) => {
    const query = encodeURIComponent(`${artist} ${title} minus 1`);
    const url = `https://www.youtube.com/results?search_query=${query}`;
    await WebBrowser.openBrowserAsync(url);
  };

  const handleToggleLearn = (songId: string, currentNotes: string | null) => {
    if (!currentSetlist) return;
    toggleLearn.mutate({
      setlistId: currentSetlist.id,
      songId,
      currentNotes
    });
  };

  const handleAddSet = async () => {
    if (!gig) return;
    const setName = `Set ${ (setlists?.length || 0) + 1 }`;
    try {
      await createSetlist.mutateAsync({
        gigId: id as string,
        bandId: gig.band_id,
        name: setName
      });
      setActiveSetlistIdx((setlists?.length || 0));
    } catch (e) {
      console.error('Failed to add set:', e);
    }
  };

  if (loadingGig || loadingSetlists) {
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
        setlistId={currentSetlist?.id || ''}
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

      {/* Sets Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {setlists?.map((sl: any, idx: number) => (
            <TouchableOpacity 
              key={sl.id} 
              style={[styles.tab, activeSetlistIdx === idx && styles.activeTab]}
              onPress={() => setActiveSetlistIdx(idx)}
            >
              <Text style={[styles.tabText, activeSetlistIdx === idx && styles.activeTabText]}>{sl.name}</Text>
              {activeSetlistIdx === idx && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addSetTab} onPress={handleAddSet}>
            <Plus size={14} color="#00D4FF" />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </ScrollView>
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
            params: { setlistId: currentSetlist?.id } 
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
          songs?.map((item: any, index: number) => {
            const needsLearn = item.notes?.includes('[LEARN]');
            
            return (
              <View key={item.id} style={styles.songRowContainer}>
                <TouchableOpacity 
                  style={styles.songRow} 
                  activeOpacity={0.7} 
                  onPress={() => router.push({ 
                    pathname: '/stage-mode', 
                    params: { setlistId: currentSetlist?.id, initialSongId: item.song.id } 
                  })}
                >
                   <Text style={styles.songIndex}>{String(index + 1).padStart(2, '0')}</Text>
                   
                   <Orb variant={getSongVariant(index)} size={40} style={styles.orb}>
                      <Music size={16} color={getSongColor(index)} />
                   </Orb>

                   <View style={styles.songInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.songTitle}>{item.song.title}</Text>
                        {needsLearn && (
                          <View style={styles.learnBadge}>
                             <Text style={styles.learnBadgeText}>LEARN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.songArtist}>{item.song.artist}</Text>
                   </View>

                   <View style={styles.songMeta}>
                      <View style={styles.keyBadge}>
                         <Text style={styles.keyText}>{item.song.original_key || '?'}</Text>
                      </View>
                      <Text style={styles.durationText}>{Math.floor((item.song.duration_sec || 0) / 60)}:{(item.song.duration_sec || 0) % 60}</Text>
                   </View>
                </TouchableOpacity>
                
                <View style={styles.rowActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleToggleLearn(item.song.id, item.notes)}
                  >
                    <BookOpen size={18} color={needsLearn ? "#F59E0B" : "rgba(255,255,255,0.2)"} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.youtubeBtn}
                    onPress={() => handleYoutubeSearch(item.song.title, item.song.artist)}
                  >
                    <Video size={20} color="#FF0000" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans Medium',
  },
  activeTabText: {
    color: '#00D4FF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: '#00D4FF',
    borderRadius: 2,
  },
  addSetTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    borderStyle: 'dashed',
    marginLeft: 10,
  },
  addSetText: {
    color: '#00D4FF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DM Sans Medium',
    marginLeft: 6,
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
    boxShadow: [{
      color: 'rgba(0, 212, 255, 0.3)',
      offsetX: 0,
      offsetY: 4,
      blurRadius: 10,
    }],
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
  songRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  songRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  youtubeBtn: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
  },
  learnBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  learnBadgeText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
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
