import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
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
                activeOpacity={0.8}
              >
                <GlassCard 
                  style={[styles.availCard, { height: 70 }, isActive && styles.availCardActive]}
                  contentContainerStyle={styles.roleCardContent}
                  intensity={isActive ? 30 : 12}
                  noPadding
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.availText}>{item}</Text>
                  </View>
                  <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                    {isActive && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </View>
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
  sectionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', fontFamily: 'DM Sans Bold', marginBottom: 16 },
  availabilityList: { gap: 8 },
  roleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  availCard: { 
    borderRadius: 24, 
    borderWidth: 1.2, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden'
  },
  availCardActive: { 
    borderColor: '#00D4FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  availText: { color: '#FFF', fontSize: 16, fontFamily: 'DM Sans Bold' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)', 
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#00D4FF', borderColor: '#00D4FF' },
});
