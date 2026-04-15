import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { searchSongs, getArtistMetadata, SongResult } from '../musicApi';

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

export function useAddMultipleSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songs: Array<{ title: string; artist: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const song of songs) {
        // Normalization for better matching
        const normalizedTitle = song.title.trim();
        const normalizedArtist = song.artist.trim();

        // 1. Intelligent Case-Insensitive Lookup
        const { data: existingSong } = await supabase
          .from('songs')
          .select('id')
          .ilike('title', normalizedTitle)
          .ilike('artist', normalizedArtist)
          .maybeSingle();

        let songId = existingSong?.id;

        if (!songId) {
          // 2. Insert if not found (using upsert as safety)
          const { data: newSong, error: songError } = await supabase
            .from('songs')
            .upsert({
              title: normalizedTitle,
              artist: normalizedArtist,
              added_by: user.id
            }, { onConflict: 'title, artist' })
            .select()
            .single();

          if (songError) continue;
          songId = newSong.id;
        }

        // 3. Add to user's knowledge (using upsert to avoid error if already linked)
        await supabase
          .from('musician_song_knowledge')
          .upsert({
            musician_id: user.id,
            song_id: songId,
            confidence_level: 5,
            can_perform_live: true,
            source: 'screenshot'
          }, { onConflict: 'musician_id, song_id' });
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
      return data.songs as Array<{ title: string; artist: string }>;
    },
  });
}
