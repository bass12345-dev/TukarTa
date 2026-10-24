import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  RotateCcw,
  HardDrive,
  CloudDownload,
  Play,
  Wand2,
  Plus,
  MoreVertical,
  ChevronRight,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import { useMyGigs, useGigSetlist, useSetlistSongs } from '@/utils/hooks/useMusician';
import { useAppTheme } from '@/context/theme';

const SAMPLE_SETLIST = [
  {
    id: 's1',
    num: '01',
    title: 'Halik',
    artist: 'Kamikazee',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: true,
    isActive: true,
  },
  {
    id: 's2',
    num: '02',
    title: 'Awit ng kabataan',
    artist: 'Rivermaya',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: false,
    isActive: false,
  },
  {
    id: 's3',
    num: '03',
    title: 'Narda',
    artist: 'Kamikazee',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: true,
    isActive: false,
  },
  {
    id: 's4',
    num: '04',
    title: 'Teenager',
    artist: 'My Chemical Romance',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: true,
    isActive: false,
  },
  {
    id: 's5',
    num: '05',
    title: 'Raining in manila',
    artist: 'Lola Amour',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: true,
    isActive: false,
  },
  {
    id: 's6',
    num: '06',
    title: 'Vst Medley',
    artist: 'VST & Co.',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: true,
    isActive: false,
  },
  {
    id: 's7',
    num: '07',
    title: 'Rock baby rock',
    artist: 'VST & Co.',
    key: 'G',
    bpm: '120 BPM',
    duration: '4:15',
    lyricsReady: true,
    audioReady: false,
    isActive: false,
  },
];

