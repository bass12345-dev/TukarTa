import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Star } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';

const MOCK_MUSICIANS = [
  {
    id: '1',
    name: 'Lara Cruz',
    initials: 'LC',
    role: 'Singer · OPM, Pop, Rock',
    location: 'Cebu City',
    match: '9 match',
    rating: '4.9',
    reviews: '28',
    color: '#1E40AF',
  },
  {
    id: '2',
    name: 'Karl Mendoza',
    initials: 'KM',
    role: 'Singer · Rock, OPM, Acoustic',
    location: 'Mandaue',
    match: '7 match',
    rating: '4.7',
    reviews: '15',
    color: '#1E3A8A',
  },
  {
    id: '3',
    name: 'Anna Torres',
    initials: 'AT',
    role: 'Singer · OPM, Jazz, Soul',
    location: 'Cebu City',
    match: '6 match',
    rating: '4.8',
    reviews: '42',
    color: '#065F46',
  },
];

const FILTERS = ['Singer', 'Guitarist', 'Bassist', 'Drummer', 'Keys'];

export default function DiscoverScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Discover musicians</Text>
        
        <View style={styles.searchWrapper}>
           <Search size={18} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
           <TextInput 
             placeholder="Search by name, genre, or song..." 
             placeholderTextColor="rgba(255, 255, 255, 0.25)"
             style={styles.searchInput}
           />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={f} style={[styles.filterPill, i === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sortingLabel}>Singers near Cebu City · sorted by song match</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {MOCK_MUSICIANS.map((m) => (
            <GlassCard key={m.id} style={styles.playerCard} intensity={15}>
               <View style={[styles.avatarFixed, { backgroundColor: m.color }]}>
                  <Text style={styles.avatarText}>{m.initials}</Text>
               </View>

               <View style={styles.playerMain}>
                  <View style={styles.playerHeader}>
                     <Text style={styles.playerName}>{m.name}</Text>
                     <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>♪ {m.match}</Text>
                     </View>
                  </View>
                  
                  <Text style={styles.playerRole}>{m.role}</Text>

                  <View style={styles.playerMeta}>
                     <View style={styles.ratingRow}>
                        <View style={styles.stars}>
                           {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />)}
                        </View>
                        <Text style={styles.ratingText}>{m.rating} ({m.reviews})</Text>
                     </View>
                     <Text style={styles.dot}>·</Text>
                     <Text style={styles.locationText}>{m.location}</Text>
                  </View>
               </View>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: 'var(--color-text)',
    fontFamily: 'DM Sans',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: '#00D4FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'DM Sans',
  },
  filterTextActive: {
    color: '#00D4FF',
  },
  sortingLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    marginBottom: 16,
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  playerCard: {
    padding: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarFixed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  playerMain: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: -2,
  },
  matchText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  playerRole: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
    marginBottom: 5,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
  dot: {
    marginHorizontal: 8,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    fontFamily: 'DM Sans',
  },
});
