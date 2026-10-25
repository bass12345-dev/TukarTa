import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { CloudOff, LogIn, Music2, Play, Trash2, WifiOff } from 'lucide-react-native';
import React from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';
import { useConnectivity } from '../context/connectivity';
import { useAppTheme } from '../context/theme';
import {
  deleteOfflineGigPackage,
  listOfflineGigPackages,
  OfflineGigPackage,
} from '../utils/offlineManager';

/** Home for Offline Gig Mode: every gig package downloaded on this device, one tap from Stage Mode. */
export default function OfflineGigsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isOfflineGuest, signOut, session } = useAuth();
  const { isOnline } = useConnectivity();
  const [packages, setPackages] = React.useState<OfflineGigPackage[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setPackages(await listOfflineGigPackages());
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (pkg: OfflineGigPackage) => {
    Alert.alert('Remove offline copy?', `"${pkg.gigName}" will no longer be available without internet.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteOfflineGigPackage(pkg.setlistId);
          load();
        },
      },
    ]);
  };

  const handleLeave = async () => {
    if (isOfflineGuest) {
      await signOut(); // clears offline guest; root guard then returns to login
      router.replace('/login');
    } else {
      router.replace(session ? '/(tabs)' : '/login');
    }
  };

  const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString() : '');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 12 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: isOnline ? '#10B981' : '#B45309' }]}>
          {isOnline ? <Music2 size={20} color="#FFFFFF" /> : <WifiOff size={20} color="#FFFFFF" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Offline Gigs</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isOnline ? 'Saved on this device — works without internet' : "You're offline — your saved gigs still work"}
          </Text>
        </View>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.setlistId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={load}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.bgCard}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={[styles.empty, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <CloudOff size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No offline gigs yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                While you have internet, open a setlist and choose "Prepare for Offline Gig" to save its songs, lyrics and chords on this phone.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const ready = item.songs.filter((s) => s.status === 'ready').length;
          return (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.gigName}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[item.bandName, item.venue].filter(Boolean).join(' • ') || 'Setlist'}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {ready}/{item.songs.length} songs ready · saved {formatDate(item.savedAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Remove offline copy"
              >
                <Trash2 size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/stage-mode', params: { setlistId: item.setlistId } })}
              >
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playText}>Stage</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity style={[styles.leaveBtn, { borderColor: colors.border }]} onPress={handleLeave}>
          <LogIn size={16} color={colors.primary} />
          <Text style={[styles.leaveText, { color: colors.text }]}>
            {isOfflineGuest ? 'Sign in to your account' : 'Back to app'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'DM Sans', fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'DM Sans' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 6 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
  },
  playText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  empty: { alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 20, padding: 28, marginTop: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 20 },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
  },
  leaveText: { fontSize: 14, fontWeight: '700' },
});
