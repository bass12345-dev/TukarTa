import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { searchSongs, getArtistMetadata, SongResult, getLyrics } from '../musicApi';

// ... (existing hooks)

export function useSongLyrics(songId: string, artist: string, title: string) {
  return useQuery({
    queryKey: ['lyrics', songId],
    queryFn: async () => {
      // 1. Check Cache
      const { data: cached, error: cacheError } = await supabase
        .from('lyrics_cache')
        .select('*')
        .eq('song_id', songId)
        .maybeSingle();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return cached;
      }

      // 2. Fetch from LRCLIB
      const lyricsData = await getLyrics(artist, title);
      
      if (!lyricsData) return null;

      const result = {
        song_id: songId,
        plain_lyrics: lyricsData.plainLyrics,
        synced_lyrics: lyricsData.syncedLyrics,
        provider: 'lrclib',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // 3. Update Cache
      await supabase
        .from('lyrics_cache')
        .upsert(result, { onConflict: 'song_id' });

      return result;
    },
    enabled: !!songId && !!artist && !!title,
  });
}

export function useSearchSongs(query: string) {
  return useQuery({
    queryKey: ['songs', 'search', query],
    queryFn: () => searchSongs(query),
    enabled: query.length > 2,
  });
}

export function useAddSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (song: Omit<SongResult, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Try to find the song or insert it
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .upsert({
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          added_by: user.id
        }, { onConflict: 'title, artist' })
        .select()
        .single();

      if (songError) throw songError;

      // 2. Add to user's knowledge
      const { error: knowledgeError } = await supabase
        .from('musician_song_knowledge')
        .upsert({
          musician_id: user.id,
          song_id: songData.id,
          confidence_level: 3,
          can_perform_live: true,
          source: 'manual'
        }, { onConflict: 'musician_id, song_id' });

      if (knowledgeError) throw knowledgeError;

      return songData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-songs'] });
    },
  });
}

export function useInfiniteMySongs(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['my-songs', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
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
  });
}

export function useAddMultipleSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songs: Array<{ title: string; artist: string; genre: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Pre-process and normalize in-memory to prevent duplicates in the batch
      const normalizedSongs = songs.map(s => ({
        title: s.title.trim(),
        artist: (s.artist || 'Unknown Artist').trim(),
        added_by: user.id
      }));

      // Unique-ify by title and artist (normalized)
      const uniqueToSave = Array.from(new Map(
        normalizedSongs.map(s => [`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`, s])
      ).values());

      // 2. Batch Upsert into Songs table
      // select() returns all matching/inserted rows so we get the IDs
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .upsert(uniqueToSave, { 
          onConflict: 'title, artist',
          ignoreDuplicates: false // We want the IDs back for existing ones too
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
        genre: songs[idx].genre
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
    mutationFn: async ({ songId, artist, title, setlistId, position }: { songId: string; artist: string; title: string; setlistId?: string; position?: number }) => {
      // 1. Ensure the song with the correct title/artist exists in the catalog
      // This will either return the existing song or create a new one
      const { data: targetSong, error: songError } = await supabase
        .from('songs')
        .upsert({ title, artist }, { onConflict: 'title, artist' })
        .select('id')
        .single();

      if (songError) throw songError;
      if (!targetSong) throw new Error('Failed to resolve song');

      // 2. If it's for a setlist, update the setlist reference
      if (setlistId) {
        // If the solved song ID is different from the current one, we need to swap them
        if (targetSong.id !== songId) {
          // 1. Remove the old (incorrect/unknown) song from this setlist FIRST
          // to free up its position in the database constraint
          await supabase
            .from('setlist_songs')
            .delete()
            .eq('setlist_id', setlistId)
            .eq('song_id', songId);

          // 2. Now add/update the correct song to that position
          const { error: upsertError } = await supabase
            .from('setlist_songs')
            .upsert({
              setlist_id: setlistId,
              song_id: targetSong.id,
              position: position || 1
            }, { onConflict: 'setlist_id, song_id' });

          if (upsertError) throw upsertError;
        } else {
          // If IDs are the same, the update already happened via upsert on 'songs'
          // (though technically upsert on same ID with same values does nothing)
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
      const { data: { user } } = await supabase.auth.getUser();
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
    },
  });
}
