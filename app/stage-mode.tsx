import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Dimensions, 
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  RotateCcw, 
  ListMusic, 
  ExternalLink, 
  Edit2, 
  Globe, 
  Search,
  Music2
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSetlistSongs } from '../utils/hooks/useMusician';
import { useSongLyrics, useUpdateSongArtist } from '../utils/hooks/useSongs';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const SEARCH_PROVIDERS = [
  { name: 'Genius', url: 'https://genius.com/search?q=', color: '#D97706' },
  { name: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=', color: '#059669' },
  { name: 'AZLyrics', url: 'https://www.azlyrics.com/search.php?q=', color: '#0284C7' }
];

export default function StageModeScreen() {
  const router = useRouter();
  const { setlistId, initialSongId } = useLocalSearchParams();
  
  // 1. Full setlist
  const { data: setlistSongs, isLoading: isLoadingSetlist } = useSetlistSongs(setlistId as string);
  
  // 2. Navigation index & play state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // 2.1 Artist Correction
  const [isEditingArtist, setIsEditingArtist] = useState(false);
  const [newArtist, setNewArtist] = useState('');
  const updateArtistMutation = useUpdateSongArtist();
  
  // 2.2 Minus 1 Player
  const [isMinusOneVisible, setIsMinusOneVisible] = useState(false);

  // Initialize index when setlist loads
  React.useEffect(() => {
    if (setlistSongs && initialSongId) {
      const idx = setlistSongs.findIndex((s: any) => s.song?.id === initialSongId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [setlistSongs, initialSongId]);

  // Fallback demo songs if setlist is empty or demo
  const songsList = (setlistSongs && setlistSongs.length > 0) ? setlistSongs : [
    {
      id: 'demo-1',
      position: 1,
      song: {
        id: 'demo-s1',
        title: 'Wonderwall',
        artist: 'Oasis',
        original_key: 'G',
        bpm: 112,
        duration: '4:18',
      }
    },
    {
      id: 'demo-2',
      position: 2,
      song: {
        id: 'demo-s2',
        title: "Sweet Child O' Mine",
        artist: "Guns N' Roses",
        original_key: 'D#',
        bpm: 128,
        duration: '5:56',
      }
    },
    {
      id: 'demo-3',
      position: 3,
      song: {
        id: 'demo-s3',
        title: 'Gravity',
        artist: 'John Mayer',
        original_key: 'G',
        bpm: 72,
        duration: '4:05',
      }
    }
  ];

  const currentSetlistSong = songsList[currentIndex] || songsList[0];
  const nextSetlistSong = songsList[currentIndex + 1];

  // 3. Lyrics Hook
  const { data: lyricsData, isLoading: isLoadingLyrics } = useSongLyrics(
    currentSetlistSong?.song?.id,
    currentSetlistSong?.song?.artist,
    currentSetlistSong?.song?.title
  );

  const hasLyrics = !!lyricsData?.plain_lyrics;

  // 4. Web Search
  const handleWebSearch = async (baseUrl: string) => {
    if (!currentSetlistSong) return;
    const artist = currentSetlistSong.song?.artist;
    const cleanArtist = (artist && artist.toLowerCase() !== 'unknown artist') ? artist : '';
    const query = `${currentSetlistSong.song?.title} ${cleanArtist}`.trim();
    const fullUrl = `${baseUrl}${encodeURIComponent(query)}`;
    await WebBrowser.openBrowserAsync(fullUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: '#FFFFFF',
      enableBarCollapsing: true,
      showTitle: true,
    });
  };

  const handleUpdateArtist = async () => {
    if (!currentSetlistSong || !newArtist.trim()) return;
    try {
      await updateArtistMutation.mutateAsync({
        songId: currentSetlistSong.song?.id,
        artist: newArtist.trim(),
        title: currentSetlistSong.song?.title,
        setlistId: setlistId as string,
        position: currentSetlistSong.position
      });
      setIsEditingArtist(false);
    } catch (e) {
      console.error('Failed to update artist:', e);
    }
  };

  const openEditArtist = () => {
    setNewArtist(currentSetlistSong?.song?.artist || '');
    setIsEditingArtist(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, orientation: 'portrait' }} />

      {/* ── Top Status Bar ── */}
      <View style={styles.topStatusBar}>
        <View style={styles.syncStatusGroup}>
          <View style={styles.pulseDot} />
          <Text style={styles.syncStatusText}>OFFLINE MODE • BAND SYNC ACTIVE</Text>
        </View>

        <TouchableOpacity 
          style={styles.exitBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.exitBtnText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      {/* ── Song Info Section ── */}
      <View style={styles.songInfoSection}>
        <View style={styles.songInfoMain}>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSetlistSong?.song?.title || 'Wonderwall'}
            </Text>
            <Text style={styles.songArtist}>
              {currentSetlistSong?.song?.artist || 'Oasis'}
            </Text>
          </View>
          <View style={styles.songInfoRight}>
            <View style={styles.keyBadge}>
              <Text style={styles.keyBadgeText}>
                KEY: {currentSetlistSong?.song?.original_key || 'G'}
              </Text>
            </View>
            <Text style={styles.nextSongLabel} numberOfLines={1}>
              NEXT: {nextSetlistSong?.song?.title || "Sweet Child O' Mine"}
            </Text>
          </View>
        </View>

        {/* Progress scrub bar */}
        <View style={styles.progressSection}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>01:42</Text>
            <Text style={styles.timeText}>-02:36</Text>
          </View>
          <View style={styles.progressBase}>
            <View style={[styles.progressFill, { width: '42%' }]} />
          </View>
        </View>
      </View>

      {/* ── Embedded Minus 1 Player (Collapsible) ── */}
      {isMinusOneVisible && currentSetlistSong && (
        <View style={styles.playerContainer}>
          <WebView
            style={styles.webview}
            source={{ 
              uri: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                `${currentSetlistSong.song?.artist} ${currentSetlistSong.song?.title} minus 1`
              )}` 
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
          />
        </View>
      )}

      {/* ── Lyrics Performance Area (Centered High-Contrast) ── */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingLyrics ? (
          <View style={styles.lyricsLoading}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading stage lyrics...</Text>
          </View>
        ) : hasLyrics ? (
          /* Real lyrics formatted cleanly */
          <View style={styles.realLyricsContainer}>
            {lyricsData.plain_lyrics.split('\n\n').map((paragraph: string, pIdx: number) => (
              <View key={pIdx} style={styles.verseBlock}>
                <Text style={styles.verseLabel}>
                  {pIdx === 0 ? 'VERSE 1' : pIdx === 1 ? 'PRE-CHORUS' : pIdx === 2 ? 'CHORUS' : `SECTION ${pIdx + 1}`}
                </Text>
                {paragraph.split('\n').map((line: string, lIdx: number) => {
                  const isHighlighted = pIdx === 1 && lIdx === 1;
                  return (
                    <Text 
                      key={lIdx} 
                      style={[
                        styles.lyricLine, 
                        isHighlighted && styles.lyricLineHighlighted
                      ]}
                    >
                      {line}
                    </Text>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          /* High-Contrast Stage View Demo & Search fallback */
          <View style={styles.lyricsStageView}>
            {/* Previous Verse (Faded) */}
            <View style={styles.fadedVerse}>
              <Text style={styles.verseLabelSmall}>VERSE 1</Text>
              <Text style={styles.fadedLine}>Today is gonna be the day</Text>
              <Text style={styles.fadedLine}>That they're gonna throw it back to you</Text>
            </View>

            {/* Current Section (High Contrast) */}
            <View style={styles.activeVerse}>
              <Text style={styles.verseLabelSmall}>PRE-CHORUS</Text>
              <Text style={styles.activeLineBold}>
                And all the roads we have to walk are winding
              </Text>
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightText}>
                  And all the lights that lead us there are blinding
                </Text>
              </View>
            </View>

            {/* Upcoming Section (Subtle) */}
            <View style={styles.upcomingVerse}>
              <Text style={styles.verseLabelSmall}>CHORUS</Text>
              <Text style={styles.upcomingLine}>Because maybe...</Text>
              <Text style={styles.upcomingLine}>You're gonna be the one that saves me</Text>
            </View>

            {/* Web Search buttons for chords */}
            <View style={styles.searchFallback}>
              <Text style={styles.fallbackHeader}>NEED LIVE CHORDS & TABS?</Text>
              <View style={styles.searchButtonsRow}>
                {SEARCH_PROVIDERS.map((p) => (
                  <TouchableOpacity
                    key={p.name}
                    style={styles.searchPill}
                    onPress={() => handleWebSearch(p.url)}
                  >
                    <ExternalLink size={12} color="#166534" />
                    <Text style={styles.searchPillText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Footer Controls ── */}
      <View style={styles.footerControls}>
        <View style={styles.transportRow}>
          {/* Previous Song */}
          <TouchableOpacity 
            style={[styles.transportBtnSide, currentIndex === 0 && { opacity: 0.4 }]}
            activeOpacity={0.8}
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          >
            <SkipBack size={22} color="#166534" fill="#166534" />
          </TouchableOpacity>

          {/* Large Primary Pause / Play Button */}
          <TouchableOpacity 
            style={styles.transportBtnMain}
            activeOpacity={0.88}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause size={36} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={36} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          {/* Next Song */}
          <TouchableOpacity 
            style={[styles.transportBtnSide, currentIndex >= songsList.length - 1 && { opacity: 0.4 }]}
            activeOpacity={0.8}
            disabled={currentIndex >= songsList.length - 1}
            onPress={() => setCurrentIndex((prev) => Math.min(songsList.length - 1, prev + 1))}
          >
            <SkipForward size={22} color="#166534" fill="#166534" />
          </TouchableOpacity>
        </View>

        {/* Sub-actions Row */}
        <View style={styles.subActionsRow}>
          <TouchableOpacity 
            style={styles.subActionBtn} 
            activeOpacity={0.7}
            onPress={() => {
              setIsPlaying(true);
            }}
          >
            <RotateCcw size={14} color="#10B981" />
            <Text style={styles.subActionText}>RESTART</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.subActionBtn} 
            activeOpacity={0.7}
            onPress={() => setIsMinusOneVisible(!isMinusOneVisible)}
          >
            <Music2 size={14} color="#10B981" />
            <Text style={styles.subActionText}>
              {isMinusOneVisible ? 'HIDE TRACK' : 'MINUS 1'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.subActionBtn} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/index')}
          >
            <ListMusic size={14} color="#10B981" />
            <Text style={styles.subActionText}>SETLIST</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  syncStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  syncStatusText: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1,
  },
  exitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  songInfoSection: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  songInfoMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  songTitle: {
    fontFamily: 'DM Sans',
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
    lineHeight: 26,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  songInfoRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  keyBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  keyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  nextSongLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  progressSection: {
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  progressBase: {
    width: '100%',
    height: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  playerContainer: {
    height: 140,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  lyricsLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  realLyricsContainer: {
    width: '100%',
    gap: 28,
  },
  verseBlock: {
    alignItems: 'center',
    gap: 8,
  },
  verseLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  lyricLine: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 30,
  },
  lyricLineHighlighted: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: '#064E3B',
    fontWeight: '800',
  },
  lyricsStageView: {
    width: '100%',
    alignItems: 'center',
    gap: 28,
  },
  fadedVerse: {
    opacity: 0.25,
    alignItems: 'center',
    gap: 6,
  },
  verseLabelSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  fadedLine: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },
  activeVerse: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  activeLineBold: {
    fontFamily: 'DM Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 32,
  },
  highlightBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  highlightText: {
    fontFamily: 'DM Sans',
    fontSize: 20,
    fontWeight: '800',
    color: '#064E3B',
    textAlign: 'center',
    lineHeight: 28,
  },
  upcomingVerse: {
    opacity: 0.45,
    alignItems: 'center',
    gap: 6,
  },
  upcomingLine: {
    fontSize: 20,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },
  searchFallback: {
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  fallbackHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
  },
  searchButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  searchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  footerControls: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#D1FAE5',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    marginBottom: 16,
  },
  transportBtnSide: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportBtnMain: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  subActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  subActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
});