export default function SetlistsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'setlist' | 'gigs'>('setlist');
  const [showPrepDetails, setShowPrepDetails] = useState(false);

  const { data: gigs, isLoading: isGigsLoading } = useMyGigs();
  const currentGig = gigs?.[0];
  const { data: setlist } = useGigSetlist(currentGig?.id);
  const { data: songsData } = useSetlistSongs(setlist?.id);

  const songs = songsData && songsData.length > 0
    ? songsData.map((item: any, idx: number) => ({
        id: item.id || String(idx),
        num: String(idx + 1).padStart(2, '0'),
        title: item.song?.title || item.title || 'Untitled Song',
        artist: item.song?.artist || item.artist || 'Unknown Artist',
        key: item.song?.original_key || item.custom_key || 'G',
        bpm: item.song?.bpm ? `${item.song.bpm} BPM` : '120 BPM',
        duration: '4:15',
        lyricsReady: true,
        audioReady: idx % 3 !== 1,
        isActive: idx === 0,
      }))
    : SAMPLE_SETLIST;

  const gigTitle = currentGig?.name || 'Sample Band Live at Hard Rock Cafe';
  const gigDate = currentGig?.gig_date
    ? new Date(currentGig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Sep 17, 2024 • 9:00 PM';

  const downloadedCount = 8;
  const totalSongsCount = songs.length;
  const downloadPercent = Math.round((downloadedCount / totalSongsCount) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.screenEyebrow, { color: colors.primary }]}>STAGE REPERTOIRE</Text>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Setlists</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => router.push('/songs/add')}
            >
              <Plus size={18} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabSwitch, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'setlist' && [styles.tabBtnActive, { backgroundColor: colors.bgCard }]
            ]}
            onPress={() => setActiveTab('setlist')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'setlist' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
              activeTab === 'setlist' && styles.tabTextActive
            ]}>
              ACTIVE SETLIST
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'gigs' && [styles.tabBtnActive, { backgroundColor: colors.bgCard }]
            ]}
            onPress={() => setActiveTab('gigs')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'gigs' ? (isDark ? colors.accent : colors.primaryDark) : colors.textDim },
              activeTab === 'gigs' && styles.tabTextActive
            ]}>
              MY GIGS ({gigs?.length || 1})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'setlist' ? (
          <>
            {/* ── Gig Showcase Banner ── */}
            <View style={[styles.gigBanner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.gigBannerTop}>
                <View style={styles.gigTagRow}>
                  <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.liveTagText, { color: colors.primaryDark }]}>UPCOMING PERFORMANCE</Text>
                </View>
                <Text style={[styles.gigDateText, { color: colors.textDim }]}>{gigDate}</Text>
              </View>

              <Text style={[styles.gigTitle, { color: colors.text }]}>{gigTitle}</Text>
            </View>

            {/* ── AI Actions Row ── */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[styles.regenerateBtn, { backgroundColor: isDark ? '#064E3B' : '#166534' }]} 
                activeOpacity={0.85}
                onPress={() => router.push('/ai-agent')}
              >
                <Wand2 size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.regenerateBtnText}>Regenerate with AI</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.addSongBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
                activeOpacity={0.7}
                onPress={() => router.push('/profile/songs')}
              >
                <Plus size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* ── Offline Preparation Card ── */}
            <TouchableOpacity 
              style={[styles.offlineCta, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
              activeOpacity={0.85}
              onPress={() => setShowPrepDetails(!showPrepDetails)}
            >
              <View style={styles.offlineCtaLeft}>
                <View style={[styles.cloudIconBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <CloudDownload size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.offlineCtaTitle, { color: colors.text }]}>Prepare for Offline</Text>
                  <Text style={[styles.offlineCtaSubtitle, { color: colors.textDim }]}>
                    {downloadedCount} of {totalSongsCount} songs cached locally
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textDim} style={showPrepDetails ? { transform: [{ rotate: '90deg' }] } : {}} />
            </TouchableOpacity>

            {/* Expanded Prep Details */}
            {showPrepDetails && (
              <View style={[styles.prepDetailsBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: colors.text }]}>Offline Sync Progress</Text>
                  <Text style={[styles.progressPct, { color: colors.primary }]}>{downloadPercent}%</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${downloadPercent}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.progressHint, { color: colors.textDim }]}>
                  Lyrics and chords are stored locally in SQLite for zero-latency stage performance.
                </Text>
              </View>
            )}

            {/* ── Setlist Song List ── */}
            <View style={styles.setlistHeader}>
              <Text style={[styles.setlistSectionTitle, { color: colors.text }]}>
                Setlist ({songs.length} songs)
              </Text>
              <Text style={[styles.setlistEstimate, { color: colors.primary }]}>EST. 48 MINS</Text>
            </View>

            <View style={styles.songsList}>
              {songs.map((song) => (
                <TouchableOpacity
                  key={song.id}
                  style={[
                    styles.songCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    song.isActive && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/stage-mode?setlistId=${currentGig?.id || 'demo'}`)}
                >
                  <View style={styles.songCardLeft}>
                    <View style={styles.numContainer}>
                      <Text style={[styles.songNum, { color: song.isActive ? colors.primary : colors.textDim }]}>
                        {song.num}
                      </Text>
                    </View>
                    <View style={styles.songInfo}>
                      <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>{song.title}</Text>
                      <View style={styles.songMetaRow}>
                        <Text style={[styles.songMeta, { color: colors.textDim }]}>Key: {song.key}</Text>
                        <Text style={[styles.songMetaBullet, { color: colors.textDim }]}>•</Text>
                        <Text style={[styles.songMeta, { color: colors.textDim }]}>{song.bpm}</Text>
                        <Text style={[styles.songMetaBullet, { color: colors.textDim }]}>•</Text>
                        <Text style={[styles.songMeta, { color: colors.textDim }]}>{song.duration}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.songStatusRow}>
                    {song.lyricsReady && <CheckCircle2 size={14} color={colors.primary} />}
                    {song.audioReady ? (
                      <CheckCircle2 size={14} color={colors.primary} />
                    ) : (
                      <AlertCircle size={14} color="#F59E0B" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── START GIG Button ── */}
            <TouchableOpacity
              style={[styles.startGigBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.9}
              onPress={() => router.push(`/stage-mode?setlistId=${currentGig?.id || 'demo'}`)}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startGigText}>START GIG</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── My Gigs List Tab ── */
          <View style={styles.gigsList}>
            {(gigs && gigs.length > 0 ? gigs : [currentGig]).map((gig: any, idx: number) => {
              const name = gig?.name || 'Sample Band Live at Hard Rock Cafe';
              const venue = gig?.venue || 'Hard Rock Cafe, Makati';
              const date = gig?.gig_date 
                ? new Date(gig.gig_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Sep 17, 2024';

              return (
                <View 
                  key={gig?.id || idx} 
                  style={[styles.gigItemCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <View style={styles.gigItemHeader}>
                    <View style={[styles.calendarIconBox, { backgroundColor: colors.primaryLight }]}>
                      <Calendar size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.gigItemName, { color: colors.text }]}>{name}</Text>
                      <Text style={[styles.gigItemVenue, { color: colors.textDim }]}>📍 {venue}</Text>
                    </View>
                  </View>

                  <View style={[styles.gigItemDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.gigItemFooter}>
                    <Text style={[styles.gigItemDate, { color: colors.textDim }]}>{date}</Text>
                    <TouchableOpacity 
                      style={[styles.openSetlistBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setActiveTab('setlist')}
                    >
                      <Text style={styles.openSetlistBtnText}>View Songs</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },
  gigBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  gigBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gigTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: 'DM Sans',
  },
  gigDateText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  gigTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  regenerateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 48,
    gap: 8,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  addSongBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  offlineCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cloudIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineCtaTitle: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '700',
  },
  offlineCtaSubtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  prepDetailsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressHint: {
    fontSize: 11,
    fontFamily: 'DM Sans',
    lineHeight: 15,
  },
  setlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  setlistSectionTitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '800',
  },
  setlistEstimate: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'DM Sans',
  },
  songsList: {
    gap: 8,
    marginBottom: 20,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  songCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  numContainer: {
    width: 24,
    alignItems: 'center',
  },
  songNum: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  songInfo: {
    flex: 1,
    gap: 3,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  songMeta: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  songMetaBullet: {
    fontSize: 8,
  },
  songStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startGigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    height: 54,
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  startGigText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  gigsList: {
    gap: 12,
  },
  gigItemCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  gigItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gigItemName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  gigItemVenue: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  gigItemDivider: {
    height: 1,
    marginVertical: 14,
  },
  gigItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gigItemDate: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  openSetlistBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  openSetlistBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
});
