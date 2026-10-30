import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../supabase';

// Rehearsals, cifra thumbs-up, the Band Dictionary, substitutes and leadership transfer.
// Tables and rules: supabase/migrations/0024_rehearsals_band_dictionary.sql and
// 0025_substitutes_personal_dictionary.sql.

export type Rehearsal = {
  id: string;
  band_id: string;
  title: string;
  starts_at: string;
  created_by: string;
};

/** Rehearsals where the signed-in user is the linked substitute. */
export function useMySubRehearsals() {
  return useQuery({
    queryKey: ['my-sub-rehearsals'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('rehearsal_substitutes')
        .select('id, role, rehearsal:rehearsals(id, band_id, title, starts_at, band:bands(name))')
        .eq('sub_user_id', user.id);
      if (error) throw error;
      return (data || []).map((s: any) => {
        const r = Array.isArray(s.rehearsal) ? s.rehearsal[0] : s.rehearsal;
        const band = Array.isArray(r?.band) ? r.band[0] : r?.band;
        return {
          substituteId: s.id as string,
          role: s.role as string,
          rehearsalId: r?.id as string,
          bandId: r?.band_id as string,
          title: (r?.title as string) || 'Rehearsal',
          startsAt: r?.starts_at as string,
          bandName: (band?.name as string) || 'Band',
        };
      }).filter((x: any) => !!x.rehearsalId);
    },
  });
}

/** App musicians who list a role on their profile, for picking a linked sub. */
export function useMusiciansWithRole(role: string | null) {
  return useQuery({
    queryKey: ['musicians-with-role', role],
    enabled: !!role,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musician_profiles')
        .select('user_id, roles, user:users(id, display_name)')
        .contains('roles', [role!])
        .limit(30);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        user_id: p.user_id as string,
        name: (Array.isArray(p.user) ? p.user[0]?.display_name : p.user?.display_name) || 'Musician',
      }));
    },
  });
}

/** Active members with their profile roles, so the app can tell singers from the rest. */
export function useBandMemberRoles(bandId: string | undefined) {
  return useQuery({
    queryKey: ['band-member-roles', bandId],
    enabled: !!bandId,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('band_members')
        .select('user_id, role, status, user:users(id, display_name)')
        .eq('band_id', bandId!)
        .eq('status', 'active');
      if (error) throw error;

      const ids = (members || []).map((m: any) => m.user_id);
      const { data: profiles, error: pErr } = ids.length
        ? await supabase.from('musician_profiles').select('user_id, roles').in('user_id', ids)
        : { data: [], error: null as any };
      if (pErr) throw pErr;

      const rolesById = new Map((profiles || []).map((p: any) => [p.user_id, (p.roles || []) as string[]]));
      return (members || []).map((m: any) => ({
        user_id: m.user_id as string,
        name: (m.user?.display_name as string) || 'Musician',
        leader: m.role === 'leader',
        roles: rolesById.get(m.user_id) || [],
      }));
    },
    staleTime: 1000 * 60,
  });
}

export function useBandPractice(bandId: string | undefined) {
  return useQuery({
    queryKey: ['band-practice', bandId],
    enabled: !!bandId,
    queryFn: async () => {
      const [dict, rehearsals] = await Promise.all([
        supabase
          .from('band_dictionary')
          .select('song_id, added_at, leader_approved, song:songs(id, title, artist, genre, bpm)')
          .eq('band_id', bandId!)
          .order('added_at', { ascending: false }),
        supabase
          .from('rehearsals')
          .select('*')
          .eq('band_id', bandId!)
          .order('starts_at', { ascending: false }),
      ]);
      if (dict.error) throw dict.error;
      if (rehearsals.error) throw rehearsals.error;
      return {
        dictionary: (dict.data || []).map((d: any) => ({ ...d, song: Array.isArray(d.song) ? d.song[0] : d.song })),
        rehearsals: (rehearsals.data || []) as Rehearsal[],
      };
    },
  });
}

export function useRehearsalDetail(rehearsalId: string | undefined) {
  return useQuery({
    queryKey: ['rehearsal', rehearsalId],
    enabled: !!rehearsalId,
    queryFn: async () => {
      const id = rehearsalId!;
      const [rehearsal, songs, cifra, excused, absences, subs] = await Promise.all([
        supabase.from('rehearsals').select('*').eq('id', id).single(),
        supabase
          .from('rehearsal_songs')
          .select('song_id, song:songs(id, title, artist, genre, bpm)')
          .eq('rehearsal_id', id),
        supabase.from('rehearsal_song_cifra').select('song_id, member_id, substitute_id').eq('rehearsal_id', id),
        supabase.from('rehearsal_song_excused').select('song_id, member_id').eq('rehearsal_id', id),
        supabase.from('rehearsal_absences').select('member_id').eq('rehearsal_id', id),
        supabase.from('rehearsal_substitutes').select('*').eq('rehearsal_id', id),
      ]);
      if (rehearsal.error) throw rehearsal.error;
      if (songs.error) throw songs.error;
      if (cifra.error) throw cifra.error;
      if (excused.error) throw excused.error;
      if (absences.error) throw absences.error;
      if (subs.error) throw subs.error;

      return {
        rehearsal: rehearsal.data as Rehearsal,
        songs: (songs.data || []).map((s: any) => ({
          song_id: s.song_id,
          song: Array.isArray(s.song) ? s.song[0] : s.song,
        })),
        cifra: cifra.data || [],
        excused: excused.data || [],
        absent: (absences.data || []).map((a: any) => a.member_id as string),
        substitutes: subs.data || [],
      };
    },
  });
}

