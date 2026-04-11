import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Pill } from '../ui/Pill';
import { GENRES, AVAILABILITY } from './constants';
import { StepProps } from './types';

export const GenreStep: React.FC<StepProps> = ({ data, updateData }) => {
  const toggleGenre = (genre: string) => {
    const newGenres = data.selectedGenres.includes(genre)
      ? data.selectedGenres.filter(g => g !== genre)
      : [...data.selectedGenres, genre];
    updateData({ selectedGenres: newGenres });
  };

  const toggleAvailability = (item: string) => {
    const newAvail = data.selectedAvailability.includes(item)
      ? data.selectedAvailability.filter(i => i !== item)
      : [...data.selectedAvailability, item];
    updateData({ selectedAvailability: newAvail });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What genres do you play?</Text>
      <Text style={styles.subtitle}>Pick at least 1. Bands filter by genre when searching for musicians.</Text>
      
      <View style={styles.tagGrid}>
         {GENRES.map((genre) => (
           <TouchableOpacity 
             key={genre} 
             onPress={() => toggleGenre(genre)}
           >
             <Pill
               label={genre}
               variant={data.selectedGenres.includes(genre) ? "cyan" : "outline"}
               style={styles.genreTag}
             />
           </TouchableOpacity>
         ))}
      </View>

      <Text style={styles.sectionTitle}>AVAILABLE FOR</Text>
      <View style={styles.availabilityList}>
         {AVAILABILITY.map((item) => {
            const isActive = data.selectedAvailability.includes(item);
            return (
              <TouchableOpacity 
                key={item} 
                onPress={() => toggleAvailability(item)}
              >
                <GlassCard 
                  style={[styles.availCard, isActive && styles.availCardActive]}
                  intensity={isActive ? 20 : 5}
                >
                  <View style={[styles.tagDot, { backgroundColor: isActive ? '#00D4FF' : 'rgba(150, 175, 200, 0.3)' }]} />
                  <Text style={styles.availText}>{item}</Text>
                </GlassCard>
              </TouchableOpacity>
            );
         })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  genreTag: { paddingHorizontal: 20, height: 44 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', fontFamily: 'DM Sans Bold', marginBottom: 12 },
  availabilityList: { gap: 12 },
  availCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderRadius: 16 },
  availCardActive: { borderColor: 'rgba(0, 212, 255, 0.3)' },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { color: '#FFF', fontSize: 14, fontFamily: 'DM Sans Medium' },
});
