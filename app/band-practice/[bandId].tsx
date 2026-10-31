import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, BookOpen, CalendarDays, Clock, Plus, Trash2, Crown } from 'lucide-react-native';
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
  // Default: tomorrow at 18:00, so the picker opens on a sensible time
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [pickerMode, setPickerMode] = useState<null | 'date' | 'time'>(null);
  const [songQuery, setSongQuery] = useState('');
  const { data: songResults } = useSearchSongs(songQuery);

  const notify = (msg: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('Band Practice', msg);
  };

  // Date and time are picked, never typed. Android opens the date picker, then the time picker.
  const onPickerChange = (event: any, picked?: Date) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event?.type === 'dismissed' || !picked) return;
    // Keep the date part from the date picker and the time part from the time picker
    const next = new Date(startsAt);
    if (pickerMode === 'date') {
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    } else {
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    }
    setStartsAt(next);
  };

  const onCreateRehearsal = () => {
    if (startsAt.getTime() < Date.now()) {
      notify('Pick a date and time in the future.');
      return;
    }
    createRehearsal.mutate(
      { title, startsAt: startsAt.toISOString() },
      {
        onSuccess: (r) => {
          setTitle('');
          router.push(`/band-practice/rehearsal/${r.id}?bandId=${bandId}`);
        },
        onError: (e: any) => notify(e.message || 'Could not create the rehearsal.'),
      },
    );
  };

  const confirmAddToDictionary = (songId: string, songTitle: string) => {
    const message = `Add "${songTitle}" to the Band Dictionary? Every member gets it in their personal list.`;
    const doAdd = () => addToDictionary.mutate({ songId }, { onError: (e: any) => notify(e.message) });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) doAdd();
    } else {
      Alert.alert('Add to Band Dictionary', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: doAdd },
      ]);
    }
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
              Songs the whole band can play. A song gets here automatically when everyone at a rehearsal gives the
              thumbs-up, or when the leader adds it.
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
                  <Text style={[styles.leaderTitle, { color: colors.text }]}>Leader: add a song to the band</Text>
                </View>
                <Text style={[styles.hint, { color: colors.textDim }]}>
                  Search for a song, then tap Add. Use this when the band can play it without a rehearsal check.
                </Text>
                <TextInput
                  value={songQuery}
                  onChangeText={setSongQuery}
                  placeholder="Type a song title"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                />
                {songQuery.trim().length > 2 && (songResults || []).length === 0 && (
                  <Text style={[styles.hint, { color: colors.textDim }]}>No songs found. Add it to your library first.</Text>
                )}
                {(songResults || []).slice(0, 6).map((s: any) => (
                  <View key={s.id} style={[styles.resultRow, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{s.title}</Text>
                      <Text style={{ color: colors.textDim, fontSize: 12 }} numberOfLines={1}>{s.artist}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmAddToDictionary(s.id, s.title)}
                      style={styles.addBtn}
                      accessibilityLabel={`Add ${s.title} to the Band Dictionary`}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
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
              <View style={styles.dateRow}>
                <TouchableOpacity
                  onPress={() => setPickerMode('date')}
                  style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
                  accessibilityLabel="Pick the rehearsal date"
                >
                  <CalendarDays size={16} color="#10B981" />
                  <Text style={[styles.dateBtnText, { color: colors.text }]}>
                    {startsAt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPickerMode('time')}
                  style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
                  accessibilityLabel="Pick the rehearsal time"
                >
                  <Clock size={16} color="#10B981" />
                  <Text style={[styles.dateBtnText, { color: colors.text }]}>
                    {startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
              {pickerMode && (
                <DateTimePicker
                  value={startsAt}
                  mode={pickerMode}
                  minimumDate={pickerMode === 'date' ? new Date() : undefined}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onPickerChange}
                />
              )}
              {Platform.OS === 'ios' && pickerMode && (
                <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Done</Text>
                </TouchableOpacity>
              )}
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dateBtnText: { fontSize: 14, fontWeight: '700' },
  secondaryBtn: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)' },
  secondaryBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13 },
});
