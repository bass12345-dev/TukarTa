import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Music,
  Plus,
  Search,
  Star
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';

const { width } = Dimensions.get('window');

const MOCK_SONGS = [
  { id: '1', title: 'Hotel California', artist: 'Eagles', style: 'Rock', key: 'Am', time: '6:30', rating: 5, status: 'LIVE' },
  { id: '2', title: 'Paraluman', artist: 'Adie', style: 'OPM', key: 'C', time: '3:58', rating: 4, status: 'LIVE' },
  { id: '3', title: 'Kundiman', artist: 'Parokya ni Edgar', style: 'OPM', key: 'G', time: '4:10', rating: 5, status: 'LIVE' },
  { id: '4', title: 'Faithfully', artist: 'Journey', style: 'Rock', key: 'E', time: '4:26', rating: 4, status: 'LIVE' },
  { id: '5', title: 'More Than Words', artist: 'Extreme', style: 'Acoustic Pop', key: 'G', time: '5:56', rating: 5, status: 'LIVE' },
  { id: '6', title: 'Your Song', artist: 'Parokya ni Edgar', style: 'OPM', key: 'A', time: '2:48', rating: 4, status: 'LEARNING' },
  { id: '7', title: 'Magbalik', artist: 'Callalily', style: 'OPM', key: 'D', time: '4:27', rating: 3, status: 'LEARNING' },
];

const CATEGORIES = ['All', 'OPM', 'Rock', 'Pop', 'Acoustic', 'Worship'];

export default function SongDictionaryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0a1a2a']} style={StyleSheet.absoluteFill} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#F0F4FF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Song Dictionary</Text>
            <Text style={styles.headerSubtitle}>24 songs · 20 live-ready · 4 learning</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary Cards */}
        <View style={styles.statsRow}>
          <StatCard value="24" label="TOTAL" color="#00D4FF" />
          <StatCard value="20" label="LIVE" color="#10B981" />
          <StatCard value="4" label="LEARNING" color="#F59E0B" />
          <StatCard value="6" label="GENRES" color="#8B5CF6" />
        </View>
      </View>

      <ScrollView 
        stickyHeaderIndices={[1]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <GlassCard 
            intensity={10} 
            noPadding 
            contentContainerStyle={styles.searchBar}
          >
            <Search size={20} color="rgba(150, 175, 200, 0.5)" />
            <TextInput
              placeholder="Search songs, artists, keys..."
              placeholderTextColor="rgba(150, 175, 200, 0.4)"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </GlassCard>
        </View>

        {/* Filters & Sorting Sticky */}
        <View style={styles.filterStickyContainer}>
           <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.listSubHeader}>
            <Text style={styles.showingText}>Showing <Text style={{ color: '#00D4FF' }}>7</Text> songs</Text>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortText}>Sort: </Text>
              <View style={styles.sortPicker}>
                <Text style={styles.sortValue}>A → Z</Text>
                <ChevronLeft size={14} color="rgba(150, 175, 200, 0.6)" style={{ transform: [{ rotate: '-90deg' }] }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Song List Content */}
        <View style={styles.songsList}>
          {/* Live Ready Section */}
          <SectionHeader label="LIVE READY (5)" color="#10B981" />
          {MOCK_SONGS.filter(s => s.status === 'LIVE').map(song => (
            <SongListItem key={song.id} song={song} />
          ))}

          {/* Still Learning Section */}
          <View style={{ marginTop: 24 }}>
            <SectionHeader label="STILL LEARNING (2)" color="#F59E0B" />
            {MOCK_SONGS.filter(s => s.status === 'LEARNING').map(song => (
              <SongListItem key={song.id} song={song} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, color }: any) {
  return (
    <GlassCard style={styles.statCard} intensity={8}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function SectionHeader({ label, color }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionTitle, { color }]}>{label}</Text>
    </View>
  );
}

function SongListItem({ song }: any) {
  const iconColor = song.status === 'LIVE' ? '#00D4FF' : '#F59E0B';
  const bgColor = song.status === 'LIVE' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(245, 158, 11, 0.1)';

  return (
    <TouchableOpacity style={styles.songItem}>
      <View style={[styles.songIcon, { backgroundColor: bgColor }]}>
        <Music size={18} color={iconColor} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songSubtitle}>{song.artist} · {song.style}</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} color="#F59E0B" fill={i <= song.rating ? "#F59E0B" : "transparent"} />
          ))}
        </View>
      </View>
      <View style={styles.songMeta}>
        <View style={styles.metaTop}>
          <Pill label={song.key} variant="cyan" className="px-2" />
          <Text style={styles.timeText}>{song.time}</Text>
        </View>
        {song.status === 'LIVE' && (
          <Text style={styles.liveTag}>LIVE</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    backgroundColor: '#071420',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans Bold',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    gap: 10,
    padding: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  filterStickyContainer: {
    backgroundColor: '#071420',
    paddingVertical: 10,
  },
  filterRow: {
    marginBottom: 15,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: '#00D4FF',
  },
  categoryText: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.8)',
    fontFamily: 'DM Sans Medium',
  },
  categoryTextActive: {
    color: '#00D4FF',
    fontWeight: '700',
  },
  listSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  showingText: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans',
  },
  sortPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sortValue: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.8)',
    fontFamily: 'DM Sans Bold',
  },
  songsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'DM Sans Bold',
    letterSpacing: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  songIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 16,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  songSubtitle: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.4)',
    fontFamily: 'JetBrains Mono Bold',
  },
  liveTag: {
    fontSize: 10,
    color: '#10B981',
    fontFamily: 'DM Sans Bold',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  }
});
