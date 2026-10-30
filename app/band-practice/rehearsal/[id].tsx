import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Check, Trash2, Plus, UserX, UserPlus, Music, Users } from 'lucide-react-native';
import { useAuth } from '../../../context/auth';
import { useAppTheme } from '../../../context/theme';
import { useBandDetails } from '../../../utils/hooks/useMusician';
import { useSearchSongs } from '../../../utils/hooks/useSongs';
import {
  useAddRehearsalSong,
  useAssignSubstitute,
  useBandMemberRoles,
  useMusiciansWithRole,
  useBandPractice,
  useRehearsalDetail,
  useRemoveRehearsalSong,
  useRemoveSubstitute,
  useSetAbsence,
  useToggleCifra,
  useToggleExcused,
} from '../../../utils/hooks/useRehearsals';

const ROLE_OPTIONS = [
  { id: 'singer', label: 'Singer' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'bass', label: 'Bass' },
  { id: 'drums', label: 'Drums' },
  { id: 'keys', label: 'Keys' },
  { id: 'session', label: 'Other' },
];

/** Lists Tukarta musicians with the chosen role, so the leader can link a sub to an account. */
function SubPicker({ role, onPick, colors }: { role: string; onPick: (m: { user_id: string; name: string }) => void; colors: any }) {
  const { data, isLoading } = useMusiciansWithRole(role);
  if (isLoading) return <ActivityIndicator color="#10B981" />;
  if (!data || data.length === 0) {
    return <Text style={{ color: colors.textDim, fontSize: 12 }}>No Tukarta musicians with this role yet. Type a name instead.</Text>;
  }
  return (
    <View style={{ gap: 4 }}>
      {data.slice(0, 8).map((m) => (
        <TouchableOpacity
          key={m.user_id}
          onPress={() => onPick(m)}
          style={[styles.resultRow, { borderColor: colors.border }]}
        >
          <Users size={14} color={colors.textDim} />
          <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{m.name}</Text>
          <Plus size={14} color="#10B981" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RehearsalDetailScreen() {
  const { id, bandId } = useLocalSearchParams<{ id: string; bandId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();

  const { data: band } = useBandDetails(bandId);
  const { data: detail, isLoading } = useRehearsalDetail(id);
  const { data: members } = useBandMemberRoles(bandId);
  const { data: practice } = useBandPractice(bandId);

  const addSong = useAddRehearsalSong(bandId!, id!);
  const removeSong = useRemoveRehearsalSong(bandId!, id!);
  const toggleCifra = useToggleCifra(bandId!, id!);
  const toggleExcused = useToggleExcused(bandId!, id!);
  const setAbsence = useSetAbsence(bandId!, id!);
  const assignSub = useAssignSubstitute(bandId!, id!);
  const removeSub = useRemoveSubstitute(bandId!, id!);

  const [songQuery, setSongQuery] = useState('');
  const { data: songResults } = useSearchSongs(songQuery);
  const [subNames, setSubNames] = useState<Record<string, string>>({});
  const [subRoles, setSubRoles] = useState<Record<string, string>>({});
  // Linked sub account picked from Tukarta musicians, per absent member
  const [subPicks, setSubPicks] = useState<Record<string, { user_id: string; name: string }>>({});

  const isLeader = !!band && band.leader_id === user?.id;
  const me = (members || []).find((m) => m.user_id === user?.id);
  const amSinger = !!me && me.roles.includes('singer');
  const canPlan = isLeader || amSinger;
  const dictionaryIds = useMemo(
    () => new Set((practice?.dictionary || []).map((d: any) => d.song_id)),
    [practice],
  );

  const notify = (msg: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('Rehearsal', msg);
  };
  const fail = (e: any) => notify(e?.message || 'Something went wrong. Please try again.');

  if (isLoading || !detail) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const absentIds = new Set(detail.absent);
  const subFor = (memberId: string) => detail.substitutes.find((s: any) => s.absent_member_id === memberId);
  // A linked sub covering this rehearsal ticks the cifra for their slot, not as a band member
  const mySub = detail.substitutes.find((s: any) => s.sub_user_id === user?.id);
  const card = { backgroundColor: colors.bgCard, borderColor: colors.border };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {detail.rehearsal.title}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.hint, { color: colors.textDim }]}>
          {new Date(detail.rehearsal.starts_at).toLocaleString()}. Tap the thumbs-up when you have the cifra (chords) ready.
        </Text>

        {/* Attendance and substitutes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ATTENDANCE</Text>
          {(members || []).map((m) => {
            const absent = absentIds.has(m.user_id);
            const sub = subFor(m.user_id);
            const mine = m.user_id === user?.id;
            return (
              <View key={m.user_id} style={[styles.row, card, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {m.name}
                    {mine ? ' (You)' : ''}
                    {m.leader ? '  •  Leader' : ''}
                  </Text>
                  {(mine || isLeader) && (
                    <TouchableOpacity
                      onPress={() => setAbsence.mutate({ memberId: m.user_id, absent: !absent }, { onError: fail })}
                      style={[styles.pill, { backgroundColor: absent ? 'rgba(245,158,11,0.15)' : colors.bgSecondary }]}
                    >
                      <UserX size={14} color={absent ? '#F59E0B' : colors.textDim} />
                      <Text style={{ color: absent ? '#F59E0B' : colors.textDim, fontSize: 12, fontWeight: '700' }}>
                        {absent ? "Can't make it" : 'Can make it'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {absent && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {sub ? (
                      <View style={styles.rowTop}>
                        <Text style={{ color: colors.text, flex: 1 }}>
                          Sub: {sub.sub_name} <Text style={{ color: colors.textDim }}>({sub.role})</Text>
                        </Text>
                        {isLeader && (
                          <TouchableOpacity onPress={() => removeSub.mutate(sub.id, { onError: fail })} style={styles.iconBtn}>
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : isLeader ? (
                      <View style={{ gap: 8 }}>
                        <Text style={{ color: colors.textDim, fontSize: 12 }}>Assign a sub for this slot</Text>
                        <TextInput
                          value={subNames[m.user_id] || ''}
                          onChangeText={(v) => setSubNames((s) => ({ ...s, [m.user_id]: v }))}
                          placeholder="Sub's name"
                          placeholderTextColor={colors.textDim}
                          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                        />
                        <View style={styles.roleRow}>
                          {ROLE_OPTIONS.map((r) => {
                            const picked = (subRoles[m.user_id] || 'session') === r.id;
                            return (
                              <TouchableOpacity
                                key={r.id}
                                onPress={() => setSubRoles((s) => ({ ...s, [m.user_id]: r.id }))}
                                style={[styles.chip, { borderColor: picked ? '#10B981' : colors.border, backgroundColor: picked ? 'rgba(16,185,129,0.15)' : colors.bgSecondary }]}
                              >
                                <Text style={{ color: picked ? '#10B981' : colors.textDim, fontSize: 12, fontWeight: '700' }}>{r.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 4 }}>
                          Or link a Tukarta musician with this role
                        </Text>
                        <SubPicker
                          role={subRoles[m.user_id] || 'session'}
                          colors={colors}
                          onPick={(pick) => {
                            setSubPicks((s) => ({ ...s, [m.user_id]: pick }));
                            setSubNames((s) => ({ ...s, [m.user_id]: pick.name }));
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const name = (subNames[m.user_id] || '').trim();
                            if (!name) return notify("Enter the sub's name.");
                            const pick = subPicks[m.user_id];
                            assignSub.mutate(
                              {
                                absentMemberId: m.user_id,
                                subName: name,
                                role: subRoles[m.user_id] || 'session',
                                subUserId: pick && pick.name === name ? pick.user_id : undefined,
                              },
                              {
                                onSuccess: () => {
                                  setSubNames((s) => ({ ...s, [m.user_id]: '' }));
                                  setSubPicks((s) => {
                                    const next = { ...s };
                                    delete next[m.user_id];
                                    return next;
                                  });
                                },
                                onError: fail,
                              },
                            );
                          }}
                          style={styles.secondaryBtn}
                        >
                          <UserPlus size={14} color="#10B981" />
                          <Text style={styles.secondaryBtnText}>Assign sub</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Songs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SONGS ({detail.songs.length})</Text>

          {detail.songs.map(({ song_id, song }) => {
            const thumbs = detail.cifra.filter((c: any) => c.song_id === song_id);
            const myThumb = mySub
              ? thumbs.some((c: any) => c.substitute_id === mySub.id)
              : thumbs.some((c: any) => c.member_id === user?.id);
            const myExcused = detail.excused.some((e: any) => e.song_id === song_id && e.member_id === user?.id);
            const inDictionary = dictionaryIds.has(song_id);

            return (
              <View key={song_id} style={[styles.songCard, card]}>
                <View style={styles.rowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{song?.title}</Text>
                    <Text style={[styles.rowSub, { color: colors.textDim }]} numberOfLines={1}>
                      {song?.artist}
                      {inDictionary ? '  •  Known' : ''}
                    </Text>
                  </View>
                  {canPlan && (
                    <TouchableOpacity
                      onPress={() => removeSong.mutate(song_id, { onError: fail })}
                      style={styles.iconBtn}
                      accessibilityLabel={`Remove ${song?.title} from this rehearsal`}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.rowSub, { color: colors.textDim }]}>
                  {thumbs.length} cifra ready
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => router.push(`/practice/${song_id}`)}
                    style={[styles.thumb, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                  >
                    <Music size={14} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '800' }}>Practice</Text>
                  </TouchableOpacity>
                  {((user && me && !absentIds.has(user.id)) || mySub) && (
                    <TouchableOpacity
                      onPress={() =>
                        toggleCifra.mutate(
                          mySub
                            ? { songId: song_id, substituteId: mySub.id, on: !myThumb }
                            : { songId: song_id, memberId: user!.id, on: !myThumb },
                          { onError: fail },
                        )
                      }
                      style={[styles.thumb, { borderColor: myThumb ? '#10B981' : colors.border, backgroundColor: myThumb ? 'rgba(16,185,129,0.15)' : colors.bgSecondary }]}
                    >
                      <Check size={14} color={myThumb ? '#10B981' : colors.textDim} />
                      <Text style={{ color: myThumb ? '#10B981' : colors.textDim, fontSize: 12, fontWeight: '800' }}>
                        {myThumb ? 'I have the cifra' : 'Cifra ready?'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {amSinger && (
                    <TouchableOpacity
                      onPress={() => toggleExcused.mutate({ songId: song_id, memberId: user!.id, on: !myExcused }, { onError: fail })}
                      style={[styles.thumb, { borderColor: myExcused ? '#F59E0B' : colors.border, backgroundColor: myExcused ? 'rgba(245,158,11,0.15)' : colors.bgSecondary }]}
                    >
                      <Text style={{ color: myExcused ? '#F59E0B' : colors.textDim, fontSize: 12, fontWeight: '800' }}>
                        {myExcused ? 'Not my song (on)' : 'Not my song'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isLeader &&
                    detail.substitutes
                      .filter((s: any) => absentIds.has(s.absent_member_id))
                      .map((s: any) => {
                        const subThumb = thumbs.some((c: any) => c.substitute_id === s.id);
                        return (
                          <TouchableOpacity
                            key={s.id}
                            onPress={() => toggleCifra.mutate({ songId: song_id, substituteId: s.id, on: !subThumb }, { onError: fail })}
                            style={[styles.thumb, { borderColor: subThumb ? '#10B981' : colors.border, backgroundColor: subThumb ? 'rgba(16,185,129,0.15)' : colors.bgSecondary }]}
                          >
                            <Check size={14} color={subThumb ? '#10B981' : colors.textDim} />
                            <Text style={{ color: subThumb ? '#10B981' : colors.textDim, fontSize: 12, fontWeight: '800' }}>
                              {s.sub_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                </View>
              </View>
            );
          })}

          {detail.songs.length === 0 && <Text style={[styles.hint, { color: colors.textDim }]}>No songs yet.</Text>}

          {canPlan && (
            <View style={[styles.leaderBox, card]}>
              <Text style={[styles.rowTitle, { color: colors.text, fontSize: 14 }]}>Add a song</Text>
              <TextInput
                value={songQuery}
                onChangeText={setSongQuery}
                placeholder="Search your library"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              />
              {(songResults || []).slice(0, 6).map((s: any) => {
                const already = detail.songs.some((x) => x.song_id === s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    disabled={already}
                    onPress={() => addSong.mutate(s.id, { onError: fail, onSuccess: () => setSongQuery('') })}
                    style={[styles.resultRow, { borderColor: colors.border }]}
                  >
                    <Music size={14} color={colors.textDim} />
                    <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                      {s.title} <Text style={{ color: colors.textDim }}>— {s.artist}</Text>
                    </Text>
                    {already ? <Check size={16} color="#10B981" /> : <Plus size={16} color="#10B981" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  hint: { fontSize: 12, lineHeight: 17 },
  row: { padding: 12, borderRadius: 16, borderWidth: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  songCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  thumb: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  iconBtn: { padding: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)' },
  secondaryBtnText: { color: '#10B981', fontWeight: '800', fontSize: 12 },
  leaderBox: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
});
