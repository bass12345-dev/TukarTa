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
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, FlatList } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { useInfiniteMySongs } from '../../utils/hooks/useSongs';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'OPM', 'Rock', 'Pop', 'Acoustic', 'Worship'];

export default function SongDictionaryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteMySongs(20);

  // 1. Flatten pages into a single array
  const allSongs = data?.pages.flat() || [];

  // 2. Process data: calculation stats
  const totalCount = allSongs.length;
  const liveCount = allSongs.filter(s => s.can_perform_live).length;
  const learningCount = totalCount - liveCount;
  const uniqueGenres = new Set(allSongs.map(s => (s.song as any)?.genre).filter(Boolean)).size;

  // 3. Filter data
  const filteredSongs = allSongs.filter(item => {
    const song = item.song as any;
    if (!song) return false;
    
    // Search filter
    const searchMatch = search.toLowerCase() === '' || 
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const categoryMatch = activeCategory === 'All' || 
      song.genre === activeCategory;
      
    return searchMatch && categoryMatch;
  });

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#F0F4FF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Song Dictionary</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} songs · {liveCount} live-ready
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push('/songs/add')}
          >
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={String(totalCount)} label="TOTAL" color="#00D4FF" />
          <StatCard value={String(liveCount)} label="LIVE" color="#10B981" />
          <StatCard value={String(learningCount)} label="LEARNING" color="#F59E0B" />
          <StatCard value={String(uniqueGenres)} label="GENRES" color="#8B5CF6" />
        </View>
      </View>

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
          <Text style={styles.showingText}>Showing <Text style={{ color: '#00D4FF' }}>{filteredSongs.length}</Text> songs</Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort: </Text>
            <View style={styles.sortPicker}>
              <Text style={styles.sortValue}>Recent</Text>
              <ChevronLeft size={14} color="rgba(150, 175, 200, 0.6)" style={{ transform: [{ rotate: '-90deg' }] }} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#00D4FF" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
        <Text style={styles.loaderText}>Fetching your repertoire...</Text>
      </View>
    );

    return (
      <View style={styles.emptyContainer}>
        <Music size={48} color="rgba(150, 175, 200, 0.2)" />
        <Text style={styles.emptyTitle}>
          {search ? "No matches found" : "Your dictionary is empty"}
        </Text>
        <Text style={styles.emptySubtitle}>
          {search ? "Try adjusting your search or filters" : "Start adding songs manually or via screenshot!"}
        </Text>
        {!search && (
          <Button 
            title="Add first song" 
            variant="cyan"
            onPress={() => router.push('/songs/add')}
            style={{ marginTop: 20 }}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0a1a2a']} style={StyleSheet.absoluteFill} />

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => (item.song as any).id}
        renderItem={({ item }) => <SongListItem item={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />
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

function SongListItem({ item }: { item: any }) {
  const song = item.song;
  const isLive = item.can_perform_live;
  const iconColor = isLive ? '#00D4FF' : '#F59E0B';
  const bgColor = isLive ? 'rgba(0, 212, 255, 0.1)' : 'rgba(245, 158, 11, 0.1)';

  return (
    <TouchableOpacity style={styles.songItem}>
      <View style={[styles.songIcon, { backgroundColor: bgColor }]}>
        <Music size={18} color={iconColor} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songSubtitle}>{song.artist} · {song.genre || 'General'}</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} color="#F59E0B" fill={i <= item.confidence_level ? "#F59E0B" : "transparent"} />
          ))}
        </View>
      </View>
      <View style={styles.songMeta}>
        <View style={styles.metaTop}>
          {song.original_key && <Pill label={song.original_key} variant="cyan" />}
          {song.bpm && <Text style={styles.timeText}>{song.bpm} BPM</Text>}
        </View>
        {isLive && (
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
    marginTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    gap: 10,
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
    paddingHorizontal: 20,
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
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'DM Sans Bold',
    marginTop: 10,
  },
  emptySubtitle: {
    color: 'rgba(150, 175, 200, 0.6)',
    fontSize: 14,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  footerLoaderText: {
    color: 'rgba(150, 175, 200, 0.5)',
    fontSize: 12,
    fontFamily: 'DM Sans',
  }
});
