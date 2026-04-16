import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export function useMusicianProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['musician-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*, musician_profiles(*)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useMyBands() {
  return useQuery({
    queryKey: ['my-bands'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('band_members')
        .select(`
          id,
          role,
          band:bands (
            id,
            name,
            genres,
            member_count:band_members(count)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
  });
}

export function useSongStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['song-stats', userId],
    queryFn: async () => {
      if (!userId) return { total: 0, live: 0 };
      
      const { count, error } = await supabase
        .from('musician_song_knowledge')
        .select('*', { count: 'exact', head: true })
        .eq('musician_id', userId);

      const { count: liveCount, error: liveError } = await supabase
        .from('musician_song_knowledge')
        .select('*', { count: 'exact', head: true })
        .eq('musician_id', userId)
        .eq('can_perform_live', true);

      if (error || liveError) throw error || liveError;
      
      return {
        total: count || 0,
        live: liveCount || 0
      };
    },
    enabled: !!userId,
  });
}
