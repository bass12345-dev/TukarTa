import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useCreateBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, genres, city, lat, lng }: { name: string; genres: string[]; city: string; lat?: number | null; lng?: number | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create the band
      const { data: band, error: bandError } = await supabase
        .from('bands')
        .insert({
          name,
          genres,
          city,
          lat,
          lng,
          leader_id: user.id
        })
        .select()
        .single();

      if (bandError) throw bandError;

      // 2. Add creator as leader member
      const { error: memberError } = await supabase
        .from('band_members')
        .insert({
          band_id: band.id,
          user_id: user.id,
          role: 'leader',
          status: 'active'
        });

      if (memberError) throw memberError;

      return band;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bands'] });
    },
  });
}

export function useDeleteBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bandId: string) => {
      const { error } = await supabase
        .from('bands')
        .delete()
        .eq('id', bandId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bands'] });
    },
  });
}

export function useInviteMusician() {
  return useMutation({
    mutationFn: async ({ bandId, musicianId, message }: { bandId: string; musicianId: string; message?: string }) => {
      const { error } = await supabase
        .from('musician_invites')
        .insert({
          from_band_id: bandId,
          to_musician_id: musicianId,
          message: message || `Hey! Join our band.`
        });
      
      if (error) throw error;
    },
  });
}

export function useMyInvites() {
  return useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('musician_invites')
        .select(`
          *,
          band:bands (
            id,
            name,
            avatar_url,
            city
          )
        `)
        .eq('to_musician_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Get invite details
      const { data: invite, error: fetchError } = await supabase
        .from('musician_invites')
        .select('*')
        .eq('id', inviteId)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. Update invite status
      const { error: inviteError } = await supabase
        .from('musician_invites')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (inviteError) throw inviteError;

      // 3. Add to band members
      const { error: memberError } = await supabase
        .from('band_members')
        .insert({
          band_id: invite.from_band_id,
          user_id: user.id,
          status: 'active'
        });

      if (memberError) throw memberError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
      queryClient.invalidateQueries({ queryKey: ['my-bands'] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('musician_invites')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
    },
  });
}

export function useBandDetails(bandId: string | undefined) {
  return useQuery({
    queryKey: ['band', bandId],
    queryFn: async () => {
      if (!bandId) return null;
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('id', bandId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!bandId,
  });
}

export function useBandMembers(bandId: string | undefined) {
  return useQuery({
    queryKey: ['band-members', bandId],
    queryFn: async () => {
      if (!bandId) return [];
      const { data, error } = await supabase
        .from('band_members')
        .select(`
          *,
          user:users (
            id,
            display_name,
            avatar_url,
            city
          )
        `)
        .eq('band_id', bandId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: !!bandId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName, city, lat, lng, bio, role, rate }: { 
      displayName?: string; 
      city?: string; 
      lat?: number | null; 
      lng?: number | null; 
      bio?: string;
      role?: string;
      rate?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update User Record
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          display_name: displayName,
          city,
          lat,
          lng,
          bio
        })
        .eq('id', user.id);
      
      if (userError) throw userError;

      // 2. Update Musician Profile Record
      if (role !== undefined || rate !== undefined) {
        const { error: musicianError } = await supabase
          .from('musician_profiles')
          .upsert({ 
            user_id: user.id,
            roles: role ? [role] : undefined,
            rate_amount: rate
          }, { onConflict: 'user_id' });

        if (musicianError) throw musicianError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['musician-profile'] });
    },
  });
}
