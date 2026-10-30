import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, BookOpen, CalendarDays, Plus, Trash2, Crown } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useAppTheme } from '../../context/theme';
import { useBandDetails } from '../../utils/hooks/useMusician';
import { useSearchSongs } from '../../utils/hooks/useSongs';
import {
  useBandPractice,
  useCreateRehearsal,
  useLeaderAddToDictionary,
  useRemoveFromDictionary,
} from '../../utils/hooks/useRehearsals';

export default function BandPracticeScreen() {
  const { bandId } = useLocalSearchParams<{ bandId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();

  const { data: band } = useBandDetails(bandId);
  const { data: practice, isLoading } = useBandPractice(bandId);
  const createRehearsal = useCreateRehearsal(bandId!);
  const addToDictionary = useLeaderAddToDictionary(bandId!);
  const removeFromDictionary = useRemoveFromDictionary(bandId!);

  const isLeader = !!band && band.leader_id === user?.id;

  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(''); // "2026-11-07 18:00"
  const [songQuery, setSongQuery] = useState('');
  const { data: songResults } = useSearchSongs(songQuery);

  const notify = (msg: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('Band Practice', msg);
  };

  const onCreateRehearsal = () => {
    const parsed = new Date(when.trim().replace(' ', 'T'));
    if (!when.trim() || isNaN(parsed.getTime())) {
      notify('Enter the date and time as YYYY-MM-DD HH:MM, for example 2026-11-07 18:00.');
      return;
    }
    createRehearsal.mutate(
      { title, startsAt: parsed.toISOString() },
      {
        onSuccess: (r) => {
          setTitle('');
          setWhen('');
          router.push(`/band-practice/rehearsal/${r.id}?bandId=${bandId}`);
        },
        onError: (e: any) => notify(e.message || 'Could not create the rehearsal.'),
      },
    );
  };

  const confirmRemove = (songId: string, songTitle: string) => {
    const doRemove = () => removeFromDictionary.mutate(songId, { onError: (e: any) => notify(e.message) });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Remove "${songTitle}" from the Band Dictionary?`)) doRemove();
    } else {
      Alert.alert('Remove song', `Remove "${songTitle}" from the Band Dictionary?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const card = { backgroundColor: colors.bgCard, borderColor: colors.border };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{band?.name ?? 'Band Practice'}</Text>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Band Dictionary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={16} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                BAND DICTIONARY ({practice?.dictionary.length ?? 0})
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textDim }]}>
              Songs the band has fully learned. Added automatically when every rehearsal rule passes, or by the leader.
            </Text>

            {(practice?.dictionary || []).map((d: any) => (
              <View key={d.song_id} style={[styles.row, card]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                    {d.song?.title}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textDim }]} numberOfLines={1}>
                    {d.song?.artist}
                    {d.leader_approved ? '  •  Leader approved' : ''}
                  </Text>
                </View>
                {isLeader && (
                  <TouchableOpacity
                    onPress={() => confirmRemove(d.song_id, d.song?.title ?? 'this song')}
                    style={styles.iconBtn}
                    accessibilityLabel={`Remove ${d.song?.title} from the Band Dictionary`}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {practice && practice.dictionary.length === 0 && (
              <Text style={[styles.hint, { color: colors.textDim }]}>No songs yet.</Text>
            )}

            {isLeader && (
              <View style={[styles.leaderBox, card]}>
                <View style={styles.leaderTitleRow}>
                  <Crown size={14} color="#10B981" />
                  <Text style={[styles.leaderTitle, { color: colors.text }]}>Add to Band Dictionary (leader)</Text>
                </View>
                <TextInput
                  value={songQuery}
                  onChangeText={setSongQuery}
                  placeholder="Search your library"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                />
                {(songResults || []).slice(0, 6).map((s: any) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => addToDictionary.mutate({ songId: s.id }, { onError: (e: any) => notify(e.message) })}
                    style={[styles.resultRow, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                      {s.title} <Text style={{ color: colors.textDim }}>— {s.artist}</Text>
                    </Text>
                    <Plus size={16} color="#10B981" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Rehearsals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CalendarDays size={16} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>REHEARSALS</Text>
            </View>

            {(practice?.rehearsals || []).map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => router.push(`/band-practice/rehearsal/${r.id}?bandId=${bandId}`)}
                style={[styles.row, card]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{r.title}</Text>
                  <Text style={[styles.rowSub, { color: colors.textDim }]}>
                    {new Date(r.starts_at).toLocaleString()}
                  </Text>
                </View>
                <ChevronLeft size={18} color={colors.textDim} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
            {practice && practice.rehearsals.length === 0 && (
              <Text style={[styles.hint, { color: colors.textDim }]}>No rehearsals yet.</Text>
            )}

            <View style={[styles.leaderBox, card]}>
              <Text style={[styles.leaderTitle, { color: colors.text }]}>New rehearsal</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title, e.g. Saturday practice"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              />
              <TextInput
                value={when}
                onChangeText={setWhen}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              />
              <TouchableOpacity
                onPress={onCreateRehearsal}
                disabled={createRehearsal.isPending}
                style={[styles.primaryBtn, { opacity: createRehearsal.isPending ? 0.6 : 1 }]}
              >
                <Text style={styles.primaryBtnText}>{createRehearsal.isPending ? 'Creating…' : 'Create rehearsal'}</Text>
              </TouchableOpacity>
              <Text style={[styles.hint, { color: colors.textDim }]}>
                Leader and singers can create rehearsals.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60, gap: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  hint: { fontSize: 12, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 6 },
  leaderBox: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  leaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaderTitle: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  primaryBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
