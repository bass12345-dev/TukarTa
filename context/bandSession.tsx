import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from './auth';
import {
  LocalP2PManager,
  testInternetReachable,
  HOTSPOT_PRESETS,
  HybridSyncMessage,
} from '../utils/hybridSyncEngine';

export type MemberRole = 'leader' | 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'horns' | 'other';
export type SyncMode = 'cloud' | 'hotspot' | 'hybrid';

export interface BandMember {
  id: string;
  name: string;
  role: MemberRole;
  isLeader?: boolean;
  joinedAt: number;
  lastSeen: number;
  transport?: 'cloud' | 'hotspot_p2p' | 'local';
}

export interface SyncSongPayload {
  songId: string;
  title: string;
  artist: string;
  key: string;
  originalKey?: string;
  transposeSteps?: number;
  plain_lyrics?: string;
  provider?: string;
  notes?: string;
  index: number;
  totalSongs: number;
}

export interface SyncNextSongPayload {
  title: string;
  artist: string;
  key: string;
}

export interface BandSessionContextType {
  // Session State
  sessionCode: string | null;
  gigName: string | null;
  setlistId: string | null;
  isLeader: boolean;
  connected: boolean;
  syncMode: SyncMode;
  isOfflineHotspot: boolean;
  leaderHostIp: string | null;
  hotspotToken: string | null;
  localPeerCount: number;
  myName: string;
  myRole: MemberRole;
  members: BandMember[];
  
  // Realtime Live Song & Cues
  currentSong: SyncSongPayload | null;
  nextSong: SyncNextSongPayload | null;
  isPlaying: boolean;
  activeCue: string | null;
  countInNumber: number | null;
  
  // Actions
  startSession: (params: {
    gigName?: string;
    setlistId?: string;
    leaderName?: string;
    mode?: SyncMode;
    hostIp?: string;
  }) => Promise<string>;
  joinSession: (
    code: string,
    memberInfo: {
      name: string;
      role: MemberRole;
      useHotspot?: boolean;
      hostIp?: string;
    }
  ) => Promise<boolean>;
  switchToHotspot: (gatewayIp?: string) => Promise<void>;
  switchToCloud: () => Promise<void>;
  leaveSession: () => Promise<void>;
  broadcastSong: (song: SyncSongPayload, next?: SyncNextSongPayload) => void;
  broadcastPlayback: (isPlaying: boolean, cue?: string) => void;
  broadcastCountIn: (bpm?: number) => void;
  muteOthers: () => void;
  resyncAll: () => void;
}

const BandSessionContext = createContext<BandSessionContextType | undefined>(undefined);

const OFFLINE_SESSION_STORAGE_KEY = '@tukarta_band_session_state';
const DEVICE_ID_KEY = '@tukarta_device_id';

