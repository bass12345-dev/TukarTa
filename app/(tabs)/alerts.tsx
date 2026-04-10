import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Bell, MessageSquare, UserPlus, Zap, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'message', title: 'New message from Sarah', body: '"Hey! Are you available for the gig next week?"', time: '2m ago', icon: <MessageSquare size={16} color="#00D4FF" />, color: 'cyan' },
  { id: '2', type: 'connect', title: 'Connection request', body: 'David Lim wants to connect with you.', time: '1h ago', icon: <UserPlus size={16} color="#8B5CF6" />, color: 'purple' },
  { id: '3', type: 'alert', title: 'Setlist Update', body: 'The "Friday Night Gig" setlist was updated.', time: '3h ago', icon: <Zap size={16} color="#F59E0B" />, color: 'gold' },
];

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <TouchableOpacity style={styles.markRead}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.list}>
          {MOCK_NOTIFICATIONS.map((notif) => (
            <GlassCard key={notif.id} style={styles.notifCard} intensity={25}>
              <Orb variant={notif.color as any} size={40}>
                {notif.icon}
              </Orb>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                   <Text style={styles.notifTitle}>{notif.title}</Text>
                   <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
                <Text style={styles.notifBody} numberOfLines={2}>
                  {notif.body}
                </Text>
              </View>
              <ChevronRight size={16} color="var(--color-text-dim)" />
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--color-bg)',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  markRead: {
    padding: 4,
  },
  markReadText: {
    fontSize: 13,
    color: '#00D4FF',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  list: {
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 14,
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  notifTime: {
    fontSize: 10,
    color: 'var(--color-text-dim)',
    fontFamily: 'DM Sans',
  },
  notifBody: {
    fontSize: 12.5,
    color: 'var(--color-text-sec)',
    lineHeight: 18,
    fontFamily: 'DM Sans',
  },
});
