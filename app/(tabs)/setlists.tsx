import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Music, Plus, ChevronRight, Calendar } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';

const MOCK_SETLISTS = [
  { id: '1', title: 'Friday Night Gig', venue: 'The Blue Note', date: 'Oct 24, 2026', songs: 12, color: '#00D4FF' },
  { id: '2', title: 'Wedding Set', venue: 'Garden Terrace', date: 'Nov 02, 2026', songs: 25, color: '#8B5CF6' },
  { id: '3', title: 'Acoustic Solo', venue: 'Coffee House', date: 'Nov 15, 2026', songs: 8, color: '#F59E0B' },
];

export default function SetlistsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Setlists</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={20} color="#071420" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.list}>
          {MOCK_SETLISTS.map((set) => (
            <GlassCard key={set.id} style={styles.setCard} intensity={25}>
              <View style={[styles.accent, { backgroundColor: set.color }]} />
              <View style={styles.setContent}>
                <View style={styles.setMain}>
                  <Text style={styles.setLogoText}>{set.title}</Text>
                  <Text style={styles.setVenue}>{set.venue}</Text>
                </View>
                <View style={styles.setMeta}>
                   <View style={styles.metaItem}>
                      <Calendar size={12} color="var(--color-text-dim)" />
                      <Text style={styles.metaText}>{set.date}</Text>
                   </View>
                   <Pill label={`${set.songs} songs`} variant="cyan" style={{ paddingVertical: 2 }} />
                </View>
              </View>
              <ChevronRight size={20} color="var(--color-text-dim)" />
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
  addBtn: {
    backgroundColor: '#00D4FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 16,
  },
  setContent: {
    flex: 1,
    gap: 8,
  },
  setMain: {
    gap: 2,
  },
  setLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  setVenue: {
    fontSize: 13,
    color: 'var(--color-text-sec)',
    fontFamily: 'DM Sans',
  },
  setMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: 'var(--color-text-dim)',
    fontFamily: 'DM Sans',
  },
});
