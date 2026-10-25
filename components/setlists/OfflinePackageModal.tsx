import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Play,
  HardDrive,
  FileCode2,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import {
  prepareOfflineGigPackage,
  getOfflineGigPackage,
  deleteOfflineGigPackage,
  OfflineGigPackage,
  OfflineSongItem,
  OfflineDownloadProgress,
  SongDownloadState,
} from '../../utils/offlineManager';
import { useRouter } from 'expo-router';

interface OfflinePackageModalProps {
  visible: boolean;
  onClose: () => void;
  gigId: string;
  setlistId: string;
  gigInfo: { name: string; venue?: string; gig_date?: string; band?: { name: string } };
  songs: any[];
}

export function OfflinePackageModal({
  visible,
  onClose,
  gigId,
  setlistId,
  gigInfo,
  songs,
}: OfflinePackageModalProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<OfflineDownloadProgress | null>(null);
  const [pkg, setPkg] = useState<OfflineGigPackage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load existing offline package on open
  useEffect(() => {
    if (visible && setlistId) {
      loadExistingPackage();
    }
  }, [visible, setlistId]);

  const loadExistingPackage = async () => {
    const existing = await getOfflineGigPackage(setlistId);
    setPkg(existing);
  };

  const handleDownload = async () => {
    if (!songs || songs.length === 0) {
      const msg = 'Please add songs to your setlist before preparing for offline gig.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Empty Setlist', msg);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setProgress(null);

    try {
      // Saved songs are kept even when cancelled, so pressing Resume continues where this stopped
      const result = await prepareOfflineGigPackage(gigId, setlistId, gigInfo, songs, {
        concurrency: 4,
        signal: controller.signal,
        onProgress: setProgress,
      });
      setPkg(result);
    } catch (e: any) {
      console.error('Error preparing offline package:', e);
      const msg = 'Failed to download some offline lyrics. Please check your connection.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Download Incomplete', msg);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const handleDeletePackage = async () => {
    await deleteOfflineGigPackage(setlistId);
    setPkg(null);
  };

  const totalSongs = songs?.length || 0;
  const readySongs = pkg ? pkg.songs.filter((s) => s.status === 'ready').length : 0;
  const readinessPct = totalSongs > 0 ? Math.round((readySongs / totalSongs) * 100) : 0;
  const isFullyReady = totalSongs > 0 && readySongs === totalSongs;
  const savedById = useMemo(() => new Map((pkg?.songs ?? []).map((s) => [s.song_id, s])), [pkg]);
  const overallPct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const downloadLabel = isFullyReady
    ? 'Update Offline Pack'
    : pkg && readySongs > 0
    ? `Resume (${totalSongs - readySongs} left)`
    : 'Download All for Offline';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: isFullyReady ? '#10B98115' : '#F59E0B15' }]}>
                <WifiOff size={22} color={isFullyReady ? '#10B981' : '#F59E0B'} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Prepare for Offline Gig</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {gigInfo.name || 'Gig Repertoire'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Readiness Status Card */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: isFullyReady
                  ? isDark
                    ? '#064E3B'
                    : '#ECFDF5'
                  : isDark
                  ? '#3A2800'
                  : '#FFFBEB',
                borderColor: isFullyReady ? '#10B981' : '#F59E0B',
              },
            ]}
          >
            <View style={styles.statusBannerRow}>
              <View style={styles.statusBannerTextWrap}>
                <Text
                  style={[
                    styles.statusBannerTitle,
                    { color: isFullyReady ? '#10B981' : '#D97706' },
                  ]}
                >
                  {isFullyReady
                    ? '100% READY FOR OFFLINE GIG'
                    : pkg
                    ? `${readinessPct}% OFFLINE READY`
                    : 'NOT DOWNLOADED YET'}
                </Text>
                <Text style={[styles.statusBannerSub, { color: colors.textSecondary }]}>
                  {isFullyReady
                    ? 'All chord sheets, keys, and lyrics stored locally. No internet needed onstage!'
                    : 'Download your chord charts before heading to the venue with no signal.'}
                </Text>
              </View>
              <View
                style={[
                  styles.pctBadge,
                  { backgroundColor: isFullyReady ? '#10B981' : '#F59E0B' },
                ]}
              >
                <Text style={styles.pctBadgeText}>{readinessPct}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${readinessPct}%`,
                    backgroundColor: isFullyReady ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
          </View>

          {/* Download in progress banner */}
          {isLoading && (
            <View style={[styles.downloadingRow, { backgroundColor: colors.bgSecondary, flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={styles.progressHeaderRow}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={[styles.downloadingText, { color: colors.text }]}>
                  {progress?.done ?? 0} of {progress?.total ?? totalSongs} done
                  {progress && progress.cached > 0 ? ` · ${progress.cached} from device` : ''}
                </Text>
                <Text style={[styles.overallPctText, { color: colors.text }]}>{overallPct}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.bgCard }]}>
                <View style={[styles.progressFill, { width: `${overallPct}%`, backgroundColor: '#10B981' }]} />
              </View>
            </View>
          )}

          {/* Songs Checklist */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            SETLIST REPERTOIRE ({readySongs}/{totalSongs} READY)
          </Text>

          <ScrollView style={styles.songsList} showsVerticalScrollIndicator={false}>
            {songs?.map((item: any, idx: number) => {
              const s = item.song || {};
              const title = s.title || item.title || 'Untitled';
              const artist = s.artist || item.artist || 'Unknown';
              const key = item.transposed_key || s.original_key || 'C';

              const songId = s.id || item.id;
              const saved = savedById.get(songId);
              const liveState = isLoading ? progress?.songs[songId] : undefined;
              const rowState: SongDownloadState = liveState ?? stateFromSaved(saved);

              return (
                <View
                  key={item.id || idx}
                  style={[styles.songCheckItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                >
                  <View style={styles.songIndexCol}>
                    <Text style={[styles.songIndexText, { color: colors.textDim }]}>
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.songInfoCol}>
                    <Text style={[styles.songTitleText, { color: colors.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={[styles.songMetaText, { color: colors.textDim }]}>
                      {artist} • Key of {key}
                    </Text>
                  </View>

                  <View style={styles.statusCol}>
                    <SongStatusTag state={rowState} />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {pkg && (
              <TouchableOpacity
                style={[styles.iconActionBtn, { borderColor: colors.border }]}
                onPress={handleDeletePackage}
                disabled={isLoading}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            )}

            {isLoading ? (
              <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#B91C1C' }]} onPress={handleCancel}>
                <X size={18} color="#FFFFFF" />
                <Text style={styles.downloadBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: isFullyReady ? '#059669' : '#10B981' }]}
                onPress={handleDownload}
              >
                <Download size={18} color="#FFFFFF" />
                <Text style={styles.downloadBtnText}>{downloadLabel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.stageBtn}
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/stage-mode',
                  params: { setlistId },
                });
              }}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.stageBtnText}>Stage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Saved package status to the state shown on a row when no download is running. */
function stateFromSaved(saved?: OfflineSongItem): SongDownloadState {
  if (!saved) return 'queued';
  if (saved.status === 'ready') return 'ready';
  if (saved.status === 'missing_lyrics') return 'missing_lyrics';
  if (saved.status === 'failed') return 'failed';
  return 'queued';
}

const STATUS_TAGS: Record<SongDownloadState, { label: string; color: string; bg: string }> = {
  queued: { label: 'QUEUED', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
  cached: { label: 'ON DEVICE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  downloading: { label: 'DOWNLOADING', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' },
  ready: { label: 'SAVED', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  missing_lyrics: { label: 'MISSING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  failed: { label: 'FAILED', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

function SongStatusTag({ state }: { state: SongDownloadState }) {
  const tag = STATUS_TAGS[state];
  const Icon = state === 'missing_lyrics' || state === 'failed' ? AlertCircle : CheckCircle2;
  return (
    <View style={[styles.statusTag, { backgroundColor: tag.bg }]}>
      {state === 'downloading' ? (
        <ActivityIndicator size={10} color={tag.color} />
      ) : state === 'queued' ? null : (
        <Icon size={13} color={tag.color} />
      )}
      <Text style={[styles.statusTagText, { color: tag.color }]}>{tag.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  statusBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  statusBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBannerTextWrap: {
    flex: 1,
    paddingRight: 10,
    gap: 3,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  statusBannerSub: {
    fontSize: 11.5,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
  pctBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pctBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'DM Sans',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  downloadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  downloadingText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  songsList: {
    maxHeight: 260,
  },
  songCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  songIndexCol: {
    width: 24,
  },
  songIndexText: {
    fontSize: 12,
    fontFamily: 'JetBrains Mono',
    fontWeight: '700',
  },
  songInfoCol: {
    flex: 1,
    gap: 2,
  },
  songTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songMetaText: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overallPctText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'DM Sans',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  stageBtn: {
    backgroundColor: '#064E3B',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
});
