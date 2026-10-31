import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, PanResponder } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical, Music, Sparkles, Play, Plus, BookOpen, ChevronUp, ChevronDown, Radio, WifiOff, Share2, Copy, Trash2, Edit3, X, Check, ListMusic } from 'lucide-react-native';
import { Modal, Alert } from 'react-native';
import { Orb } from '@/components/ui/Orb';
import { Swipeable } from 'react-native-gesture-handler';
import { useGigDetails, useGigSetlists, useSetlistSongs, useToggleLearnStatus, useCreateSetlist, useRemoveSetlistSong, useReorderSetlistSongs } from '@/utils/hooks/useMusician';
import { songLyricsQuery } from '@/utils/hooks/useSongs';
import { isValidKey } from '@/utils/musicKey';
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
  const [showMenuModal, setShowMenuModal] = React.useState(false);

  // Swipe left / right across the body switches between the setlists of this gig.
  const setlistCountRef = React.useRef(0);
  const swipeResponder = React.useRef(
    PanResponder.create({
      // Bubble phase, not capture: song rows (swipe to delete) get the gesture first.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_, g) => {
        const count = setlistCountRef.current;
        if (count < 2) return;
        if (g.dx < -60) setActiveSetlistIdx((i) => Math.min(count - 1, i + 1));
        else if (g.dx > 60) setActiveSetlistIdx((i) => Math.max(0, i - 1));
      },
    })
  ).current;

  // 1. Data Hooks
  const { data: gig, isLoading: loadingGig } = useGigDetails(id as string);
  const { data: setlists, isLoading: loadingSetlists } = useGigSetlists(id as string);
  setlistCountRef.current = setlists?.length || 0; // the swipe handler reads this
  
  const currentSetlist = setlists?.[activeSetlistIdx];
  const { data: songs, isLoading: loadingSongs } = useSetlistSongs(currentSetlist?.id);
  const queryClient = useQueryClient();

  // Warm the lyrics for the opening songs so stage mode can show them with no wait
  useEffect(() => {
    (songs || []).slice(0, 2).forEach((item: any) => {
      if (!item?.song?.id || item.plain_lyrics) return;
      const q = songLyricsQuery(item.song.id, item.song.artist, item.song.title);
      void queryClient.prefetchQuery({ queryKey: q.queryKey, queryFn: q.queryFn, staleTime: Infinity, gcTime: q.gcTime });
    });
  }, [songs]);
  const toggleLearn = useToggleLearnStatus();
  const createSetlist = useCreateSetlist();
  const removeSong = useRemoveSetlistSong();
  const reorderSongs = useReorderSetlistSongs();

  // Move one song up or down the running order and save the new order
  const moveSong = (fromIndex: number, toIndex: number) => {
    if (!songs || !currentSetlist?.id) return;
    if (toIndex < 0 || toIndex >= songs.length || fromIndex === toIndex) return;
    const rowIds = songs.map((s: any) => s.id as string);
    const [moved] = rowIds.splice(fromIndex, 1);
    rowIds.splice(toIndex, 0, moved);
    reorderSongs.mutate(
      { rowIds, setlistId: currentSetlist.id },
      { onError: () => Alert.alert('Could not reorder', 'Check your connection and try again.') },
    );
  };

  const confirmRemoveSong = (item: any) => {
    if (!currentSetlist) return;
    const title = item.song?.title || 'this song';
    const run = () =>
      removeSong.mutate(
        { rowId: item.id, setlistId: currentSetlist.id },
        { onError: () => Alert.alert('Could not remove', 'Check your connection and try again.') },
      );
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${title}" from this setlist?`)) run();
      return;
    }
    Alert.alert('Remove song?', `"${title}" will be removed from this setlist.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: run },
    ]);
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
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => setShowMenuModal(true)}
            activeOpacity={0.7}
          >
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

      {/* Scrollable action chips: avoids compressed layout on small phones */}
      <View style={styles.actionRowContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.actionRowScroll}
        >
          <TouchableOpacity 
            style={styles.stageBtnPrimary} 
            activeOpacity={0.85} 
            onPress={() => router.push({ 
              pathname: '/stage-mode', 
              params: { setlistId: currentSetlist?.id } 
            })}
          >
            <Play size={16} color="#FFF" fill="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.stageBtnText}>Start Stage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
            activeOpacity={0.8} 
            onPress={() => setShowPicker(true)}
          >
            <Plus size={16} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.text }]}>Add Song</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
            activeOpacity={0.8} 
            onPress={() => router.push({ pathname: '/ai-agent', params: { gigId: id } })}
          >
            <Sparkles size={16} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.text }]}>AI Agent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.bgCard, borderColor: '#10B981' }]} 
            activeOpacity={0.8} 
            onPress={() => setShowOfflineModal(true)}
          >
            <WifiOff size={16} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.text }]}>Offline Prep</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
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
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...swipeResponder.panHandlers}
      >
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
              <Swipeable
                key={item.id}
                friction={2}
                leftThreshold={40}
                overshootLeft={false}
                renderLeftActions={() => (
                  <TouchableOpacity
                    style={styles.swipeDelete}
                    activeOpacity={0.8}
                    onPress={() => confirmRemoveSong(item)}
                    disabled={removeSong.isPending}
                    accessibilityLabel={`Remove ${item.song?.title || 'song'}`}
                  >
                    <Trash2 size={18} color="#FFFFFF" />
                    <Text style={styles.swipeDeleteText}>Remove</Text>
                  </TouchableOpacity>
                )}
              >
              <View style={[styles.songRowContainer, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
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
                    {isValidKey(item.song.original_key) && (
                      <View style={[styles.keyBadge, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: '#10B981' }]}>
                        <Text style={styles.keyText}>{item.song.original_key.trim()}</Text>
                      </View>
                    )}
                    <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                      {Math.floor((item.song.duration_sec || 0) / 60)}:{(item.song.duration_sec || 0) % 60 < 10 ? '0' : ''}{(item.song.duration_sec || 0) % 60}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => moveSong(index, index - 1)}
                    disabled={index === 0 || reorderSongs.isPending}
                    accessibilityLabel={`Move ${item.song?.title || 'song'} up`}
                  >
                    <ChevronUp size={18} color={index === 0 ? colors.border : colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => moveSong(index, index + 1)}
                    disabled={index === (songs?.length ?? 0) - 1 || reorderSongs.isPending}
                    accessibilityLabel={`Move ${item.song?.title || 'song'} down`}
                  >
                    <ChevronDown size={18} color={index === (songs?.length ?? 0) - 1 ? colors.border : colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleToggleLearn(item.song.id, item.notes)}
                  >
                    <BookOpen size={18} color={needsLearn ? "#F59E0B" : colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              </Swipeable>
            );
          })
        )}
      </ScrollView>

      {/* ── Gig / Setlist Options Modal ── */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowMenuModal(false)}
        >
          <View style={[styles.menuSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{gig?.name || 'Setlist Options'}</Text>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenuModal(false);
                setShowPicker(true);
              }}
            >
              <Plus size={18} color="#10B981" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Add Songs to {currentSetlist?.name || 'Set'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenuModal(false);
                handleAddSet();
              }}
            >
              <ListMusic size={18} color="#10B981" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Add New Set</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenuModal(false);
                setShowOfflineModal(true);
              }}
            >
              <WifiOff size={18} color="#10B981" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Download Offline Package</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenuModal(false);
                router.push({ pathname: '/ai-agent', params: { gigId: id } });
              }}
            >
              <Sparkles size={18} color="#10B981" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Ask AI Setlist Agent</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Gig Details', `Venue: ${gig?.venue || 'None'}\nDate: ${dateStr}\nTotal Sets: ${setlists?.length || 0}\nTotal Songs: ${songs?.length || 0}`);
              }}
            >
              <Copy size={18} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>View Gig Summary</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  actionRowContainer: {
    paddingVertical: 12,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  actionRowScroll: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  stageBtnPrimary: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  stageBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  actionChip: {
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  btnText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  menuSheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 14.5,
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
  swipeDelete: {
    width: 92,
    marginRight: 8,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
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
});
