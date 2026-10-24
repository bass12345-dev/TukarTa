import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from './auth';

export type MemberRole = 'leader' | 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'horns' | 'other';

export interface BandMember {
  id: string;
  name: string;
  role: MemberRole;
  isLeader?: boolean;
  joinedAt: number;
  lastSeen: number;
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
  startSession: (params: { gigName?: string; setlistId?: string; leaderName?: string }) => Promise<string>;
  joinSession: (code: string, memberInfo: { name: string; role: MemberRole }) => Promise<boolean>;
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

  const [currentSong, setCurrentSong] = useState<SyncSongPayload | null>(null);
  const [nextSong, setNextSong] = useState<SyncNextSongPayload | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [countInNumber, setCountInNumber] = useState<number | null>(null);

  const channelRef = useRef<any>(null);
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
   * Start a Live Session as Band Leader
   */
  const startSession = async ({
    gigName: gName,
    setlistId: sId,
    leaderName,
  }: {
    gigName?: string;
    setlistId?: string;
    leaderName?: string;
  }): Promise<string> => {
    // Generate clean 4-character code e.g. 'TUK4', 'LIVE', 'JAM8'
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TK-';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    const name = leaderName || user?.user_metadata?.name || 'Leader';
    setSessionCode(code);
    setGigName(gName || 'Live Gig Session');
    setSetlistId(sId || null);
    setIsLeader(true);
    setMyName(name);
    setMyRole('leader');
    setConnected(true);

    const leaderMember: BandMember = {
      id: deviceIdRef.current || 'leader',
      name,
      role: 'leader',
      isLeader: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };
    setMembers([leaderMember]);

    // Setup Supabase Realtime Broadcast channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channelName = `band_room_${code.replace(/[^A-Za-z0-9]/g, '')}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: deviceIdRef.current || 'leader' },
      },
    });

    // Listen for member join / song request
    channel.on('broadcast', { event: 'REQUEST_CURRENT_SONG' }, () => {
      // Re-broadcast currently selected song to the newly joined member
      if (currentSong) {
        channel.send({
          type: 'broadcast',
          event: 'SONG_SELECTED',
          payload: { song: currentSong, nextSong, sentAt: Date.now() },
        });
      }
    });

    // Presence sync for real-time member roster
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
        await channel.track({
          id: deviceIdRef.current || 'leader',
          name,
          role: 'leader',
          isLeader: true,
          joinedAt: Date.now(),
        });
      }
    });

    channelRef.current = channel;
    return code;
  };

  /**
   * Join a Live Session as Band Member
   */
  const joinSession = async (
    code: string,
    memberInfo: { name: string; role: MemberRole }
  ): Promise<boolean> => {
    try {
      const cleanCode = code.trim().toUpperCase();
      const channelName = `band_room_${cleanCode.replace(/[^A-Za-z0-9]/g, '')}`;

      setSessionCode(cleanCode);
      setIsLeader(false);
      setMyName(memberInfo.name);
      setMyRole(memberInfo.role);

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: deviceIdRef.current || 'member_' + Date.now() },
        },
      });

      // Listen for Leader's song selection
      channel.on('broadcast', { event: 'SONG_SELECTED' }, ({ payload }) => {
        if (payload?.song) {
          setCurrentSong(payload.song);
          setNextSong(payload.nextSong || null);
          setActiveCue(`Switched to ${payload.song.title}`);
          setTimeout(() => setActiveCue(null), 3500);
        }
      });

      // Listen for Play / Pause
      channel.on('broadcast', { event: 'PLAYBACK_CHANGE' }, ({ payload }) => {
        if (typeof payload?.isPlaying === 'boolean') {
          setIsPlaying(payload.isPlaying);
        }
        if (payload?.cue) {
          setActiveCue(payload.cue);
          setTimeout(() => setActiveCue(null), 3000);
        }
      });

      // Listen for Count-in trigger
      channel.on('broadcast', { event: 'CUE_COUNT_IN' }, () => {
        triggerCountInAnimation();
      });

      // Track presence
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

          // Request the current song from the leader immediately
          channel.send({
            type: 'broadcast',
            event: 'REQUEST_CURRENT_SONG',
            payload: { memberId: deviceIdRef.current },
          });
        }
      });

      channelRef.current = channel;
      return true;
    } catch (e) {
      console.error('Failed to join session:', e);
      return false;
    }
  };

  /**
   * Leave Session
   */
  const leaveSession = async () => {
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
    setMembers([]);
    setCurrentSong(null);
    setNextSong(null);
    await AsyncStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY);
  };

  /**
   * Broadcast Song Change (Leader only)
   */
  const broadcastSong = (song: SyncSongPayload, next?: SyncNextSongPayload) => {
    setCurrentSong(song);
    if (next) setNextSong(next);

    if (channelRef.current && isLeader) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'SONG_SELECTED',
        payload: {
          song,
          nextSong: next || null,
          sentAt: Date.now(),
        },
      });
    }
  };

  /**
   * Broadcast Playback State (Leader only)
   */
  const broadcastPlayback = (playing: boolean, cue?: string) => {
    setIsPlaying(playing);
    if (channelRef.current && isLeader) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYBACK_CHANGE',
        payload: {
          isPlaying: playing,
          cue: cue || null,
          sentAt: Date.now(),
        },
      });
    }
  };

  /**
   * Broadcast Count-In (Leader only)
   */
  const broadcastCountIn = (bpm?: number) => {
    triggerCountInAnimation();
    if (channelRef.current && isLeader) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'CUE_COUNT_IN',
        payload: {
          bpm: bpm || 120,
          sentAt: Date.now(),
        },
      });
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
