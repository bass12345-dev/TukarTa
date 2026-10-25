import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  RotateCcw,
  ListMusic,
  ExternalLink,
  Music2,
  FileCode2,
  Lock,
  Radio,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Zap,
  CornerDownRight,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  Type,
  Eye,
  EyeOff,
  GripVertical,
  Clock,
  Gauge,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useSetlistSongs, useMyKnownSongs } from '../utils/hooks/useMusician';
import { useSongLyrics } from '../utils/hooks/useSongs';
import { useBandSession } from '../context/bandSession';
import { getOfflineGigPackage } from '../utils/offlineManager';
import { supabase } from '../utils/supabase';
import { searchSongs, getLyrics, fetchKaraokeVideoIds } from '../utils/musicApi';
import {
  parseLineSegments,
  transposeChord,
  transposeChordProText,
} from '../utils/chordParser';
import { WebView } from 'react-native-webview';

const SEARCH_PROVIDERS = [
  { name: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=', color: '#059669' },
  { name: 'Genius Lyrics', url: 'https://genius.com/search?q=', color: '#D97706' },
  { name: 'Boite à Chansons', url: 'https://www.boiteachansons.net/recherche?q=', color: '#0284C7' },
];

export default function StageModeScreen() {
  const router = useRouter();
  const { setlistId: setlistIdParam, initialSongId, songId, title, artist, key: paramKey } = useLocalSearchParams();

  // Band Session Integration
  const {
    sessionCode,
    setlistId: sessionSetlistId,
    isLeader,
    connected,
    currentSong: syncCurrentSong,
    nextSong: syncNextSong,
    members,
    broadcastSong,
    broadcastPlayback,
    broadcastCountIn,
    countInNumber,
    activeCue,
    isOfflineHotspot,
    syncMode,
  } = useBandSession();

  // Fall back to the live session's setlist when opened without params (e.g. from Band Session)
  const setlistId = (setlistIdParam as string) || (isLeader ? sessionSetlistId : null) || undefined;

  // 1. Full setlist
  const { data: setlistSongs } = useSetlistSongs(setlistId as string);

  // 2. Navigation index & play state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [isMinusOneVisible, setIsMinusOneVisible] = useState(false);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [offlineSongs, setOfflineSongs] = useState<any[]>([]);

  // Real Playback Timer, BPM, & Auto-Scroll Engine
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef<number>(0);
  const tapTimesRef = useRef<number[]>([]);
  const isUserScrollingRef = useRef<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentBpm, setCurrentBpm] = useState<number>(120);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState<number>(1.0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Stage View Customization: Lyrics font size & Collapsible Top Section & Collapsible Bottom Player
  const [lyricsFontSize, setLyricsFontSize] = useState<number>(20);
  const [isHeaderHidden, setIsHeaderHidden] = useState<boolean>(false);
  const [isBottomPlayerHidden, setIsBottomPlayerHidden] = useState<boolean>(false);
  const [isManualFetching, setIsManualFetching] = useState<boolean>(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Minus 1 Backing Track Video State
  const [minusOneVideoId, setMinusOneVideoId] = useState<string | null>(null);
  const [isLoadingMinusOne, setIsLoadingMinusOne] = useState<boolean>(false);
  const [minusOneCandidates, setMinusOneCandidates] = useState<string[]>([]);
  const [minusOneCandidateIdx, setMinusOneCandidateIdx] = useState<number>(0);

  const formatSongTime = (sec: any): string => {
    const num = Number(sec);
    if (!Number.isFinite(num) || isNaN(num) || num <= 0) return '00:00';
    const s = Math.floor(num);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load persisted font size
  useEffect(() => {
    AsyncStorage.getItem('@stage_lyrics_font_size')
      .then((val) => {
        if (val) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed) && parsed >= 12 && parsed <= 38) {
            setLyricsFontSize(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFontSizeChange = (delta: number) => {
    setLyricsFontSize((prev) => {
      const next = Math.min(36, Math.max(14, prev + delta));
      AsyncStorage.setItem('@stage_lyrics_font_size', String(next)).catch(() => {});
      return next;
    });
  };

  // Load offline gig package fallback if offline or db empty
  useEffect(() => {
    if (setlistId) {
      getOfflineGigPackage(setlistId as string).then((pkg) => {
        if (pkg && pkg.songs && pkg.songs.length > 0) {
          const mapped = pkg.songs.map((ps) => ({
            id: ps.id,
            position: ps.position,
            song: {
              id: ps.song_id,
              title: ps.title,
              artist: ps.artist,
              original_key: ps.original_key,
            },
            plain_lyrics: ps.plain_lyrics,
            provider: ps.provider,
          }));
          setOfflineSongs(mapped);
        }
      });
    }
  }, [setlistId]);

  // Single direct song mode (e.g., opened directly from Song Dictionary)
  const isDirectSongMode = !setlistId && !!songId;
  const directSongObj = useMemo(() => {
    if (!isDirectSongMode) return null;
    return {
      id: songId as string,
      position: 1,
      song: {
        id: songId as string,
        title: (title as string) || 'Untitled Song',
        artist: (artist as string) || 'Unknown Artist',
        original_key: (paramKey as string) || 'C',
      },
    };
  }, [isDirectSongMode, songId, title, artist, paramKey]);

  // Real setlist songs from DB, or fallback to offline cached package, or single direct song
  const baseSongsList = isDirectSongMode && directSongObj
    ? [directSongObj]
    : (setlistSongs && setlistSongs.length > 0)
    ? setlistSongs
    : offlineSongs;

  // Leader-editable dynamic queue
  // Musician's known repertoire for instant offline audience request lookups
  const { data: myKnownSongs } = useMyKnownSongs();

  // Leader-editable dynamic queue: supports live reordering, audience requests, skips, additions
  const [customQueue, setCustomQueue] = useState<any[] | null>(null);

  // Audience request search state
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);

  const songsList = useMemo(() => {
    return customQueue || baseSongsList;
  }, [customQueue, baseSongsList]);

  // Instant offline filter against repertoire
  const filteredKnownSongs = useMemo(() => {
    if (!myKnownSongs || !requestSearchQuery.trim()) return [];
    const q = requestSearchQuery.toLowerCase().trim();
    const seen = new Set<string>();
    const list: any[] = [];
    for (const item of myKnownSongs) {
      const s = (item as any).song;
      if (!s) continue;
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const artistMatch = (s.artist || '').toLowerCase().includes(q);
      if ((titleMatch || artistMatch) && !seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    }
    return list.slice(0, 8);
  }, [myKnownSongs, requestSearchQuery]);

  // Online catalog search with debounce
  useEffect(() => {
    const q = requestSearchQuery.trim();
    if (q.length < 2) {
      setApiSearchResults([]);
      setIsSearchingApi(false);
      return;
    }
    setIsSearchingApi(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSongs(q);
        const knownIds = new Set(filteredKnownSongs.map((s: any) => s.id));
        const filtered = (results || [])
          .filter((r: any) => !knownIds.has(r.id))
          .slice(0, 6);
        setApiSearchResults(filtered);
      } catch {
        setApiSearchResults([]);
      } finally {
        setIsSearchingApi(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [requestSearchQuery, filteredKnownSongs]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = (val: any): boolean => typeof val === 'string' && UUID_REGEX.test(val);

  // Move a queued song to a new slot (never above the song playing now)
  const moveQueueSong = async (from: number, to: number) => {
    if (to <= currentIndex || to >= songsList.length || from <= currentIndex || from === to) return;
    const next = [...songsList];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCustomQueue(next);

    // Persist the new order for real setlists (best effort)
    if (setlistId) {
      try {
        await Promise.all(
          next.map((s: any, i: number) =>
            s.id && isUuid(s.id)
              ? supabase.from('setlist_songs').update({ position: i + 1 }).eq('id', s.id)
              : Promise.resolve()
          )
        );
      } catch (e) {
        console.warn('Could not save new queue order:', e);
      }
    }
  };

  // 1-Tap Promote to "Up Next" slot
  const makeUpNext = (fromIndex: number) => {
    if (fromIndex <= currentIndex + 1 || fromIndex >= songsList.length) return;
    moveQueueSong(fromIndex, currentIndex + 1);
  };

  // 1-Tap Skip / Jump to any song in the running order
  const jumpToSong = (targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    setCurrentIndex(targetIndex);
    setTransposeSteps(0);
  };

  // Remove / skip a song from the upcoming queue
  const removeQueueSong = async (indexToRemove: number) => {
    if (indexToRemove <= currentIndex) return;
    const itemToRemove = songsList[indexToRemove];
    const next = songsList.filter((_: any, i: number) => i !== indexToRemove);
    setCustomQueue(next);

    if (setlistId && itemToRemove?.id && isUuid(itemToRemove.id)) {
      try {
        await supabase.from('setlist_songs').delete().eq('id', itemToRemove.id);
      } catch (e) {
        console.warn('Could not delete song from setlist:', e);
      }
    }
  };

  // Add an audience request immediately into the live queue
  const handleAddAudienceRequest = async (
    songItem: { id?: string; title: string; artist?: string; original_key?: string; bpm?: number; plain_lyrics?: string; plainLyrics?: string },
    mode: 'play_next' | 'play_now'
  ) => {
    const cleanTitle = (songItem.title || 'Untitled Request').trim();
    const rawArtist = (songItem.artist || '').trim();
    const isPlaceholderArtist =
      !rawArtist ||
      /^(audience request|unknown artist|custom request|requested song|request|unknown)$/i.test(rawArtist);
    const cleanArtist = isPlaceholderArtist ? 'Audience Request' : rawArtist;
    const cleanKey = songItem.original_key || 'C';
    const initialLyrics = songItem.plain_lyrics || (songItem as any).plainLyrics || undefined;
    const generatedSongId = songItem.id || `custom_${Date.now()}`;

    const newQueueItem = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      position: mode === 'play_now' ? currentIndex + 1 : currentIndex + 2,
      isRequest: true,
      plain_lyrics: initialLyrics,
      song: {
        id: generatedSongId,
        title: cleanTitle,
        artist: cleanArtist,
        original_key: cleanKey,
        bpm: songItem.bpm || null,
      },
    };

    const nextQueue = [...songsList];
    if (mode === 'play_now') {
      nextQueue.splice(currentIndex, 0, newQueueItem);
      setCustomQueue(nextQueue);
      setTransposeSteps(0);
      setRequestNotice(`Now Playing: "${cleanTitle}"`);
    } else {
      nextQueue.splice(currentIndex + 1, 0, newQueueItem);
      setCustomQueue(nextQueue);
      setRequestNotice(`Added to Up Next: "${cleanTitle}"`);
    }

    setRequestSearchQuery('');
    setApiSearchResults([]);

    setTimeout(() => {
      setRequestNotice(null);
    }, 4000);

    // If lyrics weren't bundled with the song item, fetch immediately from LRCLIB in background
    if (!initialLyrics) {
      getLyrics(isPlaceholderArtist ? '' : cleanArtist, cleanTitle)
        .then((fetched) => {
          if (fetched?.plainLyrics) {
            setCustomQueue((prevQueue) => {
              const list = prevQueue || songsList;
              return list.map((item) => {
                if (item.song?.id === generatedSongId || (item.song?.title === cleanTitle && !item.plain_lyrics)) {
                  return {
                    ...item,
                    plain_lyrics: fetched.plainLyrics,
                    song: {
                      ...item.song,
                      artist: isPlaceholderArtist && fetched.artist ? fetched.artist : item.song.artist,
                    },
                  };
                }
                return item;
              });
            });
          }
        })
        .catch(() => {});
    }

    // Save to database if setlistId is active
    if (setlistId && isUuid(setlistId)) {
      try {
        let dbSongId = songItem.id;
        if (!dbSongId || !isUuid(dbSongId)) {
          const { data: createdSong } = await supabase
            .from('songs')
            .upsert(
              {
                title: cleanTitle,
                artist: cleanArtist,
                genre: 'Request',
                original_key: cleanKey,
              },
              { onConflict: 'title, artist' }
            )
            .select('id')
            .single();
          if (createdSong?.id) dbSongId = createdSong.id;
        }

        if (dbSongId && isUuid(dbSongId)) {
          await supabase.from('setlist_songs').insert({
            setlist_id: setlistId,
            song_id: dbSongId,
            position: mode === 'play_now' ? currentIndex + 1 : currentIndex + 2,
          });
        }
      } catch (e) {
        console.warn('Setlist song async persist note:', e);
      }
    }
  };

  // 1-Tap Instant LRCLIB fetch for the song currently on stage
  const handleFetchCurrentLyrics = async () => {
    const rawSongTitle = currentSetlistSong?.song?.title;
    if (!rawSongTitle) return;
    setIsManualFetching(true);
    try {
      const fetched = await getLyrics(
        currentSetlistSong?.song?.artist || '',
        rawSongTitle
      );
      if (fetched?.plainLyrics) {
        setCustomQueue((prev) => {
          const list = prev || songsList;
          return list.map((item, idx) =>
            idx === currentIndex
              ? {
                  ...item,
                  plain_lyrics: fetched.plainLyrics,
                  song: {
                    ...item.song,
                    artist:
                      currentSetlistSong?.song?.artist === 'Audience Request' && fetched.artist
                        ? fetched.artist
                        : item.song.artist,
                  },
                }
              : item
          );
        });
        setRequestNotice(`Lyrics fetched for "${rawSongTitle}"`);
        setTimeout(() => setRequestNotice(null), 3500);
      } else {
        alert('Could not find lyrics on LRCLIB. Please import chords manually.');
      }
    } catch (e) {
      console.warn('Manual LRCLIB fetch error:', e);
    } finally {
      setIsManualFetching(false);
    }
  };

  // Determine effective song: if member in active session, follow leader's broadcast
  const isMemberFollowing = !isLeader && !!sessionCode && !!syncCurrentSong;

  // Initialize index when setlist loads
  React.useEffect(() => {
    if (setlistSongs && initialSongId) {
      const idx = setlistSongs.findIndex((s: any) => s.song?.id === initialSongId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [setlistSongs, initialSongId]);

  // Reset transpose when switching songs
  React.useEffect(() => {
    setTransposeSteps(0);
  }, [currentIndex, syncCurrentSong?.songId]);

  const currentSetlistSong = songsList[currentIndex];
  const nextSetlistSong = songsList[currentIndex + 1];

  // 3. Lyrics & Chords Hook (Offline Local Cache -> Supabase Cache -> LRCLIB)
  const songQueryId = isMemberFollowing ? syncCurrentSong.songId : currentSetlistSong?.song?.id;
  const songQueryArtist = isMemberFollowing ? syncCurrentSong.artist : currentSetlistSong?.song?.artist;
  const songQueryTitle = isMemberFollowing ? syncCurrentSong.title : currentSetlistSong?.song?.title;

  const { data: lyricsData, isLoading: isLoadingLyrics } = useSongLyrics(
    songQueryId,
    songQueryArtist,
    songQueryTitle
  );

  const rawLyrics = (isMemberFollowing && syncCurrentSong.plain_lyrics)
    ? syncCurrentSong.plain_lyrics
    : currentSetlistSong?.plain_lyrics || lyricsData?.plain_lyrics || '';

  const hasLyrics = !!rawLyrics;
  const baseKey = isMemberFollowing
    ? syncCurrentSong.key || 'G'
    : currentSetlistSong?.song?.original_key || 'G';

  const activeKey = transposeChord(baseKey, transposeSteps);

  const displayedLyrics = useMemo(() => {
    if (!rawLyrics) return '';
    return transposeChordProText(rawLyrics, transposeSteps);
  }, [rawLyrics, transposeSteps]);

  // Index lyrics into playable lines for real-time highlighting
  const lyricsLineList = useMemo(() => {
    if (!displayedLyrics) return [];
    const lines: { text: string; pIdx: number; lIdx: number; isHeader: boolean; hasChords: boolean }[] = [];
    const pList = displayedLyrics.split('\n\n');
    pList.forEach((p, pIdx) => {
      p.split('\n').forEach((l, lIdx) => {
        const parsed = parseLineSegments(l);
        lines.push({
          text: l,
          pIdx,
          lIdx,
          isHeader: parsed.isSectionHeader,
          hasChords: parsed.segments.some((s) => !!s.chord),
        });
      });
    });
    return lines;
  }, [displayedLyrics]);

  const playableLines = useMemo(() => {
    return lyricsLineList.filter((l) => !l.isHeader && l.text.trim().length > 0);
  }, [lyricsLineList]);

  const totalPlayableLines = Math.max(playableLines.length, 1);

  // Sync BPM when current song changes
  useEffect(() => {
    if (currentSetlistSong?.song?.bpm) {
      setCurrentBpm(currentSetlistSong.song.bpm);
    }
  }, [currentSetlistSong?.song?.id, currentSetlistSong?.song?.bpm]);

  // Real song duration calculation (from BPM or line count estimate, default 210s)
  const songDuration = useMemo(() => {
    const rawDur = (currentSetlistSong?.song as any)?.duration_seconds;
    if (typeof rawDur === 'number' && rawDur > 30) return rawDur;
    if (totalPlayableLines > 2) {
      const estSeconds = Math.round((totalPlayableLines * 4 * 60) / Math.max(currentBpm || 120, 45));
      if (!isNaN(estSeconds) && isFinite(estSeconds) && estSeconds > 45) {
        return Math.max(90, Math.min(360, estSeconds));
      }
    }
    return 210;
  }, [totalPlayableLines, currentBpm, currentSetlistSong]);

  // Reset playback timer & auto-scroll on song change or manual reset
  useEffect(() => {
    setElapsedSeconds(0);
    setMinusOneVideoId(null);
    setMinusOneCandidates([]);
    setMinusOneCandidateIdx(0);
    setIsLoadingMinusOne(false);
    scrollOffsetRef.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentIndex, syncCurrentSong?.songId]);

  // Real-time playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setElapsedSeconds((sec) => {
        if (sec >= songDuration) {
          setIsPlaying(false);
          return songDuration;
        }
        return sec + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, songDuration]);

  // Smooth auto-scroll: position derived from elapsed time (no accumulating drift / feedback)
  const elapsedRef = useRef<number>(0);
  elapsedRef.current = elapsedSeconds;
  useEffect(() => {
    if (!isPlaying || !isAutoScroll || contentHeight <= containerHeight) return;
    const maxScroll = Math.max(0, contentHeight - containerHeight);
    const startedAt = Date.now();
    const startElapsed = elapsedRef.current;
    const scrollTimer = setInterval(() => {
      if (isUserScrollingRef.current) return;
      const t = startElapsed + ((Date.now() - startedAt) / 1000) * scrollSpeedMultiplier;
      const ratio = Math.max(0, Math.min(1, t / songDuration));
      const y = ratio * maxScroll;
      if (Math.abs(y - scrollOffsetRef.current) >= 1) {
        scrollOffsetRef.current = y;
        scrollViewRef.current?.scrollTo({ y, animated: false });
      }
    }, 33);
    return () => clearInterval(scrollTimer);
  }, [isPlaying, isAutoScroll, contentHeight, containerHeight, songDuration, scrollSpeedMultiplier]);

  // Real active line index based on elapsed playback progress
  const activePlayableLineIndex = useMemo(() => {
    if (!isPlaying || elapsedSeconds === 0) return 0;
    const ratio = elapsedSeconds / songDuration;
    return Math.min(totalPlayableLines - 1, Math.floor(ratio * totalPlayableLines));
  }, [elapsedSeconds, songDuration, totalPlayableLines, isPlaying]);

  // Tap tempo calculator
  const handleTapTempo = () => {
    const now = Date.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 3000);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      const intervals = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i] - recent[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgMs);
      if (bpm >= 45 && bpm <= 260) {
        setCurrentBpm(bpm);
      }
    }
  };

  // Toggle Minus 1 Backing Track: auto-search YouTube for the most played karaoke version
  const handleToggleMinusOne = async () => {
    if (isMinusOneVisible) {
      setIsMinusOneVisible(false);
      return;
    }
    setIsMinusOneVisible(true);
    if (!minusOneVideoId) {
      setIsLoadingMinusOne(true);
      try {
        const titleToSearch = currentSetlistSong?.song?.title || '';
        const artistToSearch = currentSetlistSong?.song?.artist || '';
        const ids = await fetchKaraokeVideoIds(titleToSearch, artistToSearch);
        if (ids.length > 0) {
          setMinusOneCandidates(ids);
          setMinusOneCandidateIdx(0);
          setMinusOneVideoId(ids[0]);
        }
      } catch (e) {
        console.warn('Minus 1 fetch error:', e);
      } finally {
        setIsLoadingMinusOne(false);
      }
    }
  };

  // Jump to specific line when tapped
  const handleJumpToLine = (pIdx: number, lIdx: number) => {
    const targetLineIdx = playableLines.findIndex((pl) => pl.pIdx === pIdx && pl.lIdx === lIdx);
    if (targetLineIdx !== -1) {
      const targetSec = Math.floor((targetLineIdx / totalPlayableLines) * songDuration);
      setElapsedSeconds(targetSec);
      if (contentHeight > containerHeight) {
        const targetY = (targetLineIdx / totalPlayableLines) * (contentHeight - containerHeight);
        scrollOffsetRef.current = targetY;
        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      }
    }
  };

  // Leader: Broadcast song change & key updates
  React.useEffect(() => {
    if (isLeader && currentSetlistSong) {
      broadcastSong(
        {
          songId: currentSetlistSong.song?.id || currentSetlistSong.id,
          title: currentSetlistSong.song?.title || 'Untitled Song',
          artist: currentSetlistSong.song?.artist || 'Unknown Artist',
          key: activeKey,
          originalKey: baseKey,
          transposeSteps,
          plain_lyrics: lyricsData?.plain_lyrics,
          provider: lyricsData?.provider,
          index: currentIndex,
          totalSongs: songsList.length,
        },
        nextSetlistSong
          ? {
              title: nextSetlistSong.song?.title || '',
              artist: nextSetlistSong.song?.artist || '',
              key: nextSetlistSong.song?.original_key || 'C',
            }
          : undefined
      );
    }
  }, [
    currentIndex,
    activeKey,
    lyricsData?.plain_lyrics,
    isLeader,
    nextSetlistSong?.id,
    nextSetlistSong?.song?.title,
    songsList.length,
  ]);

  // 4. Web Search
  const handleWebSearch = async (baseUrl: string) => {
    if (!currentSetlistSong) return;
    const artist = currentSetlistSong.song?.artist;
    const cleanArtist = artist && artist.toLowerCase() !== 'unknown artist' ? artist : '';
    const query = `${currentSetlistSong.song?.title} ${cleanArtist}`.trim();
    const fullUrl = `${baseUrl}${encodeURIComponent(query)}`;
    await WebBrowser.openBrowserAsync(fullUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: '#FFFFFF',
      enableBarCollapsing: true,
      showTitle: true,
    });
  };

  const handleOpenImportChords = () => {
    router.push({
      pathname: '/songs/import',
      params: {
        title: currentSetlistSong?.song?.title || '',
        artist: currentSetlistSong?.song?.artist || '',
        key: currentSetlistSong?.song?.original_key || 'G',
      },
    });
  };

  const displayedTitle = isMemberFollowing
    ? syncCurrentSong.title
    : currentSetlistSong?.song?.title || 'Select a Song';

  const displayedArtist = isMemberFollowing
    ? syncCurrentSong.artist
    : currentSetlistSong?.song?.artist || '';

  const displayedNextTitle = isMemberFollowing
    ? syncNextSong?.title || ''
    : nextSetlistSong?.song?.title || '';

  const displayedNextArtist = isMemberFollowing
    ? syncNextSong?.artist || ''
    : nextSetlistSong?.song?.artist || '';

  const displayedNextKey = isMemberFollowing
    ? syncNextSong?.key || ''
    : nextSetlistSong?.song?.original_key || '';

  const isNextRequest = !isMemberFollowing && !!nextSetlistSong?.isRequest;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, orientation: 'portrait' }} />

      {/* ── Count In Banner Notification if triggered ── */}
      {countInNumber !== null && (
        <View style={styles.countInOverlay}>
          <Text style={styles.countInText}>{countInNumber}</Text>
          <Text style={styles.countInSub}>COUNT IN</Text>
        </View>
      )}

      {/* ── Active Cue Toast ── */}
      {activeCue && (
        <View style={styles.cueToast}>
          <Sparkles size={14} color="#10B981" />
          <Text style={styles.cueToastText}>{activeCue}</Text>
        </View>
      )}

      {/* ── Top Status Bar ── */}
      <View style={styles.topStatusBar}>
        {isHeaderHidden ? (
          <TouchableOpacity
            style={styles.compactSongPill}
            onPress={() => setIsHeaderHidden(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.compactSongTitle} numberOfLines={1}>
              {displayedTitle}
            </Text>
            <View style={styles.compactKeyTag}>
              <Text style={styles.compactKeyText}>KEY: {activeKey}</Text>
            </View>
            <ChevronDown size={14} color="#065F46" />
          </TouchableOpacity>
        ) : (
          <View style={styles.syncStatusGroup}>
            <View
              style={[
                styles.pulseDot,
                sessionCode
                  ? { backgroundColor: isOfflineHotspot ? '#F59E0B' : isLeader ? '#EF4444' : '#10B981' }
                  : null,
              ]}
            />
            <Text style={styles.syncStatusText}>
              {sessionCode
                ? isLeader
                  ? isOfflineHotspot
                    ? `HOTSPOT P2P (${members.length}) • ${sessionCode}`
                    : `BROADCASTING (${members.length}) • ${sessionCode}`
                  : isOfflineHotspot
                    ? `HOTSPOT SYNC WITH LEADER • ${sessionCode}`
                    : `IN SYNC WITH LEADER • ${sessionCode}`
                : `OFFLINE STAGE MODE • ${lyricsData?.provider === 'user_import' ? 'CHORDPRO' : 'LRCLIB SYNC'}`}
            </Text>
          </View>
        )}

        <View style={styles.topRightActions}>
          {/* ── Customizable Lyrics Font Size (A- / A+) ── */}
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={styles.fontSizeBtn}
              onPress={() => handleFontSizeChange(-2)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.fontSizeBtnText}>A-</Text>
            </TouchableOpacity>
            <View style={styles.fontSizeBadge}>
              <Text style={styles.fontSizeBadgeText}>{lyricsFontSize}</Text>
            </View>
            <TouchableOpacity
              style={styles.fontSizeBtn}
              onPress={() => handleFontSizeChange(2)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.fontSizeBtnText}>A+</Text>
            </TouchableOpacity>
          </View>

          {/* ── Hide/Show Top Section Toggle ── */}
          <TouchableOpacity
            style={[styles.hideTopBtn, isHeaderHidden && styles.hideTopBtnActive]}
            onPress={() => setIsHeaderHidden((v) => !v)}
          >
            {isHeaderHidden ? (
              <>
                <ChevronDown size={13} color="#065F46" />
                <Text style={styles.hideTopBtnText}>SHOW TOP</Text>
              </>
            ) : (
              <>
                <ChevronUp size={13} color="#065F46" />
                <Text style={styles.hideTopBtnText}>HIDE TOP</Text>
              </>
            )}
          </TouchableOpacity>

          {!isHeaderHidden && (
            <TouchableOpacity style={styles.importHeaderBtn} onPress={handleOpenImportChords}>
              <FileCode2 size={13} color="#10B981" />
              <Text style={styles.importHeaderBtnText}>IMPORT</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.exitBtnText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Song Info & Live Key Transposer Section (Collapsible) ── */}
      {!isHeaderHidden && (
        <View style={styles.songInfoSection}>
          <View style={styles.songInfoMain}>
            <View style={{ flex: 1 }}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {displayedTitle}
              </Text>
              <Text style={styles.songArtist}>
                {displayedArtist}
              </Text>
            </View>

            <View style={styles.songInfoRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* ── Key Transposer ── */}
                <View style={styles.transposeControls}>
                  <TouchableOpacity
                    style={styles.transposeStepBtn}
                    onPress={() => setTransposeSteps((s) => s - 1)}
                  >
                    <Text style={styles.transposeStepText}>-</Text>
                  </TouchableOpacity>

                  <View style={styles.keyBadge}>
                    <Text style={styles.keyBadgeText}>
                      KEY: {activeKey}
                      {transposeSteps !== 0 ? ` (${transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps})` : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.transposeStepBtn}
                    onPress={() => setTransposeSteps((s) => s + 1)}
                  >
                    <Text style={styles.transposeStepText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Real BPM & Tap Tempo Controls ── */}
                <View style={styles.bpmGroup}>
                  <TouchableOpacity
                    style={styles.transposeStepBtn}
                    onPress={() => setCurrentBpm((b) => Math.max(45, b - 5))}
                  >
                    <Text style={styles.transposeStepText}>-</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bpmBadge}
                    onPress={handleTapTempo}
                    activeOpacity={0.75}
                  >
                    <Gauge size={11} color="#059669" />
                    <Text style={styles.bpmBadgeText}>{currentBpm} BPM</Text>
                    <Text style={styles.tapSubText}>TAP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.transposeStepBtn}
                    onPress={() => setCurrentBpm((b) => Math.min(240, b + 5))}
                  >
                    <Text style={styles.transposeStepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {displayedNextTitle ? (
                <View style={styles.nextSongBadgeRow}>
                  <Text style={styles.nextSongLabel} numberOfLines={1}>
                    NEXT: {displayedNextTitle} {displayedNextKey ? `(${displayedNextKey})` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Real Progress Scrub Bar with Dynamic Timers & Auto-Scroll ── */}
          <View style={styles.progressSection}>
            <View style={styles.timeRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Clock size={11} color="#059669" />
                <Text style={styles.timeText}>{formatSongTime(elapsedSeconds)}</Text>
              </View>

              {/* Auto-Scroll Toggle & Speed Stepper */}
              <View style={styles.autoScrollPillRow}>
                <TouchableOpacity
                  style={[styles.autoScrollToggleBtn, isAutoScroll && styles.autoScrollToggleBtnActive]}
                  onPress={() => setIsAutoScroll((v) => !v)}
                >
                  <ChevronsDown size={11} color={isAutoScroll ? '#FFFFFF' : '#059669'} />
                  <Text style={[styles.autoScrollToggleText, isAutoScroll && { color: '#FFFFFF' }]}>
                    {isAutoScroll ? 'SCROLL ON' : 'SCROLL OFF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.speedPill}
                  onPress={() => {
                    setScrollSpeedMultiplier((s) => (s === 1.0 ? 1.25 : s === 1.25 ? 1.5 : s === 1.5 ? 0.75 : 1.0));
                  }}
                >
                  <Text style={styles.speedPillText}>{scrollSpeedMultiplier}x</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timeText}>
                -{formatSongTime(Math.max(0, songDuration - elapsedSeconds))}
              </Text>
            </View>

            {/* Interactive Progress Bar (Tap to Scrub & Sync Lyrics) */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.progressBase}
              onPress={(e: any) => {
                const nativeEvt = e.nativeEvent || {};
                const clickX =
                  typeof nativeEvt.locationX === 'number' && !isNaN(nativeEvt.locationX)
                    ? nativeEvt.locationX
                    : typeof nativeEvt.offsetX === 'number' && !isNaN(nativeEvt.offsetX)
                    ? nativeEvt.offsetX
                    : null;

                if (clickX !== null && songDuration > 0) {
                  const ratio = Math.max(0, Math.min(1, clickX / 300));
                  const newSec = Math.round(ratio * songDuration);
                  if (!isNaN(newSec)) {
                    setElapsedSeconds(newSec);
                    if (contentHeight > containerHeight) {
                      const targetY = ratio * (contentHeight - containerHeight);
                      scrollOffsetRef.current = targetY;
                      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                    }
                  }
                }
              }}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(1, ((elapsedSeconds || 0) / (songDuration || 1)) * 100)
                    )}%`,
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Embedded Minus 1 Player (Auto-Searched YouTube Video & Auto-Play) ── */}
      {isMinusOneVisible && currentSetlistSong && (
        <View style={styles.playerContainer}>
          <View style={styles.playerHeaderBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <Music2 size={13} color="#10B981" />
              <Text style={styles.playerHeaderTitle} numberOfLines={1}>
                Minus 1: {currentSetlistSong.song?.title}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {minusOneCandidates.length > 1 && (
                <TouchableOpacity
                  style={styles.playerOpenYtBtn}
                  onPress={() => {
                    const next = (minusOneCandidateIdx + 1) % minusOneCandidates.length;
                    setMinusOneCandidateIdx(next);
                    setMinusOneVideoId(minusOneCandidates[next]);
                  }}
                >
                  <SkipForward size={11} color="#A7F3D0" />
                  <Text style={styles.playerOpenYtText}>Try next</Text>
                </TouchableOpacity>
              )}
              {minusOneVideoId && (
                <TouchableOpacity
                  style={styles.playerOpenYtBtn}
                  onPress={() => {
                    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${minusOneVideoId}`);
                  }}
                >
                  <ExternalLink size={11} color="#A7F3D0" />
                  <Text style={styles.playerOpenYtText}>YouTube ↗</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.playerCloseBtn}
                onPress={() => setIsMinusOneVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoadingMinusOne ? (
            <View style={styles.playerLoadingBox}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.playerLoadingText}>
                Finding best minus 1 backing track for "{currentSetlistSong.song?.title}"...
              </Text>
            </View>
          ) : minusOneVideoId ? (
            Platform.OS === 'web' ? (
              <iframe
                src={`https://www.youtube.com/embed/${minusOneVideoId}?autoplay=1&enablejsapi=1`}
                style={{ width: '100%', height: '100%', border: 'none' } as any}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <WebView
                style={styles.webview}
                source={{
                  uri: `https://www.youtube.com/embed/${minusOneVideoId}?autoplay=1`,
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
              />
            )
          ) : (
            <View style={styles.playerLoadingBox}>
              <Text style={styles.playerLoadingText}>
                Could not automatically resolve embed ID. Tap to search directly:
              </Text>
              <TouchableOpacity
                style={styles.ytSearchFallbackBtn}
                onPress={() => {
                  const cleanArtist = (currentSetlistSong.song?.artist || '')
                    .replace(/\b(audience request|unknown artist|custom request|requested song|request|unknown)\b/gi, '')
                    .trim();
                  const q = cleanArtist
                    ? `${currentSetlistSong.song?.title} ${cleanArtist} karaoke minus 1`
                    : `${currentSetlistSong.song?.title} karaoke minus 1`;
                  WebBrowser.openBrowserAsync(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
                }}
              >
                <ExternalLink size={13} color="#FFFFFF" />
                <Text style={styles.ytSearchFallbackText}>Open Search on YouTube</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Lyrics & Chords Performance Area with Real-Time Two-Way Auto-Scroll Sync ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={50}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        onScrollBeginDrag={() => {
          isUserScrollingRef.current = true;
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isUserScrollingRef.current = false;
          }, 400);
        }}
        onMomentumScrollEnd={() => {
          isUserScrollingRef.current = false;
        }}
        onScroll={(e) => {
          // Only user-driven scrolling syncs the timer; programmatic auto-scroll must not feed back
          if (!isUserScrollingRef.current) return;
          const currentY = e.nativeEvent.contentOffset.y;
          if (typeof currentY === 'number' && !isNaN(currentY)) {
            scrollOffsetRef.current = currentY;
            const maxScroll = contentHeight - containerHeight;
            if (maxScroll > 20 && songDuration > 0) {
              const scrollRatio = Math.max(0, Math.min(1, currentY / maxScroll));
              const syncedSec = Math.round(scrollRatio * songDuration);
              if (!isNaN(syncedSec)) setElapsedSeconds(syncedSec);
            }
          }
        }}
      >
        {isLoadingLyrics ? (
          <View style={styles.lyricsLoading}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading offline chords & lyrics...</Text>
          </View>
        ) : hasLyrics ? (
          <View style={styles.realLyricsContainer}>
            {displayedLyrics.split('\n\n').map((paragraph: string, pIdx: number) => (
              <View key={pIdx} style={styles.verseBlock}>
                {paragraph.split('\n').map((line: string, lIdx: number) => {
                  const parsedLine = parseLineSegments(line);
                  if (parsedLine.isSectionHeader) {
                    return (
                      <Text key={lIdx} style={styles.verseLabel}>
                        {parsedLine.sectionTitle}
                      </Text>
                    );
                  }

                  const isHighlighted =
                    isPlaying &&
                    playableLines[activePlayableLineIndex]?.pIdx === pIdx &&
                    playableLines[activePlayableLineIndex]?.lIdx === lIdx;

                  const hasInlineChords = parsedLine.segments.some((s) => !!s.chord);
                  if (hasInlineChords) {
                    return (
                      <TouchableOpacity
                        key={lIdx}
                        activeOpacity={0.85}
                        onPress={() => handleJumpToLine(pIdx, lIdx)}
                        style={[
                          styles.chordLineWrap,
                          isHighlighted && styles.lyricLineHighlighted,
                        ]}
                      >
                        {parsedLine.segments.map((seg, sIdx) => (
                          <View key={sIdx} style={styles.chordSegmentCol}>
                            <Text
                              style={[
                                styles.stageChordText,
                                {
                                  fontSize: Math.round(lyricsFontSize * 0.78),
                                  lineHeight: Math.round(lyricsFontSize * 1.05),
                                },
                              ]}
                            >
                              {seg.chord || ' '}
                            </Text>
                            <Text
                              style={[
                                styles.stageLyricWithChordText,
                                isHighlighted && { color: '#064E3B', fontWeight: '900' },
                                {
                                  fontSize: lyricsFontSize,
                                  lineHeight: Math.round(lyricsFontSize * 1.45),
                                },
                              ]}
                            >
                              {seg.lyric || (seg.chord ? '   ' : '')}
                            </Text>
                          </View>
                        ))}
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={lIdx}
                      activeOpacity={0.85}
                      onPress={() => handleJumpToLine(pIdx, lIdx)}
                    >
                      <Text
                        style={[
                          styles.lyricLine,
                          isHighlighted && styles.lyricLineHighlighted,
                          {
                            fontSize: lyricsFontSize,
                            lineHeight: Math.round(lyricsFontSize * 1.5),
                          },
                        ]}
                      >
                        {line}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Quick button to attach or update chords if this only has plain LRCLIB lyrics */}
            {lyricsData?.provider !== 'user_import' && (
              <View style={styles.searchFallback}>
                <TouchableOpacity style={styles.importCtaPill} onPress={handleOpenImportChords}>
                  <FileCode2 size={14} color="#FFFFFF" />
                  <Text style={styles.importCtaText}>+ Paste / Attach Guitar Chords for This Song</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : !currentSetlistSong ? (
          <View style={styles.emptyStageView}>
            <Music2 size={48} color="#10B981" />
            <Text style={styles.emptyStageTitle}>No Songs in this Setlist</Text>
            <Text style={styles.emptyStageSubtitle}>
              Add songs from the gig setlist details screen or import chords to perform live.
            </Text>
          </View>
        ) : (
          /* High-Contrast Stage View Demo & Web Import fallback */
          <View style={styles.lyricsStageView}>
            <View style={styles.activeVerse}>
              <Text style={styles.verseLabelSmall}>NO LYRICS OR CHORDS STORED YET</Text>
              <Text style={styles.activeLineBold}>
                {currentSetlistSong?.song?.title}
              </Text>
              <Text style={styles.fadedLine}>
                {currentSetlistSong?.song?.artist}
              </Text>
            </View>

            {/* Web Search & Direct Import buttons */}
            <View style={styles.searchFallback}>
              {/* Instant 1-Tap LRCLIB Fetch Button */}
              <TouchableOpacity
                style={[styles.importCtaPill, { backgroundColor: '#059669', marginBottom: 10 }]}
                disabled={isManualFetching}
                onPress={handleFetchCurrentLyrics}
              >
                {isManualFetching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Sparkles size={15} color="#FFFFFF" />
                )}
                <Text style={styles.importCtaText}>
                  {isManualFetching ? 'Searching LRCLIB...' : `Instant Fetch Lyrics from LRCLIB`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.importCtaPill} onPress={handleOpenImportChords}>
                <FileCode2 size={15} color="#FFFFFF" />
                <Text style={styles.importCtaText}>Import Web Chords / Tab for "{currentSetlistSong?.song?.title}"</Text>
              </TouchableOpacity>

              <Text style={styles.fallbackHeader}>OR COPY CHORDS FROM THE WEB:</Text>
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
        {/* ── What's Next / Up Next Live Preview Bar ── */}
        <View style={styles.footerUpNextBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsQueueVisible(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
          >
            <View style={styles.footerUpNextBadge}>
              <Text style={styles.footerUpNextBadgeText}>UP NEXT</Text>
            </View>

            <Text style={styles.footerUpNextTitle} numberOfLines={1}>
              {displayedNextTitle ? displayedNextTitle : 'End of Setlist (No Upcoming Song)'}
            </Text>

            {displayedNextArtist ? (
              <Text style={styles.footerUpNextArtist} numberOfLines={1}>
                • {displayedNextArtist}
              </Text>
            ) : null}

            {displayedNextKey ? (
              <View style={styles.footerUpNextKeyBadge}>
                <Text style={styles.footerUpNextKeyText}>KEY {displayedNextKey}</Text>
              </View>
            ) : null}

            {isNextRequest && (
              <View style={styles.requestInlineTag}>
                <Text style={styles.requestInlineTagText}>REQUEST</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Toggle button to hide/show the below player component UI */}
            <TouchableOpacity
              style={styles.footerTogglePlayerBtn}
              onPress={() => setIsBottomPlayerHidden((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isBottomPlayerHidden ? (
                <>
                  <ChevronUp size={13} color="#065F46" />
                  <Text style={styles.footerTogglePlayerText}>PLAYER</Text>
                </>
              ) : (
                <>
                  <ChevronDown size={13} color="#065F46" />
                  <Text style={styles.footerTogglePlayerText}>HIDE</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerUpNextAction}
              onPress={() => setIsQueueVisible(true)}
            >
              <ListMusic size={12} color="#059669" />
              <Text style={styles.footerUpNextActionText}>QUEUE ▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Transport Controls & Subactions (Collapsible) ── */}
        {!isBottomPlayerHidden && (
          <>
            <View style={styles.transportRow}>
              {isMemberFollowing ? (
                /* Follower view: locked to leader */
                <View style={styles.syncedMemberBox}>
                  <Lock size={16} color="#10B981" />
                  <Text style={styles.syncedMemberText}>
                    TELEPROMPTER CONTROLLED BY LEADER
                  </Text>
                </View>
              ) : (
                /* Leader / Solo view */
                <>
                  <TouchableOpacity
                    style={[styles.transportBtnSide, currentIndex === 0 && { opacity: 0.4 }]}
                    activeOpacity={0.8}
                    disabled={currentIndex === 0}
                    onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <SkipBack size={22} color="#166534" fill="#166534" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.transportBtnMain}
                    activeOpacity={0.88}
                    onPress={() => {
                      const nextState = !isPlaying;
                      setIsPlaying(nextState);
                      if (isLeader) broadcastPlayback(nextState);
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={36} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Play size={36} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>

                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.transportBtnSide, currentIndex >= songsList.length - 1 && { opacity: 0.4 }]}
                      activeOpacity={0.8}
                      disabled={currentIndex >= songsList.length - 1}
                      onPress={() => setCurrentIndex((prev) => Math.min(songsList.length - 1, prev + 1))}
                    >
                      <SkipForward size={22} color="#166534" fill="#166534" />
                    </TouchableOpacity>
                    {displayedNextTitle ? (
                      <Text style={styles.nextSongBtnSubLabel} numberOfLines={1}>
                        {displayedNextTitle}
                      </Text>
                    ) : null}
                  </View>
                </>
              )}
            </View>

            <View style={styles.subActionsRow}>
              <TouchableOpacity
                style={styles.subActionBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setElapsedSeconds(0);
                  setIsPlaying(false);
                  setTransposeSteps(0);
                  scrollOffsetRef.current = 0;
                  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <RotateCcw size={14} color="#10B981" />
                <Text style={styles.subActionText}>RESET</Text>
              </TouchableOpacity>

              {isLeader && (
                <TouchableOpacity
                  style={[styles.subActionBtn, { borderColor: '#10B981' }]}
                  activeOpacity={0.7}
                  onPress={() => broadcastCountIn(120)}
                >
                  <Sparkles size={14} color="#10B981" />
                  <Text style={[styles.subActionText, { color: '#10B981', fontWeight: '800' }]}>
                    COUNT IN
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.subActionBtn}
                activeOpacity={0.7}
                onPress={handleToggleMinusOne}
              >
                <Music2 size={14} color="#10B981" />
                <Text style={styles.subActionText}>
                  {isMinusOneVisible ? 'HIDE TRACK' : 'MINUS 1'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subActionBtn}
                activeOpacity={0.7}
                onPress={() => setIsQueueVisible(true)}
              >
                <ListMusic size={14} color="#10B981" />
                <Text style={styles.subActionText}>
                  QUEUE{songsList.length > 0 ? ` (${Math.max(songsList.length - currentIndex - 1, 0)})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Queue / What's Next ── */}
      <Modal
        visible={isQueueVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsQueueVisible(false)}
      >
        <View style={styles.queueOverlay}>
          <View style={styles.queueSheet}>
            {/* Header */}
            <View style={styles.queueHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.queueTitle}>Set Queue</Text>
                  {songsList.filter((s: any) => s.isRequest).length > 0 && (
                    <View style={styles.queueBadgeRequest}>
                      <Text style={styles.queueBadgeRequestText}>
                        {songsList.filter((s: any) => s.isRequest).length} REQUESTS
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.queueSub}>
                  {isMemberFollowing
                    ? 'Synced with Band Leader'
                    : 'Search audience requests • Reorder • Skip live'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsQueueVisible(false)} style={styles.queueClose}>
                <Text style={styles.queueCloseText}>DONE</Text>
              </TouchableOpacity>
            </View>

            {/* Notification Banner when request is added */}
            {requestNotice && (
              <View style={styles.requestNoticeBanner}>
                <Check size={14} color="#065F46" />
                <Text style={styles.requestNoticeText}>{requestNotice}</Text>
              </View>
            )}

            {/* Audience Request Search Bar (Leader Only) */}
            {!isMemberFollowing && (
              <View style={styles.requestSearchContainer}>
                <View style={styles.requestSearchBar}>
                  <Search size={16} color="#059669" />
                  <TextInput
                    value={requestSearchQuery}
                    onChangeText={setRequestSearchQuery}
                    placeholder="Audience request? Search repertoire or song..."
                    placeholderTextColor="#059669"
                    style={styles.requestSearchInput}
                    returnKeyType="search"
                  />
                  {requestSearchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setRequestSearchQuery('');
                        setApiSearchResults([]);
                      }}
                      style={styles.requestClearBtn}
                    >
                      <X size={15} color="#047857" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Search Results Dropdown when searching */}
              {requestSearchQuery.trim().length > 0 && (
                <View style={styles.searchResultsBox}>
                  {/* Repertoire Matches */}
                  {filteredKnownSongs.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={styles.searchSectionTitle}>★ REPERTOIRE MATCHES (READY TO PLAY)</Text>
                      {filteredKnownSongs.map((s: any) => (
                        <View key={`known_${s.id}`} style={styles.searchResultCard}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.searchResultTitle} numberOfLines={1}>{s.title}</Text>
                            <Text style={styles.searchResultMeta} numberOfLines={1}>
                              {s.artist || 'Unknown'} • Key {s.original_key || 'C'}
                            </Text>
                          </View>
                          <View style={styles.searchActionRow}>
                            <TouchableOpacity
                              style={styles.btnPlayNext}
                              onPress={() => handleAddAudienceRequest(s, 'play_next')}
                            >
                              <Plus size={13} color="#065F46" />
                              <Text style={styles.btnPlayNextText}>Next</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.btnPlayNow}
                              onPress={() => handleAddAudienceRequest(s, 'play_now')}
                            >
                              <Zap size={13} color="#FFFFFF" />
                              <Text style={styles.btnPlayNowText}>Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Online Search Matches */}
                  {apiSearchResults.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={styles.searchSectionTitle}>🌐 ONLINE SONG CATALOG</Text>
                      {apiSearchResults.map((s: any) => (
                        <View key={`api_${s.id}`} style={styles.searchResultCard}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.searchResultTitle} numberOfLines={1}>{s.title}</Text>
                            <Text style={styles.searchResultMeta} numberOfLines={1}>{s.artist || 'Unknown'}</Text>
                          </View>
                          <View style={styles.searchActionRow}>
                            <TouchableOpacity
                              style={styles.btnPlayNext}
                              onPress={() => handleAddAudienceRequest(s, 'play_next')}
                            >
                              <Plus size={13} color="#065F46" />
                              <Text style={styles.btnPlayNextText}>Next</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.btnPlayNow}
                              onPress={() => handleAddAudienceRequest(s, 'play_now')}
                            >
                              <Zap size={13} color="#FFFFFF" />
                              <Text style={styles.btnPlayNowText}>Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {isSearchingApi && (
                    <View style={styles.searchLoadingRow}>
                      <ActivityIndicator size="small" color="#10B981" />
                      <Text style={styles.searchLoadingText}>Searching online catalog...</Text>
                    </View>
                  )}

                  {/* Quick Custom Request fallback */}
                  <View style={styles.customRequestCard}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.customRequestTitle} numberOfLines={1}>
                        "{requestSearchQuery.trim()}"
                      </Text>
                      <Text style={styles.customRequestSub}>Instant Custom Audience Request</Text>
                    </View>
                    <View style={styles.searchActionRow}>
                      <TouchableOpacity
                        style={styles.btnPlayNext}
                        onPress={() =>
                          handleAddAudienceRequest(
                            { title: requestSearchQuery.trim(), artist: 'Audience Request', original_key: 'C' },
                            'play_next'
                          )
                        }
                      >
                        <Plus size={13} color="#065F46" />
                        <Text style={styles.btnPlayNextText}>Next</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnPlayNow}
                        onPress={() =>
                          handleAddAudienceRequest(
                            { title: requestSearchQuery.trim(), artist: 'Audience Request', original_key: 'C' },
                            'play_now'
                          )
                        }
                      >
                        <Zap size={13} color="#FFFFFF" />
                        <Text style={styles.btnPlayNowText}>Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Running Order List */}
              <View style={styles.queueListSection}>
                <Text style={styles.queueListSectionTitle}>
                  CURRENT RUNNING ORDER ({songsList.length} SONGS)
                </Text>

                {songsList.length === 0 && (
                  <Text style={styles.queueEmpty}>
                    {syncNextSong
                      ? `Now: ${displayedTitle}\nNext: ${syncNextSong.title}`
                      : 'No songs in the setlist queue yet.'}
                  </Text>
                )}

                {songsList.map((item: any, idx: number) => {
                  const isCurrent = idx === currentIndex;
                  const isPast = idx < currentIndex;
                  const isNext = idx === currentIndex + 1;
                  const isReq = !!item.isRequest;
                  const isDraggable = !isPast && !isCurrent && !isMemberFollowing;

                  return (
                    <View
                      key={item.id || idx}
                      {...(Platform.OS === 'web' && isDraggable
                        ? {
                            draggable: true,
                            onDragStart: (e: any) => {
                              e.dataTransfer.setData('text/plain', String(idx));
                              setDraggingIndex(idx);
                            },
                            onDragOver: (e: any) => {
                              e.preventDefault();
                              if (dragOverIndex !== idx) setDragOverIndex(idx);
                            },
                            onDragLeave: () => {
                              if (dragOverIndex === idx) setDragOverIndex(null);
                            },
                            onDrop: (e: any) => {
                              e.preventDefault();
                              const fromStr = e.dataTransfer.getData('text/plain');
                              const fromIdx = fromStr !== '' ? parseInt(fromStr, 10) : draggingIndex;
                              if (fromIdx !== null && !isNaN(fromIdx) && fromIdx !== idx) {
                                moveQueueSong(fromIdx, idx);
                              }
                              setDraggingIndex(null);
                              setDragOverIndex(null);
                            },
                            onDragEnd: () => {
                              setDraggingIndex(null);
                              setDragOverIndex(null);
                            },
                          }
                        : {})}
                      style={[
                        styles.queueRow,
                        isCurrent && styles.queueRowCurrent,
                        isNext && !isCurrent && styles.queueRowNext,
                        isPast && styles.queueRowPast,
                        draggingIndex === idx && styles.queueRowDragging,
                        dragOverIndex === idx && styles.queueRowDragOver,
                      ]}
                    >
                      {/* Drag Handle Icon for Live Reordering */}
                      {isDraggable && (
                        <View style={styles.dragHandleCol}>
                          <GripVertical size={16} color="#94A3B8" />
                        </View>
                      )}

                      <Text style={[styles.queueIndex, isCurrent && { color: '#FFFFFF' }]}>
                        {isPast ? '✓' : String(idx + 1).padStart(2, '0')}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        disabled={isMemberFollowing || isCurrent}
                        onPress={() => jumpToSong(idx)}
                        style={{ flex: 1, paddingVertical: 2 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[styles.queueSongTitle, isCurrent && { color: '#FFFFFF' }]}
                            numberOfLines={1}
                          >
                            {item.song?.title || 'Untitled'}
                          </Text>
                          {isReq && (
                            <View style={styles.requestInlineTag}>
                              <Text style={styles.requestInlineTagText}>REQUEST</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.queueSongMeta,
                            isCurrent && { color: '#D1FAE5' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.song?.artist || 'Unknown'} • Key {item.song?.original_key || '-'}
                        </Text>
                      </TouchableOpacity>

                      {isCurrent ? (
                        <View style={styles.queueBadgeNow}>
                          <Text style={styles.queueBadgeNowText}>NOW</Text>
                        </View>
                      ) : (
                        <View style={styles.queueControlsRow}>
                          {isNext && (
                            <View style={styles.queueBadgeNext}>
                              <Text style={styles.queueBadgeNextText}>UP NEXT</Text>
                            </View>
                          )}

                          {!isPast && !isMemberFollowing && (
                            <>
                              {/* 1-Tap Make Next button if further down */}
                              {idx > currentIndex + 1 && (
                                <TouchableOpacity
                                  onPress={() => makeUpNext(idx)}
                                  style={styles.queuePromoteBtn}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <CornerDownRight size={11} color="#059669" />
                                  <Text style={styles.queuePromoteText}>Next</Text>
                                </TouchableOpacity>
                              )}

                              {/* 1-Tap Play Now button to skip directly */}
                              <TouchableOpacity
                                onPress={() => jumpToSong(idx)}
                                style={styles.queuePlayNowBtn}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Zap size={11} color="#065F46" />
                                <Text style={styles.queuePlayNowText}>Skip To</Text>
                              </TouchableOpacity>

                              {/* ▲ / ▼ Reordering */}
                              <View style={styles.queueMoveCol}>
                                <TouchableOpacity
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  disabled={idx <= currentIndex + 1}
                                  onPress={() => moveQueueSong(idx, idx - 1)}
                                  style={[styles.queueMoveBtn, idx <= currentIndex + 1 && { opacity: 0.25 }]}
                                >
                                  <Text style={styles.queueMoveText}>▲</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  disabled={idx >= songsList.length - 1}
                                  onPress={() => moveQueueSong(idx, idx + 1)}
                                  style={[styles.queueMoveBtn, idx >= songsList.length - 1 && { opacity: 0.25 }]}
                                >
                                  <Text style={styles.queueMoveText}>▼</Text>
                                </TouchableOpacity>
                              </View>

                              {/* Remove / Skip button */}
                              <TouchableOpacity
                                onPress={() => removeQueueSong(idx)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                style={styles.queueRemoveBtn}
                              >
                                <Trash2 size={13} color="#94A3B8" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  compactSongPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    maxWidth: '45%',
  },
  compactSongTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: 'DM Sans',
    flexShrink: 1,
  },
  compactKeyTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  compactKeyText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  fontSizeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fontSizeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
    fontFamily: 'DM Sans',
  },
  fontSizeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  fontSizeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono',
  },
  hideTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  hideTopBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  hideTopBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    fontFamily: 'DM Sans',
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  importHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  importHeaderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    fontFamily: 'DM Sans',
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
    gap: 6,
  },
  transposeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transposeStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transposeStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    fontFamily: 'JetBrains Mono',
  },
  keyBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  keyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    fontFamily: 'JetBrains Mono',
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
    paddingTop: 28,
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
    maxWidth: 680,
    gap: 24,
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
  chordLineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  chordSegmentCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  stageChordText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'JetBrains Mono',
    lineHeight: 20,
    paddingRight: 6,
  },
  stageLyricWithChordText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'DM Sans',
    lineHeight: 26,
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
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  importCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
  },
  importCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  fallbackHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
    marginTop: 4,
  },
  searchButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  footerUpNextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  footerUpNextBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footerUpNextBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerUpNextTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    maxWidth: 220,
  },
  footerUpNextArtist: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    maxWidth: 160,
  },
  footerUpNextKeyBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footerUpNextKeyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    fontFamily: 'JetBrains Mono',
  },
  footerUpNextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerUpNextActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  nextSongBtnSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    maxWidth: 90,
    textAlign: 'center',
    marginTop: 2,
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
  cueToast: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cueToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  countInOverlay: {
    position: 'absolute',
    top: 90,
    left: '50%',
    transform: [{ translateX: -70 }],
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  countInText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  countInSub: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: 'DM Sans',
  },
  syncedMemberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#10B981',
    width: '100%',
  },
  syncedMemberText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  nextSongBadgeRow: {
    marginTop: 2,
  },
  queueOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  queueSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: { fontSize: 20, fontWeight: '800', color: '#064E3B' },
  queueSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  queueClose: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  queueCloseText: { color: '#10B981', fontWeight: '800', fontSize: 12 },
  queueBadgeRequest: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  queueBadgeRequestText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  requestNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  requestNoticeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  requestSearchContainer: {
    marginBottom: 12,
  },
  requestSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  requestSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#064E3B',
    fontWeight: '600',
    padding: 0,
  },
  requestClearBtn: {
    padding: 4,
  },
  searchResultsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    gap: 10,
  },
  searchSection: {
    gap: 6,
  },
  searchSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },
  searchResultMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  searchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnPlayNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnPlayNextText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
  btnPlayNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnPlayNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  searchLoadingText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  customRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customRequestTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  customRequestSub: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
  queueListSection: {
    marginTop: 4,
  },
  queueListSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 1,
    marginBottom: 8,
  },
  queueEmpty: { color: '#64748B', textAlign: 'center', paddingVertical: 30, lineHeight: 22 },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 8,
  },
  queueRowCurrent: { backgroundColor: '#10B981', borderColor: '#10B981' },
  queueRowNext: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  queueRowPast: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  queueIndex: { fontSize: 13, fontWeight: '800', color: '#10B981', width: 24 },
  queueSongTitle: { fontSize: 15, fontWeight: '800', color: '#064E3B' },
  queueSongMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  requestInlineTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requestInlineTagText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  queueBadgeNow: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueBadgeNowText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  queueBadgeNext: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueBadgeNextText: { color: '#B45309', fontSize: 10, fontWeight: '900' },
  queueControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queuePromoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queuePromoteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  queuePlayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queuePlayNowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  queueMoveCol: { flexDirection: 'row', gap: 4 },
  queueMoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueMoveText: { color: '#10B981', fontSize: 11, fontWeight: '900' },
  queueRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  emptyStageView: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStageTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    color: '#064E3B',
    textAlign: 'center',
  },
  emptyStageSubtitle: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  bpmGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bpmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bpmBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: 'JetBrains Mono',
  },
  tapSubText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  autoScrollPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  autoScrollToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  autoScrollToggleBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  autoScrollToggleText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  speedPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  speedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    fontFamily: 'JetBrains Mono',
  },
  playerHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playerHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
    flexShrink: 1,
  },
  playerOpenYtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  playerOpenYtText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  playerLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#022C22',
  },
  playerLoadingText: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '600',
    textAlign: 'center',
  },
  ytSearchFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  ytSearchFallbackText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerCloseBtn: {
    padding: 3,
    borderRadius: 4,
  },
  footerTogglePlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  footerTogglePlayerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  dragHandleCol: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    cursor: 'grab' as any,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueRowDragging: {
    opacity: 0.4,
    borderStyle: 'dashed',
    borderColor: '#10B981',
  },
  queueRowDragOver: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
});
