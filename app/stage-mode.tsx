import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Music, Search, Globe, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSetlistSongs } from '../utils/hooks/useMusician';
import { useSongLyrics } from '../utils/hooks/useSongs';
import { GlassCard } from '../components/ui/GlassCard';

const { width } = Dimensions.get('window');

const SEARCH_PROVIDERS = [
  { name: 'Genius', url: 'https://genius.com/search?q=', color: '#FFFF64' },
  { name: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=', color: '#FFC600' },
  { name: 'AZLyrics', url: 'https://www.azlyrics.com/search.php?q=', color: '#00D4FF' }
];

export default function StageModeScreen() {
  const router = useRouter();
  const { setlistId, initialSongId } = useLocalSearchParams();
  
  // 1. Fetch the full setlist to allow navigation
  const { data: setlistSongs, isLoading: isLoadingSetlist } = useSetlistSongs(setlistId as string);
  
  // 2. State for current song index within the setlist
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize index when setlist loads
  React.useEffect(() => {
    if (setlistSongs && initialSongId) {
      const idx = setlistSongs.findIndex((s: any) => s.song.id === initialSongId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [setlistSongs, initialSongId]);

  const currentSetlistSong = setlistSongs?.[currentIndex];
  const nextSetlistSong = setlistSongs?.[currentIndex + 1];

  // 3. Fetch Lyrics for the current song
  const { data: lyricsData, isLoading: isLoadingLyrics } = useSongLyrics(
    currentSetlistSong?.song?.id,
    currentSetlistSong?.song?.artist,
    currentSetlistSong?.song?.title
  );

  // 4. Handle Web Search
  const handleWebSearch = async (baseUrl: string) => {
    if (!currentSetlistSong) return;
    const artist = currentSetlistSong.song.artist;
    const cleanArtist = (artist && artist.toLowerCase() !== 'unknown artist') ? artist : '';
    const query = `${currentSetlistSong.song.title} ${cleanArtist}`.trim();
    const fullUrl = `${baseUrl}${encodeURIComponent(query)}`;
    await WebBrowser.openBrowserAsync(fullUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: '#000000',
      enableBarCollapsing: true,
      showTitle: true,
    });
  };

  // 5. Parse plain lyrics into the UI format
  const hasLyrics = !!lyricsData?.plain_lyrics;
  const songData = useMemo(() => {
    if (!currentSetlistSong) return null;
    
    const base = {
      title: currentSetlistSong.song.title,
      artist: currentSetlistSong.song.artist,
      meta: `Key: ${currentSetlistSong.song.original_key || '?'} · BPM: ${currentSetlistSong.song.bpm || '?'}`,
      sections: [] as any[]
    };

    if (hasLyrics) {
      const parts = lyricsData.plain_lyrics.split('\n\n');
      base.sections = parts.map((part: string, pIdx: number) => ({
        label: pIdx === 0 ? 'VERSE 1' : part.length < 20 ? part.toUpperCase() : `SECTION ${pIdx + 1}`,
        lines: part.split('\n').map((line: string) => ({
          text: line,
          chords: [] // Plain lyrics don't have chords, but we keep the structure
        }))
      }));
    } else {
      base.sections = []; // Show fallback if empty
    }

    return base;
  }, [currentSetlistSong, lyricsData, hasLyrics]);

  if (isLoadingSetlist) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  if (!currentSetlistSong) {
    return (
      <View style={[styles.container, styles.center]}>
        <Music size={48} color="rgba(255,255,255,0.1)" />
        <Text style={styles.emptyText}>Select a song to enter Stage Mode</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, orientation: 'portrait' }} />

      {/* ── Top Navigation ── */}
      <View style={styles.topNav}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>SONG {currentIndex + 1} OF {setlistSongs?.length || 0}</Text>
          <View style={styles.dotsRow}>
            {setlistSongs?.map((_: any, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  i === currentIndex && styles.dotActive,
                  i < currentIndex && { backgroundColor: 'rgba(0, 212, 255, 0.4)' }
                ]} 
              />
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.exitBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.exitBtnText}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.nextSongInfo}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextSongTitle} numberOfLines={1}>
            {nextSetlistSong ? `${nextSetlistSong.song.title} →` : 'End of Set'}
          </Text>
        </View>
      </View>

      {/* ── Main Performance View ── */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.songHeader}>
          <Text style={styles.songTitle}>{songData?.title}</Text>
          <Text style={styles.songMeta}>{songData?.artist} · {songData?.meta}</Text>
        </View>

        {isLoadingLyrics ? (
           <ActivityIndicator size="large" color="#00D4FF" style={{ marginTop: 100 }} />
        ) : !hasLyrics ? (
           <View style={styles.fallbackContainer}>
              <GlassCard intensity={8} style={styles.fallbackCard}>
                <View style={styles.fallbackHeader}>
                  <Globe size={24} color="#00D4FF" />
                  <Text style={styles.fallbackTitle}>No lyrics found in database</Text>
                  <Text style={styles.fallbackSubtitle}>Search on the web to view lyrics and chords without leaving the app.</Text>
                </View>

                <View style={styles.searchOptions}>
                  {SEARCH_PROVIDERS.map((provider) => (
                    <TouchableOpacity 
                      key={provider.name} 
                      style={styles.searchBtn} 
                      onPress={() => handleWebSearch(provider.url)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.searchBtnIcon, { backgroundColor: provider.color + '15' }]}>
                        <ExternalLink size={14} color={provider.color} />
                      </View>
                      <Text style={styles.searchBtnText}>Search on {provider.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.manualInfo}>
                  <Search size={14} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.manualText}>Try adding them manually in settings!</Text>
                </View>
              </GlassCard>
           </View>
        ) : (
          songData?.sections.map((section: any, sIdx: number) => (
            <View key={sIdx} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.lines.map((line: any, lIdx: number) => (
                <View key={lIdx} style={styles.performanceRow}>
                  {line.chords.length > 0 && (
                    <View style={styles.chordLine}>
                      {line.chords.map((c: any, cIdx: number) => (
                        <Text key={cIdx} style={[styles.chord, { marginLeft: cIdx === 0 ? 0 : 30 }]}>
                          {c[0]}
                        </Text>
                      ))}
                    </View>
                  )}
                  {line.text ? <Text style={styles.lyric}>{line.text}</Text> : null}
                </View>
              ))}
            </View>
          ))
        )}
        
        <View style={{ height: 150 }} />
      </ScrollView>

      {/* ── Bottom Controls ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]}
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
        >
          <View style={styles.navBtnContent}>
            <ArrowLeft size={16} color="#FFF" />
            <Text style={styles.navBtnText}>Prev</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.transposeControl}>
          <Text style={styles.transposeValue}>{currentSetlistSong.song.original_key || 'Am'}</Text>
          <View style={styles.transposeIcons}>
            <ChevronUp size={14} color="#00D4FF" />
            <ChevronDown size={14} color="#00D4FF" />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.navBtn, currentIndex === (setlistSongs?.length || 0) - 1 && { opacity: 0.3 }]}
          disabled={currentIndex === (setlistSongs?.length || 0) - 1}
          onPress={() => setCurrentIndex(prev => Math.min((setlistSongs?.length || 0) - 1, prev + 1))}
        >
          <View style={styles.navBtnContent}>
            <Text style={styles.navBtnText}>Next</Text>
            <ArrowRight size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNav: {
    height: 100,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressSection: {
    flex: 1,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'DM Sans Bold',
    marginBottom: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotActive: {
    backgroundColor: '#00D4FF',
    width: 16,
  },
  exitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  exitBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  nextSongInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nextLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'DM Sans Bold',
    textAlign: 'right',
  },
  nextSongTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'DM Sans',
    textAlign: 'right',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  songHeader: {
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 42,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 8,
  },
  songMeta: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans Medium',
  },
  section: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
    letterSpacing: 1.5,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  performanceRow: {
    marginBottom: 25,
  },
  chordLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chord: {
    fontSize: 22,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
  lyric: {
    fontSize: 26,
    color: '#FFF',
    fontFamily: 'DM Sans Medium',
    lineHeight: 34,
  },
  fallbackContainer: {
    marginTop: 20,
  },
  fallbackCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 20,
  },
  fallbackHeader: {
    alignItems: 'center',
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'DM Sans',
    paddingHorizontal: 10,
  },
  searchOptions: {
    width: '100%',
    gap: 10,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchBtnIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'DM Sans',
  },
  manualInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    opacity: 0.5,
  },
  manualText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    height: '100%',
    width: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  transposeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transposeValue: {
    fontSize: 20,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
  transposeIcons: {
    gap: -4,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    fontFamily: 'DM Sans',
  }
});
