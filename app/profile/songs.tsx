import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Music,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Sparkles
} from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Pill } from '../../components/ui/Pill';
import { useInfiniteMySongs, useDeleteMySong } from '../../utils/hooks/useSongs';
import { useAppTheme } from '../../context/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'All',
  'OPM',
  'Rock',
  'Pop',
  'Acoustic',
  'Worship',
  'Ballad',
  'Hip-Hop',
  'R&B',
  'Electronic',
  'Country',
  'Jazz',
  'Classical',
  'Blues',
  'Folk',
  'Metal',
  'Punk',
  'Reggae',
  'Soul',
  'Latin'
];

export default function SongDictionaryScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
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
  const liveCount = allSongs.filter(item => item.can_perform_live).length;
  const learningCount = totalCount - liveCount;
  const uniqueGenres = new Set(allSongs.map(item => item.genre || (item.song as any)?.genre).filter(Boolean)).size;

  // 3. Filter data
  const filteredSongs = allSongs.filter(item => {
    const song = item.song as any;
    if (!song) return false;
    
    // Search filter
    const searchMatch = search.toLowerCase() === '' || 
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const effectiveGenre = item.genre || song.genre;
    const categoryMatch = activeCategory === 'All' || 
      effectiveGenre === activeCategory;
      
    return searchMatch && categoryMatch;
  });

  const renderHeader = () => (
    <>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Song Dictionary</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textDim }]}>
              {totalCount} songs · {liveCount} live-ready
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/songs/add')}
            activeOpacity={0.85}
          >
            <Plus size={22} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={String(totalCount)} label="TOTAL" color={colors.primary} colors={colors} />
          <StatCard value={String(liveCount)} label="LIVE" color={colors.primaryDark} colors={colors} />
          <StatCard value={String(learningCount)} label="LEARNING" color="#F59E0B" colors={colors} />
          <StatCard value={String(uniqueGenres)} label="GENRES" color={isDark ? '#A7F3D0' : '#059669'} colors={colors} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search size={18} color={colors.textDim} />
          <TextInput
            placeholder="Search songs, artists, keys..."
            placeholderTextColor={colors.inputPlaceholder}
            style={[
              styles.searchInput, 
              { color: colors.inputText },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
            ]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterStickyContainer}>
         <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat} 
                  style={[
                    styles.categoryPill, 
                    { 
                      backgroundColor: isActive ? colors.primary : colors.bgCard,
                      borderColor: isActive ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.categoryText, 
                      { 
                        color: isActive ? '#FFFFFF' : colors.text,
                        fontWeight: isActive ? '700' : '500'
                      }
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listSubHeader}>
          <Text style={[styles.showingText, { color: colors.textDim }]}>
            Showing <Text style={{ color: colors.primary, fontWeight: '700' }}>{filteredSongs.length}</Text> songs
          </Text>
        </View>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerLoaderText, { color: colors.textDim }]}>Loading more songs...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textDim }]}>Fetching your repertoire...</Text>
      </View>
    );

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Music size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {search ? "No matches found" : "Your dictionary is empty"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
          {search ? "Try adjusting your search or category filter" : "Start adding songs manually or scan with AI!"}
        </Text>
        {!search && (
          <TouchableOpacity 
            style={[styles.addFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/songs/add')}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.addFirstText}>Add First Song</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => (item.song as any).id}
        renderItem={({ item }) => <SongListItem item={item} colors={colors} isDark={isDark} />}
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

function StatCard({ value, label, color, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textDim }]}>{label}</Text>
    </View>
  );
}

function SongListItem({ item, colors, isDark }: { item: any; colors: any; isDark: boolean }) {
  const song = item.song;
  const isLive = item.can_perform_live;
  const { mutate: deleteSong, isPending: isDeleting } = useDeleteMySong();

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to remove "${song.title}" from your dictionary?`);
      if (confirmed) {
        deleteSong(song.id);
      }
      return;
    }

    Alert.alert(
      "Delete Song",
      `Are you sure you want to remove "${song.title}" from your dictionary?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteSong(song.id)
        }
      ]
    );
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={handleDelete}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Trash2 size={20} color="#FFF" />
            <Text style={styles.deleteActionText}>Delete</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable 
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}
    >
      <View 
        style={[
          styles.songItem, 
          { 
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }
        ]}
      >
        {/* Left Icon */}
        <View style={[styles.songIcon, { backgroundColor: isLive ? colors.primaryLight : (isDark ? '#2D200E' : '#FEF3C7') }]}>
          <Music size={18} color={isLive ? colors.primary : '#F59E0B'} />
        </View>

        {/* Center Info */}
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>{song.title}</Text>
          <Text style={[styles.songSubtitle, { color: colors.textDim }]} numberOfLines={1}>
            {song.artist} · {item.genre || song.genre || 'General'}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                size={11} 
                color="#F59E0B" 
                fill={i <= (item.confidence_level || 3) ? "#F59E0B" : "transparent"} 
              />
            ))}
          </View>
        </View>

        {/* Right Badges */}
        <View style={styles.songMeta}>
          <View style={styles.metaTop}>
            {song.original_key && (
              <View style={[styles.keyBadge, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text style={[styles.keyText, { color: colors.primaryDark }]}>{song.original_key}</Text>
              </View>
            )}
            {song.bpm && (
              <Text style={[styles.bpmText, { color: colors.textDim }]}>{song.bpm} BPM</Text>
            )}
          </View>
          <View 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: isLive ? (isDark ? '#14382A' : '#D1FAE5') : (isDark ? '#3D280E' : '#FEF3C7'),
                borderColor: isLive ? '#10B981' : '#F59E0B'
              }
            ]}
          >
            <Text 
              style={[
                styles.statusBadgeText, 
                { color: isLive ? (isDark ? '#34D399' : '#065F46') : '#B45309' }
              ]}
            >
              {isLive ? 'LIVE' : 'LEARNING'}
            </Text>
          </View>
        </View>

        {/* Web delete button for accessibility */}
        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={styles.webDeleteBtn} 
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.6,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
    paddingVertical: 8,
  },
  filterStickyContainer: {
    paddingBottom: 8,
  },
  filterRow: {
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  listSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  showingText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  swipeContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  songIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songSubtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 2,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  keyText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  bpmText: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  webDeleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    height: '100%',
    borderRadius: 18,
    marginLeft: 8,
    gap: 4,
  },
  deleteActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 18,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  addFirstText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontFamily: 'DM Sans',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  }
});
