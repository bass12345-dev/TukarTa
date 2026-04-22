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

export function useMyGigs() {
  return useQuery({
    queryKey: ['my-gigs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch gigs from bands where user is leader or active member
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          band:bands (
            id,
            name,
            avatar_url
          )
        `)
        .order('gig_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      bandId, 
      name, 
      venue, 
      date, 
      duration = 60 
    }: { 
      bandId: string; 
      name: string; 
      venue: string; 
      date: string; 
      duration?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('gigs')
        .insert({
          band_id: bandId,
          name,
          venue,
          gig_date: date,
          duration_min: duration,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
    },
  });
}

export function useGigDetails(gigId: string | undefined) {
  return useQuery({
    queryKey: ['gig', gigId],
    queryFn: async () => {
      if (!gigId) return null;
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          band:bands (*)
        `)
        .eq('id', gigId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!gigId,
  });
}

export function useGigSetlist(gigId: string | undefined) {
  return useQuery({
    queryKey: ['gig-setlist', gigId],
    queryFn: async () => {
      if (!gigId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Try to find existing setlist
      let { data, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('gig_id', gigId)
        .eq('name', 'Main Setlist')
        .maybeSingle();

      // 2. If not found, create it
      if (!data && !error) {
        const { data: newSetlist, error: createError } = await supabase
          .from('setlists')
          .insert({
            gig_id: gigId,
            band_id: (await supabase.from('gigs').select('band_id').eq('id', gigId).single()).data?.band_id,
            name: 'Main Setlist',
            created_by: user.id
          })
          .select()
          .single();
        
        if (createError) throw createError;
        data = newSetlist;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!gigId,
  });
}

export function useSetlistSongs(setlistId: string | undefined) {
  return useQuery({
    queryKey: ['setlist-songs', setlistId],
    queryFn: async () => {
      if (!setlistId) return [];
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          song:songs (*)
        `)
        .eq('setlist_id', setlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!setlistId,
  });
}

export function useMyKnownSongs() {
  return useQuery({
    queryKey: ['my-known-songs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('musician_song_knowledge')
        .select(`
          *,
          song:songs (*)
        `)
        .eq('musician_id', user.id);

      if (error) throw error;
      return data;
    },
  });
}

export function useAddSongToSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setlistId, songId, position }: { setlistId: string; songId: string; position: number }) => {
      const { error } = await supabase
        .from('setlist_songs')
        .upsert({
          setlist_id: setlistId,
          song_id: songId,
          position
        }, { onConflict: 'setlist_id, song_id' });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs', variables.setlistId] });
    },
  });
}

export function useSetlistAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gigId, message, setlistId, sessionId }: { gigId: string; message: string; setlistId: string; sessionId?: string }) => {
      const { data, error } = await supabase.functions.invoke('setlist-agent', {
        body: { gigId, message, setlistId, sessionId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Refresh history for the current session
      if (variables.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['ai-history', variables.sessionId] });
      }
      // Refresh session list just in case a new one was auto-created
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
  });
}

export function useAISessions() {
  return useQuery({
    queryKey: ['ai-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_sessions')
        .select(`
          *,
          ai_messages(id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });



      if (error) throw error;
      return data;
    },
  });
}

export function useAIChatHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['ai-history', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gigId, title }: { gigId?: string; title?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.id,
          gig_id: gigId,
          title: title || 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
  });
}
export function useDiscoverMusicians() {
  return useQuery({
    queryKey: ['discover-musicians'],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // 1. Fetch current user's song knowledge IDs
      const { data: mySongs, error: mySongsError } = await supabase
        .from('musician_song_knowledge')
        .select('song_id')
        .eq('musician_id', currentUser.id);
      
      if (mySongsError) throw mySongsError;
      const mySongIds = mySongs?.map(s => s.song_id) || [];

      // 2. Fetch all musicians (profiles + users)
      // Exclude current user
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('*, musician_profiles(*)')
        .neq('id', currentUser.id);

      if (profileError) throw profileError;

      // 3. Efficient Match Score Calculation
      // Fetch all knowledge entries for other musicians that match our song IDs
      const { data: matches, error: matchesError } = await supabase
        .from('musician_song_knowledge')
        .select('musician_id')
        .neq('musician_id', currentUser.id)
        .in('song_id', mySongIds);

      if (matchesError) throw matchesError;

      // Count occurrences of each musician_id (number of shared songs)
      const counts = matches?.reduce((acc, match) => {
        acc[match.musician_id] = (acc[match.musician_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // 4. Enrich and Filter (only show if they have a musician profile)
      const enrichedProfiles = profiles
        .filter(p => p.musician_profiles && p.musician_profiles.length > 0)
        .map(p => ({
          ...p,
          musician_profile: p.musician_profiles[0], // Flatten the array from the join
          match_score: counts[p.id] || 0
        }));

      // Sort by match score descending
      return enrichedProfiles.sort((a, b) => b.match_score - a.match_score);
    },
  });
}
export function useMusicianSongs(userId: string | undefined) {
  return useQuery({
    queryKey: ['musician-songs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('musician_song_knowledge')
        .select(`
          *,
          song:songs (*)
        `)
        .eq('musician_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
export function useMusicianReviews(musicianId?: string) {
  return useQuery({
    queryKey: ['musician-reviews', musicianId],
    queryFn: async () => {
      if (!musicianId) return [];
      const { data, error } = await supabase
        .from('musician_reviews')
        .select(`
          *,
          reviewer:users (
            display_name,
            avatar_url
          )
        `)
        .eq('musician_id', musicianId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!musicianId,
  });
}
export function useAddSongToKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, artist, genre }: { title: string; artist: string; genre?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Upsert global song entry
      const { data: song, error: songError } = await supabase
        .from('songs')
        .upsert(
          { title, artist, genre, added_by: user.id },
          { onConflict: 'title, artist' }
        )
        .select()
        .single();
      
      if (songError) throw songError;

      // 2. Link to user's knowledge bank
      const { error: knowledgeError } = await supabase
        .from('musician_song_knowledge')
        .upsert({
          musician_id: user.id,
          song_id: song.id,
          confidence_level: 3,
          source: 'ai_extraction'
        }, { onConflict: 'musician_id, song_id' });

      if (knowledgeError) throw knowledgeError;
      return song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-known-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-stats'] });
    },
  });
}
