import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const LOCAL_PREFIX = 'tukarta_intro_offset_';
const MAX_OFFSET_SEC = 600;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const clampOffset = (sec: number) => Math.min(MAX_OFFSET_SEC, Math.max(0, Math.round(sec * 10) / 10));

async function readLocalOffset(songId: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(`${LOCAL_PREFIX}${songId}`);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Saves the intro offset: on this device straight away, then to the song record when it is a real
 * catalogue song. Resolves 'db' when the record was updated, 'local' when only the device copy was saved.
 */
export async function saveIntroOffset(songId: string, seconds: number): Promise<'db' | 'local'> {
  const value = clampOffset(seconds);
  try {
    await AsyncStorage.setItem(`${LOCAL_PREFIX}${songId}`, String(value));
  } catch {
    // device copy is best effort
  }
  if (!UUID_REGEX.test(songId)) return 'local';
  try {
    const { error } = await supabase.from('songs').update({ lyrics_offset_sec: value }).eq('id', songId);
    if (error) {
      console.warn('Could not save lyrics offset to the song record:', error.message);
      return 'local';
    }
    return 'db';
  } catch (e) {
    console.warn('Could not save lyrics offset to the song record:', e);
    return 'local';
  }
}

/**
 * Intro offset for a song. The value saved on this device wins; otherwise the song record's value is used.
 * `setOffset` updates the screen immediately and saves in the background.
 */
export function useIntroOffset(songId: string | undefined, savedOffset?: number | null) {
  const [offset, setOffsetState] = useState<number>(clampOffset(savedOffset ?? 0));
  const editedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    editedRef.current = false;
    setOffsetState(clampOffset(savedOffset ?? 0));
    if (!songId) return;
    (async () => {
      const local = await readLocalOffset(songId);
      if (!alive || editedRef.current || local === null) return;
      setOffsetState(clampOffset(local));
    })();
    return () => {
      alive = false;
    };
  }, [songId, savedOffset]);

  const setOffset = useCallback(
    (seconds: number) => {
      editedRef.current = true;
      const value = clampOffset(seconds);
      setOffsetState(value);
      if (songId) void saveIntroOffset(songId, value);
    },
    [songId]
  );

  return { offset, setOffset };
}