export function BandSessionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [gigName, setGigName] = useState<string | null>(null);
  const [setlistId, setSetlistId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [myName, setMyName] = useState<string>('Musician');
  const [myRole, setMyRole] = useState<MemberRole>('guitar');
  const [members, setMembers] = useState<BandMember[]>([]);

  // Hybrid Cloud + Local Hotspot state
  const [syncMode, setSyncMode] = useState<SyncMode>('hybrid');
  const [isOfflineHotspot, setIsOfflineHotspot] = useState<boolean>(false);
  const [leaderHostIp, setLeaderHostIp] = useState<string | null>(null);
  const [hotspotToken, setHotspotToken] = useState<string | null>(null);
  const [localPeerCount, setLocalPeerCount] = useState<number>(0);

  const [currentSong, setCurrentSong] = useState<SyncSongPayload | null>(null);
  const [nextSong, setNextSong] = useState<SyncNextSongPayload | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [countInNumber, setCountInNumber] = useState<number | null>(null);

  const channelRef = useRef<any>(null);
  const localBcRef = useRef<any>(null);
  const localP2PRef = useRef<LocalP2PManager | null>(null);
  const deviceIdRef = useRef<string>('');
  const countInTimerRef = useRef<any>(null);

  // Initialize unique device id
  useEffect(() => {
    (async () => {
      try {
        let storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!storedId) {
          storedId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
          await AsyncStorage.setItem(DEVICE_ID_KEY, storedId);
        }
        deviceIdRef.current = storedId;

        // Try restoring last cached session in case of brief disconnect
        const cached = await AsyncStorage.getItem(OFFLINE_SESSION_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.sessionCode && Date.now() - (parsed.savedAt || 0) < 1000 * 60 * 60 * 3) {
            // Restore song info for offline viewing
            setCurrentSong(parsed.currentSong || null);
            setNextSong(parsed.nextSong || null);
            setGigName(parsed.gigName || null);
            setSetlistId(parsed.setlistId || null);
          }
        }
      } catch (e) {
        console.warn('Failed to initialize device id or restore session:', e);
      }
    })();
  }, []);

  // Save state whenever currentSong changes for offline durability
  useEffect(() => {
    if (sessionCode || currentSong) {
      AsyncStorage.setItem(
        OFFLINE_SESSION_STORAGE_KEY,
        JSON.stringify({
          sessionCode,
          gigName,
          setlistId,
          isLeader,
          currentSong,
          nextSong,
          savedAt: Date.now(),
        })
      ).catch((e) => console.warn('Could not cache session:', e));
    }
  }, [sessionCode, gigName, setlistId, isLeader, currentSong, nextSong]);

  // Clean up channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (countInTimerRef.current) {
        clearInterval(countInTimerRef.current);
      }
    };
  }, []);

  // Helper to trigger count-in animation
  const triggerCountInAnimation = useCallback(() => {
    if (countInTimerRef.current) clearInterval(countInTimerRef.current);
    let count = 4;
    setCountInNumber(count);

    countInTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountInNumber(count);
      } else {
        setCountInNumber(null);
        clearInterval(countInTimerRef.current);
      }
    }, 600);
  }, []);

  /**
   * Start a Live Session as Band Leader (Hybrid Cloud + Hotspot P2P)
   */
  const startSession = async ({
    gigName: gName,
    setlistId: sId,
    leaderName,
    mode = 'hybrid',
    hostIp,
  }: {
    gigName?: string;
    setlistId?: string;
    leaderName?: string;
    mode?: SyncMode;
    hostIp?: string;
  }): Promise<string> => {
    // Generate clean 4-character code e.g. 'TUK4', 'LIVE', 'JAM8'
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TK-';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    const name = leaderName || user?.user_metadata?.name || 'Leader';
    const resolvedGatewayIp = hostIp || (Platform.OS === 'ios' ? '172.20.10.1' : '192.168.43.1');

    setSessionCode(code);
    setGigName(gName || 'Live Gig Session');
    setSetlistId(sId || null);
    setIsLeader(true);
    setMyName(name);
    setMyRole('leader');
    setConnected(true);
    setLeaderHostIp(resolvedGatewayIp);

    const leaderMember: BandMember = {
      id: deviceIdRef.current || 'leader',
      name,
      role: 'leader',
      isLeader: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      transport: mode === 'hotspot' ? 'hotspot_p2p' : 'cloud',
    };
    setMembers([leaderMember]);

    // 1. Initialize Local P2P Manager (Zero-Internet Hotspot Engine)
    if (localP2PRef.current) localP2PRef.current.close();
    const p2p = new LocalP2PManager(
      true,
      (msg: HybridSyncMessage) => {
        if (msg.event === 'REQUEST_CURRENT_SONG' && currentSong) {
          p2p.send({
            event: 'SONG_SELECTED',
            payload: { song: currentSong, nextSong, sentAt: Date.now() },
            sentAt: Date.now(),
          });
        }
      },
      (isConnected, peerCount) => {
        setLocalPeerCount(peerCount);
        if (peerCount > 0) {
          setMembers((prev) => {
            const hasLocalPeer = prev.some((m) => m.id.startsWith('local_peer'));
            if (!hasLocalPeer) {
              return [
                ...prev,
                {
                  id: `local_peer_${Date.now()}`,
                  name: `Hotspot Peer (${peerCount})`,
                  role: 'guitar',
                  joinedAt: Date.now(),
                  lastSeen: Date.now(),
                  transport: 'hotspot_p2p',
                },
              ];
            }
            return prev;
          });
        }
      }
    );
    localP2PRef.current = p2p;

    // Generate local Hotspot Token (for QR / pairing without internet)
    p2p.createHostOffer(code).then((token) => {
      setHotspotToken(token);
    });

    // 2. Initialize in-browser BroadcastChannel (for desktop / same-device tabs)
    const channelName = `band_room_${code.replace(/[^A-Za-z0-9]/g, '')}`;
    if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
      if (localBcRef.current) localBcRef.current.close();
      const bc = new (window as any).BroadcastChannel(channelName);
      bc.onmessage = (ev: any) => {
        if (ev.data?.event === 'REQUEST_CURRENT_SONG' && currentSong) {
          bc.postMessage({
            event: 'SONG_SELECTED',
            payload: { song: currentSong, nextSong, sentAt: Date.now() },
          });
        }
      };
      localBcRef.current = bc;
    }

    // 3. Check Internet Connectivity for Cloud Channel
    let hasInternet = false;
    if (mode !== 'hotspot') {
      hasInternet = await testInternetReachable(2000);
    }

    if (hasInternet && mode !== 'hotspot') {
      setSyncMode('hybrid');
      setIsOfflineHotspot(false);

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: deviceIdRef.current || 'leader' },
        },
      });

      channel.on('broadcast', { event: 'REQUEST_CURRENT_SONG' }, () => {
        if (currentSong) {
          channel.send({
            type: 'broadcast',
            event: 'SONG_SELECTED',
            payload: { song: currentSong, nextSong, sentAt: Date.now() },
          });
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineMembers: BandMember[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.name) {
              onlineMembers.push({
                id: p.id || p.key,
                name: p.name,
                role: p.role || 'other',
                isLeader: !!p.isLeader,
                joinedAt: p.joinedAt || Date.now(),
                lastSeen: Date.now(),
                transport: 'cloud',
              });
            }
          });
        });
        if (onlineMembers.length > 0) {
          setMembers((prev) => {
            const localPeers = prev.filter((m) => m.transport === 'hotspot_p2p');
            return [...onlineMembers, ...localPeers];
          });
        }
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: deviceIdRef.current || 'leader',
            name,
            role: 'leader',
            isLeader: true,
            joinedAt: Date.now(),
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Cloud channel subscription error, auto-switching to Hotspot P2P');
          setIsOfflineHotspot(true);
          setSyncMode('hotspot');
        }
      });

      channelRef.current = channel;
    } else {
      setSyncMode('hotspot');
      setIsOfflineHotspot(true);
      console.log('Started session in 0-Internet Hotspot mode');
    }

    return code;
  };

  /**
   * Join a Live Session as Band Member (Hybrid Cloud + Hotspot P2P)
   */
  const joinSession = async (
    codeOrToken: string,
    memberInfo: {
      name: string;
      role: MemberRole;
      useHotspot?: boolean;
      hostIp?: string;
    }
  ): Promise<boolean> => {
    try {
      const cleanInput = codeOrToken.trim();
      const isToken = cleanInput.length > 30;
      const isHotspotMode = !!memberInfo.useHotspot || isToken;
      const cleanCode = isToken ? 'TK-HOT' : cleanInput.toUpperCase();
      const channelName = `band_room_${cleanCode.replace(/[^A-Za-z0-9]/g, '')}`;

      setSessionCode(cleanCode);
      setIsLeader(false);
      setMyName(memberInfo.name);
      setMyRole(memberInfo.role);

      const resolvedGatewayIp = memberInfo.hostIp || (Platform.OS === 'ios' ? '172.20.10.1' : '192.168.43.1');
      setLeaderHostIp(resolvedGatewayIp);

      // 1. Initialize Local P2P follower
      if (localP2PRef.current) localP2PRef.current.close();
      const p2p = new LocalP2PManager(
        false,
        (msg: HybridSyncMessage) => {
          if (msg.event === 'SONG_SELECTED' && msg.payload?.song) {
            setCurrentSong(msg.payload.song);
            setNextSong(msg.payload.nextSong || null);
            setActiveCue(`Switched to ${msg.payload.song.title}`);
            setTimeout(() => setActiveCue(null), 3500);
          } else if (msg.event === 'PLAYBACK_CHANGE') {
            if (typeof msg.payload?.isPlaying === 'boolean') {
              setIsPlaying(msg.payload.isPlaying);
            }
          } else if (msg.event === 'CUE_COUNT_IN') {
            triggerCountInAnimation();
          }
        },
        (isConnected, peerCount) => {
          setConnected(isConnected);
          setLocalPeerCount(peerCount);
        }
      );
      localP2PRef.current = p2p;

      // If token provided, join WebRTC directly
      if (isToken) {
        const answer = await p2p.joinHostWithOffer(cleanInput);
        if (answer) {
          setIsOfflineHotspot(true);
          setSyncMode('hotspot');
          setConnected(true);
          return true;
        }
      }

      // 2. In-browser BroadcastChannel (desktop / single machine testing)
      if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
        if (localBcRef.current) localBcRef.current.close();
        const bc = new (window as any).BroadcastChannel(channelName);
        bc.onmessage = (ev: any) => {
          if (ev.data?.event === 'SONG_SELECTED' && ev.data?.payload?.song) {
            setCurrentSong(ev.data.payload.song);
            setNextSong(ev.data.payload.nextSong || null);
            setActiveCue(`Switched to ${ev.data.payload.song.title}`);
            setTimeout(() => setActiveCue(null), 3500);
          } else if (ev.data?.event === 'PLAYBACK_CHANGE') {
            if (typeof ev.data.payload?.isPlaying === 'boolean') {
              setIsPlaying(ev.data.payload.isPlaying);
            }
          } else if (ev.data?.event === 'CUE_COUNT_IN') {
            triggerCountInAnimation();
          }
        };
        localBcRef.current = bc;
        bc.postMessage({ event: 'REQUEST_CURRENT_SONG', memberId: deviceIdRef.current });
      }

      // 3. If explicit Hotspot mode requested
      if (isHotspotMode) {
        setIsOfflineHotspot(true);
        setSyncMode('hotspot');
        setConnected(true);
        return true;
      }

      // 4. Try Cloud Supabase connection
      const hasNet = await testInternetReachable(2000);
      if (!hasNet) {
        setIsOfflineHotspot(true);
        setSyncMode('hotspot');
        setConnected(true);
        return true;
      }

      setSyncMode('hybrid');
      setIsOfflineHotspot(false);

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: deviceIdRef.current || 'member_' + Date.now() },
        },
      });

      channel.on('broadcast', { event: 'SONG_SELECTED' }, ({ payload }) => {
        if (payload?.song) {
          setCurrentSong(payload.song);
          setNextSong(payload.nextSong || null);
          setActiveCue(`Switched to ${payload.song.title}`);
          setTimeout(() => setActiveCue(null), 3500);
        }
      });

      channel.on('broadcast', { event: 'PLAYBACK_CHANGE' }, ({ payload }) => {
        if (typeof payload?.isPlaying === 'boolean') {
          setIsPlaying(payload.isPlaying);
        }
        if (payload?.cue) {
          setActiveCue(payload.cue);
          setTimeout(() => setActiveCue(null), 3000);
        }
      });

      channel.on('broadcast', { event: 'CUE_COUNT_IN' }, () => {
        triggerCountInAnimation();
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineMembers: BandMember[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.name) {
              onlineMembers.push({
                id: p.id || p.key,
                name: p.name,
                role: p.role || 'other',
                isLeader: !!p.isLeader,
                joinedAt: p.joinedAt || Date.now(),
                lastSeen: Date.now(),
                transport: 'cloud',
              });
            }
          });
        });
        if (onlineMembers.length > 0) {
          setMembers(onlineMembers);
        }
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          await channel.track({
            id: deviceIdRef.current || 'member_' + Date.now(),
            name: memberInfo.name,
            role: memberInfo.role,
            isLeader: false,
            joinedAt: Date.now(),
          });

          channel.send({
            type: 'broadcast',
            event: 'REQUEST_CURRENT_SONG',
            payload: { memberId: deviceIdRef.current },
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsOfflineHotspot(true);
          setSyncMode('hotspot');
          setConnected(true);
        }
      });

      channelRef.current = channel;
      return true;
    } catch (e) {
      console.warn('Error in joinSession, falling back to local hotspot:', e);
      setIsOfflineHotspot(true);
      setSyncMode('hotspot');
      setConnected(true);
      return true;
    }
  };

  /**
   * Leave Session
   */
  const leaveSession = async () => {
    if (localP2PRef.current) {
      localP2PRef.current.close();
      localP2PRef.current = null;
    }
    if (localBcRef.current) {
      localBcRef.current.close();
      localBcRef.current = null;
    }
    if (channelRef.current) {
      try {
        await channelRef.current.untrack();
        await supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.warn('Error during leaveSession:', e);
      }
    }
    channelRef.current = null;
    setSessionCode(null);
    setConnected(false);
    setIsLeader(false);
    setIsOfflineHotspot(false);
    setHotspotToken(null);
    setLocalPeerCount(0);
    setMembers([]);
    setCurrentSong(null);
    setNextSong(null);
    await AsyncStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY);
  };

  /**
   * Broadcast Song Change (Leader only - Hybrid Cloud + Local Hotspot P2P)
   */
  const broadcastSong = (song: SyncSongPayload, next?: SyncNextSongPayload) => {
    setCurrentSong(song);
    if (next) setNextSong(next);

    const payload = {
      song,
      nextSong: next || null,
      sentAt: Date.now(),
    };

    // 1. Send via local WebRTC P2P DataChannel (0-Internet Hotspot)
    if (localP2PRef.current && isLeader) {
      try {
        localP2PRef.current.send({
          event: 'SONG_SELECTED',
          payload,
          sentAt: Date.now(),
        });
      } catch (e) {
        console.warn('Local P2P broadcast error:', e);
      }
    }

    // 2. Send via local BroadcastChannel (same-device tabs)
    if (localBcRef.current && isLeader) {
      try {
        localBcRef.current.postMessage({
          event: 'SONG_SELECTED',
          payload,
        });
      } catch (e) {
        console.warn('Local BC broadcast error:', e);
      }
    }

    // 3. Send via Supabase Realtime (if online)
    if (channelRef.current && isLeader && !isOfflineHotspot) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'SONG_SELECTED',
        payload,
      }).catch((e: any) => {
        console.warn('Supabase broadcast failed, auto-switching to Hotspot mode:', e);
        setIsOfflineHotspot(true);
      });
    }
  };

  /**
   * Broadcast Playback State (Leader only - Hybrid Cloud + Local Hotspot P2P)
   */
  const broadcastPlayback = (playing: boolean, cue?: string) => {
    setIsPlaying(playing);

    const payload = {
      isPlaying: playing,
      cue: cue || null,
      sentAt: Date.now(),
    };

    // 1. Send via local WebRTC P2P DataChannel
    if (localP2PRef.current && isLeader) {
      try {
        localP2PRef.current.send({
          event: 'PLAYBACK_CHANGE',
          payload,
          sentAt: Date.now(),
        });
      } catch (e) {
        console.warn('Local P2P playback error:', e);
      }
    }

    // 2. Send via local BroadcastChannel
    if (localBcRef.current && isLeader) {
      try {
        localBcRef.current.postMessage({
          event: 'PLAYBACK_CHANGE',
          payload,
        });
      } catch (e) {
        console.warn('Local BC playback error:', e);
      }
    }

    // 3. Send via Supabase Realtime
    if (channelRef.current && isLeader && !isOfflineHotspot) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYBACK_CHANGE',
        payload,
      }).catch((e: any) => console.warn('Supabase playback offline fallback:', e));
    }
  };

  /**
   * Broadcast Count-In (Leader only - Hybrid Cloud + Local Hotspot P2P)
   */
  const broadcastCountIn = (bpm?: number) => {
    triggerCountInAnimation();

    const payload = {
      bpm: bpm || 120,
      sentAt: Date.now(),
    };

    // 1. Send via local WebRTC P2P DataChannel
    if (localP2PRef.current && isLeader) {
      try {
        localP2PRef.current.send({
          event: 'CUE_COUNT_IN',
          payload,
          sentAt: Date.now(),
        });
      } catch (e) {
        console.warn('Local P2P count-in error:', e);
      }
    }

    // 2. Send via local BroadcastChannel
    if (localBcRef.current && isLeader) {
      try {
        localBcRef.current.postMessage({
          event: 'CUE_COUNT_IN',
          payload,
        });
      } catch (e) {
        console.warn('Local BC count-in error:', e);
      }
    }

    // 3. Send via Supabase Realtime
    if (channelRef.current && isLeader && !isOfflineHotspot) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'CUE_COUNT_IN',
        payload,
      }).catch((e: any) => console.warn('Supabase count-in offline fallback:', e));
    }
  };

  const switchToHotspot = async (gatewayIp?: string) => {
    setIsOfflineHotspot(true);
    setSyncMode('hotspot');
    if (gatewayIp) setLeaderHostIp(gatewayIp);
  };

  const switchToCloud = async () => {
    const hasNet = await testInternetReachable(2000);
    if (hasNet) {
      setIsOfflineHotspot(false);
      setSyncMode('hybrid');
    }
  };

  /**
   * Session Controls: Mute Others & Resync
   */
  const muteOthers = () => {
    if (channelRef.current && isLeader) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYBACK_CHANGE',
        payload: { isPlaying: false, cue: 'AUDIO MUTED BY LEADER', sentAt: Date.now() },
      });
    }
  };

  const resyncAll = () => {
    if (channelRef.current && isLeader && currentSong) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'SONG_SELECTED',
        payload: { song: currentSong, nextSong, sentAt: Date.now() },
      });
    }
  };

  return (
    <BandSessionContext.Provider
      value={{
        sessionCode,
        gigName,
        setlistId,
        isLeader,
        connected,
        syncMode,
        isOfflineHotspot,
        leaderHostIp,
        hotspotToken,
        localPeerCount,
        myName,
        myRole,
        members,
        currentSong,
        nextSong,
        isPlaying,
        activeCue,
        countInNumber,
        startSession,
        joinSession,
        switchToHotspot,
        switchToCloud,
        leaveSession,
        broadcastSong,
        broadcastPlayback,
        broadcastCountIn,
        muteOthers,
        resyncAll,
      }}
    >
      {children}
    </BandSessionContext.Provider>
  );
}

export function useBandSession() {
  const context = useContext(BandSessionContext);
  if (!context) {
    throw new Error('useBandSession must be used within a BandSessionProvider');
  }
  return context;
}
