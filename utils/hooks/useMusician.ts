import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../supabase';

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
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useMyBands() {
  return useQuery({
    queryKey: ['my-bands'],
    queryFn: async () => {
      const user = await getCurrentUser();
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
    staleTime: 1000 * 60 * 3, // 3 mins
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
    staleTime: 1000 * 60 * 3, // 3 mins
  });
}

export function useCreateBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, genres, city, lat, lng }: { name: string; genres: string[]; city: string; lat?: number | null; lng?: number | null }) => {
      const user = await getCurrentUser();
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
      const user = await getCurrentUser();
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
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const user = await getCurrentUser();
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 3,
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
      const user = await getCurrentUser();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musician-profile'] });
    },
  });
}

export function useMyGigs() {
  return useQuery({
    queryKey: ['my-gigs'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

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
    staleTime: 1000 * 60 * 3, // 3 mins
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
      const user = await getCurrentUser();
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
    staleTime: 1000 * 60 * 5,
  });
}

export function useGigSetlists(gigId: string | undefined) {
  return useQuery({
    queryKey: ['gig-setlists', gigId],
    queryFn: async () => {
      if (!gigId) return [];
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // If no setlists, create the default "Set 1"
      if (data && data.length === 0) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const gigRes = await supabase.from('gigs').select('band_id').eq('id', gigId).single();
        
        const { data: newSetlist, error: createError } = await supabase
          .from('setlists')
          .insert({
            gig_id: gigId,
            band_id: gigRes.data?.band_id,
            name: 'Set 1',
            created_by: user.id
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return [newSetlist];
      }

      return data;
    },
    enabled: !!gigId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gigId, bandId, name }: { gigId: string; bandId: string; name: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('setlists')
        .insert({
          gig_id: gigId,
          band_id: bandId,
          name,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gig-setlists', variables.gigId] });
      queryClient.invalidateQueries({ queryKey: ['gig-setlist', variables.gigId] });
    },
  });
}

export function useGigSetlist(gigId: string | undefined) {
  return useQuery({
    queryKey: ['gig-setlist', gigId],
    queryFn: async () => {
      if (!gigId) return null;
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      let { data, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!data && !error) {
        const gigBandRes = await supabase.from('gigs').select('band_id').eq('id', gigId).single();
        const { data: newSetlist, error: createError } = await supabase
          .from('setlists')
          .insert({
            gig_id: gigId,
            band_id: gigBandRes.data?.band_id,
            name: 'Set 1',
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
    staleTime: 1000 * 60 * 3,
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val: any): boolean => typeof val === 'string' && UUID_REGEX.test(val);

export function useSetlistSongs(setlistId: string | undefined) {
  return useQuery({
    queryKey: ['setlist-songs', setlistId],
    queryFn: async () => {
      if (!setlistId || !isUuid(setlistId)) return [];
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
    enabled: !!setlistId && isUuid(setlistId),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useMyKnownSongs() {
  return useQuery({
    queryKey: ['my-known-songs'],
    queryFn: async () => {
      const user = await getCurrentUser();
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
    staleTime: 1000 * 60 * 3, // 3 mins
  });
}

export function useAddSongsToSetlistBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setlistId, songs }: { setlistId: string; songs: Array<{ songId: string; position: number }> }) => {
      const dataToUpsert = songs.map(s => ({
        setlist_id: setlistId,
        song_id: s.songId,
        position: s.position
      }));

      const { error } = await supabase
        .from('setlist_songs')
        .upsert(dataToUpsert, { onConflict: 'setlist_id, song_id' });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs', variables.setlistId] });
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
      
      if (error && error.code === '23505' && error.message.includes('position')) {
        const { data: occupant } = await supabase
          .from('setlist_songs')
          .select('song_id')
          .eq('setlist_id', setlistId)
          .eq('position', position)
          .single();

        if (occupant && occupant.song_id !== songId) {
          await supabase
            .from('setlist_songs')
            .update({ position: 900 + position })
            .eq('setlist_id', setlistId)
            .eq('song_id', occupant.song_id);

          const { error: retryError } = await supabase
            .from('setlist_songs')
            .upsert({
              setlist_id: setlistId,
              song_id: songId,
              position
            }, { onConflict: 'setlist_id, song_id' });

          if (retryError) throw retryError;
        } else {
           throw error;
        }
      } else if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs', variables.setlistId] });
    },
  });
}

export type AiProposalStatus = 'pending' | 'executing' | 'executed' | 'rejected' | 'failed' | 'expired';

export interface AiProposal {
  id: string;
  session_id: string;
  message_id: string | null;
  kind:
    | 'create_gig'
    | 'update_gig'
    | 'add_songs_to_setlist'
    | 'remove_songs_from_setlist'
    | 'reorder_setlist'
    | 'add_to_dictionary'
    | 'invite_musician';
  risk: 'low' | 'medium' | 'high';
  payload: Record<string, any>;
  preview: { title: string; subtitle: string; lines: string[] };
  status: AiProposalStatus;
  error: string | null;
  expires_at: string;
}

export class AgentError extends Error {
  code: string;
  constructor(message: string, code = 'unknown') {
    super(message);
    this.code = code;
  }
}

async function invokeAgent<T>(body: Record<string, any>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new AgentError('Please sign in again to use the assistant.', 'unauthenticated');

  const { data, error } = await supabase.functions.invoke('setlist-agent', {
    body,
    headers: { 'X-Auth-Token': token },
  });

  if (error) {
    let detail = error.message;
    let code = 'unknown';
    try {
      const json = await (error as any).context?.json?.();
      if (json?.error) detail = json.error;
      if (json?.code) code = json.code;
    } catch (_) {}
    throw new AgentError(detail, code);
  }
  return data as T;
}

export function useSetlistAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, message, clientMsgId }: { sessionId: string; message: string; clientMsgId?: string }) =>
      invokeAgent<{ reply: string; messageId: string; proposals: AiProposal[] }>({
        action: 'chat',
        sessionId,
        message,
        clientMsgId,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-history', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-proposals', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
  });
}

/** Proposals the agent has prepared for this conversation (pending / decided), oldest first. */
export function useSessionProposals(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['ai-proposals', sessionId],
    queryFn: async () => {
      if (!sessionId) return [] as AiProposal[];
      const { data, error } = await supabase
        .from('ai_proposals')
        .select('id, session_id, message_id, kind, risk, payload, preview, status, error, expires_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as AiProposal[];
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

/** The human-in-the-loop gate: approve (optionally with edits) or reject agent proposals. */
export function useDecideProposals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalIds,
      decision,
      edits,
    }: {
      proposalIds: string[];
      decision: 'approve' | 'reject';
      edits?: Record<string, any>;
    }) =>
      invokeAgent<{ results: { id: string; status: string; error?: string; skipped?: boolean }[] }>({
        action: 'decide',
        proposalIds,
        decision,
        edits,
      }),
    onSuccess: () => {
      // An approved proposal may have changed gigs, setlists, repertoire or invites.
      queryClient.invalidateQueries();
    },
  });
}

export function useAISessions() {
  return useQuery({
    queryKey: ['ai-sessions'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_sessions')
        .select(`
          *,
          gigs(name),
          ai_messages(id, content, role, created_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 mins
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
    staleTime: 1000 * 30, // 30s
  });
}

export function useCreateAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gigId, title }: { gigId?: string; title?: string }) => {
      const user = await getCurrentUser();
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
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      // 1. Fetch current user's song knowledge IDs
      const { data: mySongs, error: mySongsError } = await supabase
        .from('musician_song_knowledge')
        .select('song_id')
        .eq('musician_id', currentUser.id);
      
      if (mySongsError) throw mySongsError;
      const mySongIds = mySongs?.map(s => s.song_id) || [];

      // 2. Fetch all musicians (profiles + users), exclude current user
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('*, musician_profiles(*)')
        .neq('id', currentUser.id);

      if (profileError) throw profileError;

      // 3. Match score calculation (only query if user has songs)
      let counts: Record<string, number> = {};
      if (mySongIds.length > 0) {
        const { data: matches, error: matchesError } = await supabase
          .from('musician_song_knowledge')
          .select('musician_id')
          .neq('musician_id', currentUser.id)
          .in('song_id', mySongIds);

        if (!matchesError && matches) {
          counts = matches.reduce((acc, match) => {
            acc[match.musician_id] = (acc[match.musician_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // 4. Enrich and Filter
      const enrichedProfiles = profiles
        .filter(p => p.musician_profiles && p.musician_profiles.length > 0)
        .map(p => ({
          ...p,
          musician_profile: p.musician_profiles[0],
          match_score: counts[p.id] || 0
        }));

      return enrichedProfiles.sort((a, b) => b.match_score - a.match_score);
    },
    staleTime: 1000 * 60 * 5, // 5 mins
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddSongToKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, artist, genre }: { title: string; artist: string; genre?: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data: song, error: songError } = await supabase
        .from('songs')
        .upsert(
          { title, artist, genre, added_by: user.id },
          { onConflict: 'title, artist' }
        )
        .select()
        .single();
      
      if (songError) throw songError;

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

export function useToggleLearnStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setlistId, songId, currentNotes }: { setlistId: string; songId: string; currentNotes: string | null }) => {
      const isLearning = currentNotes?.includes('[LEARN]');
      let newNotes = currentNotes || '';
      
      if (isLearning) {
        newNotes = newNotes.replace('[LEARN]', '').trim();
      } else {
        newNotes = `[LEARN] ${newNotes}`.trim();
      }

      const { error } = await supabase
        .from('setlist_songs')
        .update({ notes: newNotes })
        .eq('setlist_id', setlistId)
        .eq('song_id', songId);
      
      if (error) throw error;
      return { setlistId, songId, newNotes };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs', variables.setlistId] });
    },
  });
}
