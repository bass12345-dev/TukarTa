import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, MoreVertical, Music, Sparkles, Play, Plus, Video, BookOpen, Radio, WifiOff } from 'lucide-react-native';
import { Orb } from '@/components/ui/Orb';
import { useGigDetails, useGigSetlists, useSetlistSongs, useToggleLearnStatus, useCreateSetlist } from '@/utils/hooks/useMusician';
import { SongPickerModal } from '@/components/setlists/SongPickerModal';
import { OfflinePackageModal } from '@/components/setlists/OfflinePackageModal';
import { useAppTheme } from '@/context/theme';
import { useBandSession } from '@/context/bandSession';

export default function SetlistDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { startSession } = useBandSession();
  const [showPicker, setShowPicker] = React.useState(false);
  const [showOfflineModal, setShowOfflineModal] = React.useState(false);
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
    const setName = `Set ${(setlists?.length || 0) + 1}`;
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
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  const dateStr = gig?.gig_date 
    ? new Date(gig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No Date';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SongPickerModal 
        visible={showPicker} 
        onClose={() => setShowPicker(false)} 
        setlistId={currentSetlist?.id || ''}
        currentSongCount={songs?.length || 0}
      />

      <OfflinePackageModal
        visible={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        gigId={id as string}
        setlistId={currentSetlist?.id || ''}
        gigInfo={{
          name: gig?.name || 'Untitled Gig',
          venue: gig?.venue,
          gig_date: gig?.gig_date,
          band: gig?.band,
        }}
        songs={songs || []}
      />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.navRow}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <MoreVertical size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{gig?.name || 'Untitled Gig'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? '#16382C' : '#D1FAE5' }]}>
            <Text style={styles.statusText}>{songs?.length || 0} songs</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {gig?.venue || 'No Venue'} · {gig?.band?.name} · {dateStr}
        </Text>
      </View>

      {/* Sets Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {setlists?.map((sl: any, idx: number) => {
            const isActive = activeSetlistIdx === idx;
            return (
              <TouchableOpacity 
                key={sl.id} 
                style={[
                  styles.tab, 
                  { backgroundColor: isActive ? (isDark ? '#16382C' : '#ECFDF5') : 'transparent' }
                ]}
                onPress={() => setActiveSetlistIdx(idx)}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: isActive ? '#10B981' : colors.textSecondary },
                    isActive && { fontWeight: '700' }
                  ]}
                >
                  {sl.name}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity 
            style={[styles.addSetTab, { borderColor: colors.border }]} 
            onPress={handleAddSet}
          >
            <Plus size={14} color="#10B981" />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.agentBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
          activeOpacity={0.8} 
          onPress={() => router.push({ pathname: '/ai-agent', params: { gigId: id } })}
        >
          <Sparkles size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={[styles.btnText, { color: colors.text }]}>AI Agent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.addManualBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
          activeOpacity={0.8} 
          onPress={() => setShowPicker(true)}
        >
          <Plus size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={[styles.btnText, { color: colors.text }]}>Add Song</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.addManualBtn, { backgroundColor: colors.bgCard, borderColor: '#10B981' }]} 
          activeOpacity={0.8} 
          onPress={() => setShowOfflineModal(true)}
        >
          <WifiOff size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={[styles.btnText, { color: colors.text }]}>Offline Prep</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.addManualBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
          activeOpacity={0.8} 
          onPress={async () => {
            await startSession({
              gigName: gig?.name || 'Live Gig Session',
              setlistId: currentSetlist?.id,
            });
            router.push('/bands');
          }}
        >
          <Radio size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={[styles.btnText, { color: colors.text }]}>Live Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.stageBtn} 
          activeOpacity={0.85} 
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
          <ActivityIndicator color="#10B981" style={{ marginTop: 30 }} />
        ) : songs?.length === 0 ? (
          <View style={styles.emptyState}>
            <Music size={44} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Empty Setlist</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap "Add Song" or use the AI Agent to build your performance set.
            </Text>
          </View>
        ) : (
          songs?.map((item: any, index: number) => {
            const needsLearn = item.notes?.includes('[LEARN]');
            
            return (
              <View key={item.id} style={[styles.songRowContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.songRow} 
                  activeOpacity={0.7} 
                  onPress={() => router.push({ 
                    pathname: '/stage-mode', 
                    params: { setlistId: currentSetlist?.id, initialSongId: item.song.id } 
                  })}
                >
                  <Text style={[styles.songIndex, { color: colors.textSecondary }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                   
                  <View style={[styles.iconBox, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                    <Music size={16} color="#10B981" />
                  </View>

                  <View style={styles.songInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.songTitle, { color: colors.text }]}>{item.song.title}</Text>
                      {needsLearn && (
                        <View style={styles.learnBadge}>
                          <Text style={styles.learnBadgeText}>LEARN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{item.song.artist}</Text>
                  </View>

                  <View style={styles.songMeta}>
                    <View style={[styles.keyBadge, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: '#10B981' }]}>
                      <Text style={styles.keyText}>{item.song.original_key || 'C'}</Text>
                    </View>
                    <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                      {Math.floor((item.song.duration_sec || 0) / 60)}:{(item.song.duration_sec || 0) % 60 < 10 ? '0' : ''}{(item.song.duration_sec || 0) % 60}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.rowActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleToggleLearn(item.song.id, item.notes)}
                  >
                    <BookOpen size={18} color={needsLearn ? "#F59E0B" : colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.youtubeBtn}
                    onPress={() => handleYoutubeSearch(item.song.title, item.song.artist)}
                  >
                    <Video size={18} color="#EF4444" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DM Sans',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  addSetTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginLeft: 6,
  },
  addSetText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
    marginBottom: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  agentBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  addManualBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stageBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#10B981',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    fontSize: 11.5,
    fontWeight: '700',
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
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  songRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  songRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  songIndex: {
    fontSize: 13,
    fontFamily: 'JetBrains Mono',
    width: 24,
    marginRight: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans',
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  keyBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
    minWidth: 32,
    alignItems: 'center',
  },
  keyText: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'JetBrains Mono',
  },
  durationText: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
    width: 36,
    textAlign: 'right',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  actionBtn: {
    paddingHorizontal: 8,
    height: 44,
    justifyContent: 'center',
  },
  youtubeBtn: {
    paddingHorizontal: 8,
    height: 44,
    justifyContent: 'center',
  },
});