function invalidateBand(qc: ReturnType<typeof useQueryClient>, bandId: string) {
  qc.invalidateQueries({ queryKey: ['band-practice', bandId] });
  qc.invalidateQueries({ queryKey: ['band-dictionary', bandId] });
}

export function useCreateRehearsal(bandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, startsAt }: { title: string; startsAt: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Please sign in again.');
      const { data, error } = await supabase
        .from('rehearsals')
        .insert({ band_id: bandId, title: title.trim() || 'Rehearsal', starts_at: startsAt, created_by: user.id })
        .select('*')
        .single();
      if (error) throw error;
      return data as Rehearsal;
    },
    onSuccess: () => invalidateBand(qc, bandId),
  });
}

export function useAddRehearsalSong(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (songId: string) => {
      const user = await getCurrentUser();
      const { error } = await supabase
        .from('rehearsal_songs')
        .insert({ rehearsal_id: rehearsalId, song_id: songId, added_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] }),
  });
}

export function useRemoveRehearsalSong(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from('rehearsal_songs')
        .delete()
        .eq('rehearsal_id', rehearsalId)
        .eq('song_id', songId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] }),
  });
}

/** Toggle a thumbs-up for a member (userId) or a substitute (substituteId). */
export function useToggleCifra(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      songId,
      memberId,
      substituteId,
      on,
    }: {
      songId: string;
      memberId?: string;
      substituteId?: string;
      on: boolean;
    }) => {
      const holder = memberId ? { member_id: memberId } : { substitute_id: substituteId };
      if (on) {
        const { error } = await supabase
          .from('rehearsal_song_cifra')
          .insert({ rehearsal_id: rehearsalId, song_id: songId, ...holder });
        if (error) throw error;
      } else {
        let q = supabase.from('rehearsal_song_cifra').delete().eq('rehearsal_id', rehearsalId).eq('song_id', songId);
        q = memberId ? q.eq('member_id', memberId) : q.eq('substitute_id', substituteId!);
        const { error } = await q;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      invalidateBand(qc, bandId);
    },
  });
}

/** A singer's "Not my song" for this rehearsal's song. */
export function useToggleExcused(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ songId, memberId, on }: { songId: string; memberId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase
          .from('rehearsal_song_excused')
          .insert({ rehearsal_id: rehearsalId, song_id: songId, member_id: memberId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rehearsal_song_excused')
          .delete()
          .eq('rehearsal_id', rehearsalId)
          .eq('song_id', songId)
          .eq('member_id', memberId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      invalidateBand(qc, bandId);
    },
  });
}

/** "Can't make it" for a member on this rehearsal (or clearing it). */
export function useSetAbsence(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, absent }: { memberId: string; absent: boolean }) => {
      if (absent) {
        const { error } = await supabase
          .from('rehearsal_absences')
          .insert({ rehearsal_id: rehearsalId, member_id: memberId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rehearsal_absences')
          .delete()
          .eq('rehearsal_id', rehearsalId)
          .eq('member_id', memberId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      invalidateBand(qc, bandId);
    },
  });
}

/** Leader assigns a sub for an absent member: an app user (subUserId) or a name-only guest. */
export function useAssignSubstitute(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      absentMemberId,
      subName,
      role,
      subUserId,
    }: {
      absentMemberId: string;
      subName: string;
      role: string;
      subUserId?: string;
    }) => {
      const { error } = await supabase.from('rehearsal_substitutes').insert({
        rehearsal_id: rehearsalId,
        absent_member_id: absentMemberId,
        sub_name: subName.trim(),
        role,
        sub_user_id: subUserId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      invalidateBand(qc, bandId);
    },
  });
}

export function useRemoveSubstitute(bandId: string, rehearsalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (substituteId: string) => {
      const { error } = await supabase.from('rehearsal_substitutes').delete().eq('id', substituteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      invalidateBand(qc, bandId);
    },
  });
}

/** Leader bypass: add a practice song straight to the Band Dictionary. */
export function useLeaderAddToDictionary(bandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ songId, rehearsalId }: { songId: string; rehearsalId?: string }) => {
      const { error } = await supabase.rpc('leader_add_to_dictionary', {
        p_band: bandId,
        p_song: songId,
        p_rehearsal: rehearsalId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateBand(qc, bandId),
  });
}

/** Leader removes a song from the Band Dictionary. */
export function useRemoveFromDictionary(bandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from('band_dictionary')
        .delete()
        .eq('band_id', bandId)
        .eq('song_id', songId);
      if (error) throw error;
    },
    onSuccess: () => invalidateBand(qc, bandId),
  });
}

export function useTransferLeadership(bandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newLeaderId: string) => {
      const { error } = await supabase.rpc('transfer_band_leadership', {
        p_band: bandId,
        p_new_leader: newLeaderId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['band', bandId] });
      qc.invalidateQueries({ queryKey: ['band-members', bandId] });
      qc.invalidateQueries({ queryKey: ['band-member-roles', bandId] });
      qc.invalidateQueries({ queryKey: ['my-bands'] });
    },
  });
}
