import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Bell, MessageSquare, UserPlus, Zap, Music2, ChevronRight, CheckCheck } from 'lucide-react-native';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'message',
    title: 'New message from Sarah',
    body: '"Hey! Are you available for the gig next week?"',
    time: '2m ago',
    tag: 'Message',
    unread: true,
    color: '#00D4FF',
    glowColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.22)',
    tagBg: 'rgba(0,212,255,0.1)',
    Icon: MessageSquare,
  },
  {
    id: '2',
    type: 'connect',
    title: 'Connection request',
    body: 'David Lim wants to connect with you.',
    time: '1h ago',
    tag: 'Connect',
    unread: true,
    color: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.22)',
    tagBg: 'rgba(139,92,246,0.1)',
    Icon: UserPlus,
  },
  {
    id: '3',
    type: 'alert',
    title: 'Setlist Update',
    body: 'The "Friday Night Gig" setlist was updated by your bandmate.',
    time: '3h ago',
    tag: 'Setlist',
    unread: false,
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.22)',
    tagBg: 'rgba(245,158,11,0.1)',
    Icon: Zap,
  },
  {
    id: '4',
    type: 'gig',
    title: 'Gig Reminder',
    body: 'You have a gig at Handuraw Café tomorrow at 8PM.',
    time: '5h ago',
    tag: 'Reminder',
    unread: false,
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.22)',
    tagBg: 'rgba(16,185,129,0.1)',
    Icon: Music2,
  },
];

const FILTERS = ['All', 'Unread', 'Message', 'Setlist'];

export default function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return n.unread;
    return n.tag === activeFilter;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
          <Text style={styles.title}>Alerts</Text>
        </View>
        <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead} activeOpacity={0.7}>
          <CheckCheck size={14} color="#00D4FF" />
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary Bar ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Bell size={13} color="#00D4FF" />
          <Text style={styles.summaryChipText}>{notifications.length} alerts</Text>
        </View>
        {unreadCount > 0 && (
          <View style={[styles.summaryChip, styles.summaryChipUnread]}>
            <View style={styles.unreadDot} />
            <Text style={[styles.summaryChipText, { color: '#00D4FF' }]}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notification Cards ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((notif) => {
          const Icon = notif.Icon;
          return (
            <TouchableOpacity key={notif.id} activeOpacity={0.8}>
              <View style={[styles.card, { borderColor: notif.borderColor }, notif.unread && styles.cardUnread]}>
                {/* Top accent stripe */}
                <View style={[styles.topAccent, { backgroundColor: notif.color }]} />

                {/* Card body */}
                <View style={styles.cardInner}>
                  {/* Icon + Title Row */}
                  <View style={styles.cardTop}>
                    <View style={[styles.iconBubble, { backgroundColor: notif.glowColor }]}>
                      <Icon size={18} color={notif.color} />
                    </View>
                    <View style={styles.titleArea}>
                      <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                      <Text style={styles.notifBody} numberOfLines={1}>{notif.body}</Text>
                    </View>
                    <View style={[styles.tagBadge, { backgroundColor: notif.tagBg, borderColor: notif.borderColor }]}>
                      <Text style={[styles.tagText, { color: notif.color }]}>{notif.tag}</Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      {notif.unread && <View style={[styles.unreadPip, { backgroundColor: notif.color }]} />}
                      <Text style={styles.timeText}>{notif.time}</Text>
                    </View>
                    <ChevronRight size={16} color={notif.color} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="rgba(255,255,255,0.08)" />
            <Text style={styles.emptyTitle}>No alerts</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 1.8,
    marginBottom: 4,
    fontFamily: 'DM Sans',
    opacity: 0.85,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 4,
  },
  markReadText: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },

  /* Summary */
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryChipUnread: {
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderColor: 'rgba(0,212,255,0.2)',
  },
  summaryChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DM Sans',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D4FF',
  },

  /* Filters */
  filterRow: {
    height: 44,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  filterPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderColor: '#00D4FF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  filterTextActive: {
    color: '#00D4FF',
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
    paddingTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topAccent: {
    height: 3,
    width: '100%',
    opacity: 0.9,
  },
  cardInner: {
    padding: 16,
    gap: 12,
  },

  /* Card top row */
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleArea: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  notifBody: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DM Sans',
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    letterSpacing: 0.3,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  /* Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  unreadPip: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'DM Sans',
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans Bold',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.15)',
    fontFamily: 'DM Sans',
  },
});
