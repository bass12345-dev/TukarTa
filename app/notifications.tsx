import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Bell, MessageCircle, Mail } from 'lucide-react-native';
import { useAppTheme } from '../context/theme';
import {
  AppNotification,
  useMarkNotificationsRead,
  useNotifications,
} from '../utils/hooks/useMessaging';

/** Where a tapped notification leads. */
function destinationFor(n: AppNotification): string {
  if (n.kind === 'message' && n.data?.conversation_id) return `/chat/${n.data.conversation_id}`;
  return '/messages';
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data: notifications, isLoading, error } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const hasUnread = (notifications || []).some((n) => !n.read_at);

  // Opening the screen marks everything as read.
  useEffect(() => {
    if (hasUnread) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnread]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}

        {error && (
          <Text style={[styles.hint, { color: colors.textDim }]}>Could not load notifications.</Text>
        )}

        {!isLoading && !error && (notifications || []).length === 0 && (
          <View style={styles.empty}>
            <Bell size={40} color={colors.textDim} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.hint, { color: colors.textDim }]}>
              Invitations and new messages will show up here.
            </Text>
          </View>
        )}

        {(notifications || []).map((n) => {
          const unread = !n.read_at;
          const Icon = n.kind === 'message' ? MessageCircle : Mail;
          return (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.75}
              onPress={() => router.push(destinationFor(n) as any)}
              style={[
                styles.card,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
                unread && { borderColor: colors.primary },
              ]}
              accessibilityLabel={n.title}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon size={18} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={[styles.when, { color: colors.textDim }]}>{formatWhen(n.created_at)}</Text>
                </View>
                {!!n.body && (
                  <Text style={[styles.cardBodyText, { color: colors.textDim }]} numberOfLines={2}>
                    {n.body}
                  </Text>
                )}
              </View>
              {unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', fontFamily: 'DM Sans' },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0, gap: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', fontFamily: 'DM Sans' },
  cardBodyText: { fontSize: 13, fontFamily: 'DM Sans' },
  when: { fontSize: 11, fontFamily: 'DM Sans' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', gap: 10, marginTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'DM Sans' },
  hint: { fontSize: 13, textAlign: 'center', fontFamily: 'DM Sans' },
});
