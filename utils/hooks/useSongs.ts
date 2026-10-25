import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUser } from '../supabase';
import { searchSongs, SongResult, getLyrics } from '../musicApi';
import { Alert } from 'react-native';

const LOCAL_CHART_PREFIX = 'tukarta_chart_';

export async function saveLocalChartCache(songId: string, payload: { plain_lyrics: string; synced_lyrics?: any; provider?: string }) {
  try {
    await AsyncStorage.setItem(
      `${LOCAL_CHART_PREFIX}${songId}`,
      JSON.stringify({
        song_id: songId,
        plain_lyrics: payload.plain_lyrics,
        synced_lyrics: payload.synced_lyrics || null,
        provider: payload.provider || 'user_import',
        updated_at: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore storage write errors
  }
}

export async function getLocalChartCache(songId: string) {
  try {
    const raw = await AsyncStorage.getItem(`${LOCAL_CHART_PREFIX}${songId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (val: any): boolean => typeof val === 'string' && UUID_REGEX.test(val);

export function useSongLyrics(songId: string, artist: string, title: string) {
  return useQuery({
    queryKey: ['lyrics', songId, title, artist],
    queryFn: async () => {
      // 1. Check Offline Local Device Cache first (instant 0ms in Stage Mode, prioritized if user-imported)
      const localCached = await getLocalChartCache(songId);
      if (localCached && localCached.provider === 'user_import' && localCached.plain_lyrics) {
        return localCached;
      }

      // 2. Check Supabase Cache (Only for real UUID song records; demo songs bypass remote DB)
      if (isUuid(songId)) {
        try {
          const { data: cached } = await supabase
            .from('lyrics_cache')
            .select('*')
            .eq('song_id', songId)
            .maybeSingle();

          if (cached && cached.plain_lyrics && new Date(cached.expires_at) > new Date()) {
            await saveLocalChartCache(songId, {
              plain_lyrics: cached.plain_lyrics,
              synced_lyrics: cached.synced_lyrics,
              provider: cached.provider || 'lrclib',
            });
            return cached;
          }
        } catch {
          // Fall through to local or LRCLIB
        }
      }

      if (localCached && localCached.plain_lyrics) {
        return localCached;
      }

      // 3. Fetch from LRCLIB (with automatic fuzzy & lyrics.ovh fallback)
      const lyricsData = await getLyrics(artist, title);
      if (!lyricsData || (!lyricsData.plainLyrics && !lyricsData.syncedLyrics)) {
        return null;
      }

      const result = {
        song_id: songId,
        plain_lyrics: lyricsData.plainLyrics,
        synced_lyrics: lyricsData.syncedLyrics,
        provider: 'lrclib',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Save locally for offline gig mode
      await saveLocalChartCache(songId, {
        plain_lyrics: result.plain_lyrics || '',
        synced_lyrics: result.synced_lyrics,
        provider: 'lrclib',
      });

      // 4. Update Supabase Cache (only if valid UUID)
      if (isUuid(songId)) {
        try {
          await supabase.from('lyrics_cache').upsert(result, { onConflict: 'song_id' });
        } catch {
          // Silently continue
        }
      }

      return result;
    },
    enabled: !!songId && !!title,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours: lyrics don't change
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useSearchSongs(query: string) {
  return useQuery({
    queryKey: ['songs', 'search', query],
    queryFn: () => searchSongs(query),
    enabled: query.trim().length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes cache for song searches
  });
}

export function useAddSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (song: Omit<SongResult, 'id'>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Try to find the song or insert it
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .upsert(
          {
            title: song.title.trim(),
            artist: (song.artist || 'Unknown Artist').trim(),
            genre: song.genre || 'OPM',
            added_by: user.id,
          },
          { onConflict: 'title, artist' }
        )
        .select()
        .single();

      if (songError) throw songError;

      // 2. Add to user's knowledge
      const { error: knowledgeError } = await supabase
        .from('musician_song_knowledge')
        .upsert(
          {
            musician_id: user.id,
            song_id: songData.id,
            confidence_level: 3,
            can_perform_live: true,
            source: 'manual',
            genre: song.genre || 'OPM',
          },
          { onConflict: 'musician_id, song_id' }
        );

      if (knowledgeError) throw knowledgeError;

      // 3. If LRCLIB already returned lyrics during search, cache them immediately!
      if (song.plainLyrics || song.syncedLyrics) {
        const cachePayload = {
          song_id: songData.id,
          plain_lyrics: song.plainLyrics || '',
          synced_lyrics: song.syncedLyrics || null,
          provider: 'lrclib',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        await saveLocalChartCache(songData.id, cachePayload);
        try {
          await supabase.from('lyrics_cache').upsert(cachePayload, { onConflict: 'song_id' });
        } catch {
          // Ignore RLS update issues
        }
      }

      return songData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
      queryClient.invalidateQueries({ queryKey: ['my-known-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-stats'] });
    },
  });
}

export interface ImportChordSheetPayload {
  title: string;
  artist: string;
  key?: string;
  bpm?: number;
  capo?: number;
  genre?: string;
  chordProText: string;
  sourceType?: 'user_import' | 'file_import';
}

/**
 * Saves a user-imported Chord Sheet / Tab into the user's personal repertoire & offline cache
 * (DMCA Safe Harbor compliant: user-imported personal practice arrangement).
 */
export function useImportChordSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ImportChordSheetPayload) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const cleanTitle = payload.title.trim();
      const cleanArtist = (payload.artist || 'Unknown Artist').trim();

      // 1. Find existing song or insert it
      let songData: any = null;
      const { data: existingSong } = await supabase
        .from('songs')
        .select('*')
        .ilike('title', cleanTitle)
        .ilike('artist', cleanArtist)
        .maybeSingle();

      if (existingSong) {
        // Update key/bpm if provided
        const { data: updatedSong, error: updateSongError } = await supabase
          .from('songs')
          .update({
            genre: payload.genre || existingSong.genre || 'OPM',
            original_key: payload.key || existingSong.original_key || 'C',
            bpm: payload.bpm || existingSong.bpm || null,
          })
          .eq('id', existingSong.id)
          .select()
          .single();

        songData = updatedSong || existingSong;
      } else {
        const { data: newSong, error: insertError } = await supabase
          .from('songs')
          .insert({
            title: cleanTitle,
            artist: cleanArtist,
            genre: payload.genre || 'OPM',
            original_key: payload.key || 'C',
            bpm: payload.bpm || null,
            added_by: user.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Song insert error:', insertError);
          throw insertError;
        }
        songData = newSong;
      }

      if (!songData?.id) throw new Error('Failed to resolve song record');

      // 2. Link to musician's personal repertoire
      const { error: knowledgeError } = await supabase
        .from('musician_song_knowledge')
        .upsert(
          {
            musician_id: user.id,
            song_id: songData.id,
            confidence_level: 5,
            can_perform_live: true,
            source: payload.sourceType || 'user_import',
            genre: payload.genre || 'OPM',
          },
          { onConflict: 'musician_id, song_id' }
        );

      if (knowledgeError) throw knowledgeError;

      // 3. Save full ChordPro sheet locally for guaranteed offline Stage Mode
      await saveLocalChartCache(songData.id, {
        plain_lyrics: payload.chordProText,
        synced_lyrics: {
          capo: payload.capo || 0,
          original_key: payload.key || 'C',
          imported_by: user.id,
          imported_at: new Date().toISOString(),
        },
        provider: 'user_import',
      });

      // 4. Sync to Supabase lyrics_cache
      try {
        const cacheRow = {
          song_id: songData.id,
          plain_lyrics: payload.chordProText,
          synced_lyrics: {
            capo: payload.capo || 0,
            original_key: payload.key || 'C',
            imported_by: user.id,
          },
          provider: 'user_import',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Check if row already exists in lyrics_cache
        const { data: existingCache } = await supabase
          .from('lyrics_cache')
          .select('id')
          .eq('song_id', songData.id)
          .maybeSingle();

        if (existingCache) {
          const { error: updErr } = await supabase
            .from('lyrics_cache')
            .update({
              plain_lyrics: cacheRow.plain_lyrics,
              synced_lyrics: cacheRow.synced_lyrics,
              provider: cacheRow.provider,
              expires_at: cacheRow.expires_at,
            })
            .eq('song_id', songData.id);

          if (updErr) {
            console.warn('Could not update lyrics_cache remotely, falling back to local storage:', updErr.message);
          }
        } else {
          const { error: insErr } = await supabase
            .from('lyrics_cache')
            .insert(cacheRow);

          if (insErr) {
            console.warn('Could not insert lyrics_cache remotely, falling back to local storage:', insErr.message);
          }
        }
      } catch (e) {
        // Local AsyncStorage cache already has it safe & offline-ready
        console.warn('Supabase remote lyrics_cache sync skipped (offline cached):', e);
      }

      return songData;
    },
    onSuccess: (songData) => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
      queryClient.invalidateQueries({ queryKey: ['my-known-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-stats'] });
      if (songData?.id) {
        queryClient.invalidateQueries({ queryKey: ['lyrics', songData.id] });
      }
    },
  });
}

export function useInfiniteMySongs(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['my-songs', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('musician_song_knowledge')
        .select(`
          confidence_level,
          can_perform_live,
          source,
          genre,
          song:songs (
            id,
            title,
            artist,
            genre,
            original_key,
            bpm
          )
        `)
        .eq('musician_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length : undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes fresh
  });
}

export function useAddMultipleSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songs: Array<{ title: string; artist: string; genre: string }>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Pre-process and normalize in-memory to prevent duplicates in the batch
      const normalizedSongs = songs.map((s) => ({
        title: s.title.trim(),
        artist: (s.artist || 'Unknown Artist').trim(),
        added_by: user.id,
      }));

      // Unique-ify by title and artist (normalized)
      const uniqueToSave = Array.from(
        new Map(normalizedSongs.map((s) => [`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`, s])).values()
      );

      // 2. Batch Upsert into Songs table
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .upsert(uniqueToSave, {
          onConflict: 'title, artist',
          ignoreDuplicates: false,
        })
        .select('id');

      if (songError) {
        console.error('Batch song upsert failed:', songError);
        throw songError;
      }

      if (!songData || songData.length === 0) return;

      // 3. Batch Upsert into Musician Song Knowledge
      const knowledgeToSave = songData.map((song, idx) => ({
        musician_id: user.id,
        song_id: song.id,
        confidence_level: 5,
        can_perform_live: true,
        source: 'screenshot',
        genre: songs[idx]?.genre || 'Music',
      }));

      const { error: knowledgeError } = await supabase
        .from('musician_song_knowledge')
        .upsert(knowledgeToSave, { onConflict: 'musician_id, song_id' });

      if (knowledgeError) {
        console.error('Batch knowledge upsert failed:', knowledgeError);
        throw knowledgeError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
      queryClient.invalidateQueries({ queryKey: ['my-known-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-stats'] });
    },
  });
}

export function useAnalyzeScreenshot() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.functions.invoke('extract-songs', {
        body: { filePath },
      });

      if (error) throw error;
      return data.songs as Array<{ title: string; artist: string; genre: string }>;
    },
  });
}

export function useUpdateSongArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      songId,
      artist,
      title,
      setlistId,
      position,
    }: {
      songId: string;
      artist: string;
      title: string;
      setlistId?: string;
      position?: number;
    }) => {
      const { data: targetSong, error: songError } = await supabase
        .from('songs')
        .upsert({ title, artist }, { onConflict: 'title, artist' })
        .select('id')
        .single();

      if (songError) throw songError;
      if (!targetSong) throw new Error('Failed to resolve song');

      if (setlistId) {
        if (targetSong.id !== songId) {
          await supabase
            .from('setlist_songs')
            .delete()
            .eq('setlist_id', setlistId)
            .eq('song_id', songId);

          const { error: upsertError } = await supabase
            .from('setlist_songs')
            .upsert(
              {
                setlist_id: setlistId,
                song_id: targetSong.id,
                position: position || 1,
              },
              { onConflict: 'setlist_id, song_id' }
            );

          if (upsertError) throw upsertError;
        }
      }

      return { success: true, songId: targetSong.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
      queryClient.invalidateQueries({ queryKey: ['setlist-songs'] });
      queryClient.invalidateQueries({ queryKey: ['lyrics'] });
    },
  });
}

export function useDeleteMySong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('musician_song_knowledge')
        .delete()
        .eq('musician_id', user.id)
        .eq('song_id', songId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
      queryClient.invalidateQueries({ queryKey: ['my-known-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-stats'] });
    },
    onError: (error) => {
      console.error('Failed to delete song:', error);
      Alert.alert('Error', 'Failed to remove song. Please try again.');
    },
  });
}
