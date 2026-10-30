import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, SkipForward, Mic2, Guitar, Music, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/auth';
import { useAppTheme } from '../../context/theme';
import { useMusicianProfile, profileOf } from '../../utils/hooks/useMusician';
import { useSongLyrics } from '../../utils/hooks/useSongs';
import { supabase } from '../../utils/supabase';
import YoutubePlayer from '../../components/ui/YoutubePlayer';

// Practice roles come from the profile chosen at onboarding (musician_profiles.roles).
const ROLE_LABEL: Record<string, string> = {
  singer: 'Singer',
  guitar: 'Guitar',
  bass: 'Bass',
  drums: 'Drums',
  keys: 'Keys',
  session: 'Other',
};
const PICK_KEY = '@tukarta_practice_role';

export default function PracticeModeScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const { data: song } = useQuery({
    queryKey: ['song-basic', songId],
    enabled: !!songId,
    queryFn: async () => {
      const { data, error } = await supabase.from('songs').select('id, title, artist').eq('id', songId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: profileData } = useMusicianProfile(user?.id);
  const roles: string[] = (profileOf(profileData)?.roles || []).filter((r: string) => ROLE_LABEL[r]);

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    if (!roles.length) return;
    (async () => {
      let saved: string | null = null;
      try {
        saved = await AsyncStorage.getItem(PICK_KEY);
      } catch {}
      setRole(saved && roles.includes(saved) ? saved : roles[0]);
    })();
    // roles is derived from the profile; re-run only when the profile roles change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles.join(',')]);

  const pickRole = (r: string) => {
    setRole(r);
    setIndex(0);
    AsyncStorage.setItem(PICK_KEY, r).catch(() => {});
  };

  const [index, setIndex] = useState(0);
  const { data: videoIds, isLoading, error } = useQuery({
    queryKey: ['practice-minus-one', songId, role],
    enabled: !!song && !!role,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error: fnErr } = await supabase.functions.invoke('youtube-minus-one', {
        body: { title: song!.title, artist: song!.artist, mode: 'all', instrument: role },
      });
      if (fnErr) throw fnErr;
      return (data?.ids || []) as string[];
    },
  });

  const videoId = videoIds && videoIds.length ? videoIds[Math.min(index, videoIds.length - 1)] : null;
  const exhausted = !!videoIds && videoIds.length > 0 && index >= videoIds.length;
  const playerWidth = Math.min(width - 32, 640);
  const playerHeight = Math.round((playerWidth * 9) / 16);

  const isSinger = role === 'singer';
  const { data: lyrics, isLoading: lyricsLoading } = useSongLyrics(
    songId ?? '',
    song?.artist ?? '',
    song?.title ?? '',
    isSinger && !!song,
  );

  const card = { backgroundColor: colors.bgCard, borderColor: colors.border };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {song?.title ?? 'Practice'}
          </Text>
          <Text style={{ color: colors.textDim, fontSize: 12 }} numberOfLines={1}>
            {song?.artist}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {roles.length === 0 ? (
          <Text style={[styles.hint, { color: colors.textDim }]}>
            Your profile has no instrument yet. Add one in your profile to get practice videos for it.
          </Text>
        ) : (
          roles.length > 1 && (
            <View style={styles.roleRow}>
              {roles.map((r) => {
                const on = r === role;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => pickRole(r)}
                    style={[styles.chip, { borderColor: on ? '#10B981' : colors.border, backgroundColor: on ? 'rgba(16,185,129,0.15)' : colors.bgSecondary }]}
                  >
                    <Text style={{ color: on ? '#10B981' : colors.textDim, fontWeight: '800', fontSize: 13 }}>
                      {ROLE_LABEL[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}

        {role && (
          <View style={[styles.hintRow]}>
            {role === 'singer' ? <Mic2 size={14} color="#10B981" /> : role === 'session' ? <Music size={14} color="#10B981" /> : <Guitar size={14} color="#10B981" />}
            <Text style={{ color: colors.textDim, fontSize: 12 }}>
              Showing {ROLE_LABEL[role].toLowerCase()} practice videos for this song.
            </Text>
          </View>
        )}

        <View style={[styles.playerBox, card]}>
          {isLoading || !role ? (
            <View style={[styles.playerPlaceholder, { height: playerHeight }]}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : error ? (
            <View style={[styles.playerPlaceholder, { height: playerHeight }]}>
              <Text style={{ color: colors.textDim, textAlign: 'center', paddingHorizontal: 16 }}>
                Could not search for videos. Check your connection and try again.
              </Text>
            </View>
          ) : !videoId ? (
            <View style={[styles.playerPlaceholder, { height: playerHeight }]}>
              <Text style={{ color: colors.textDim, textAlign: 'center', paddingHorizontal: 16 }}>
                No playable video found for this role.
              </Text>
            </View>
          ) : exhausted ? (
            <View style={[styles.playerPlaceholder, { height: playerHeight }]}>
              <Text style={{ color: colors.textDim, textAlign: 'center', paddingHorizontal: 16 }}>
                All the videos found were tried. Try another role or search again later.
              </Text>
            </View>
          ) : Platform.OS === 'web' ? (
            <iframe
              title="Practice video"
              width={playerWidth}
              height={playerHeight}
              src={`https://www.youtube.com/embed/${videoId}?playsinline=1`}
              allow="autoplay; encrypted-media"
              style={{ border: 0, borderRadius: 12 }}
            />
          ) : (
            <YoutubePlayer height={playerHeight} width={playerWidth} videoId={videoId} play={false} />
          )}

          {!!videoIds && videoIds.length > 0 && !exhausted && (
            <TouchableOpacity onPress={() => setIndex((i) => i + 1)} style={styles.nextBtn}>
              <SkipForward size={14} color="#10B981" />
              <Text style={styles.nextText}>Video not playing? Try the next one</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!song && (role === 'bass' || role === 'guitar') && (
          <TouchableOpacity
            onPress={() => {
              // Link out only: tab text stays on the tab site, not inside the app.
              const q = `${song.title} ${song.artist} ${ROLE_LABEL[role].toLowerCase()} tabs`;
              WebBrowser.openBrowserAsync(`https://www.google.com/search?q=${encodeURIComponent(q)}`).catch(() => {});
            }}
            style={[styles.tabsBtn, card]}
          >
            <Text style={[styles.tabsText, { color: colors.text }]}>Find {ROLE_LABEL[role].toLowerCase()} tabs</Text>
            <ExternalLink size={16} color="#10B981" />
          </TouchableOpacity>
        )}

        {isSinger && (
          <View style={[styles.lyricsBox, card]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LYRICS</Text>
            {lyricsLoading ? (
              <ActivityIndicator color="#10B981" />
            ) : lyrics?.plain_lyrics ? (
              <Text style={[styles.lyrics, { color: colors.text }]}>{lyrics.plain_lyrics}</Text>
            ) : (
              <Text style={{ color: colors.textDim }}>No lyrics saved for this song yet.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 60, gap: 16, maxWidth: 680, width: '100%', alignSelf: 'center' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hint: { fontSize: 13, lineHeight: 19 },
  playerBox: { padding: 10, borderRadius: 16, borderWidth: 1, gap: 10 },
  playerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  nextText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  tabsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1 },
  tabsText: { fontSize: 14, fontWeight: '700' },
  lyricsBox: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  lyrics: { fontSize: 15, lineHeight: 24 },
});
