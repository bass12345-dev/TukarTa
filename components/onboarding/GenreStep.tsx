import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { GENRES, AVAILABILITY } from './constants';
import { StepProps } from './types';
import { useAppTheme } from '../../context/theme';

export const GenreStep: React.FC<StepProps> = ({ data, updateData }) => {
  const { colors, isDark } = useAppTheme();

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
      <Text style={[styles.title, { color: colors.text }]}>What genres do you play?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Pick at least 1. Bands filter by repertoire genre when casting for session work or gigs.
      </Text>
      
      {/* ── Genre Tags ── */}
      <View style={styles.tagGrid}>
        {GENRES.map((genre) => {
          const isSelected = data.selectedGenres.includes(genre);
          return (
            <TouchableOpacity 
              key={genre} 
              onPress={() => toggleGenre(genre)}
              activeOpacity={0.7}
              style={[
                styles.genreChip,
                {
                  backgroundColor: isSelected ? '#10B981' : colors.bgCard,
                  borderColor: isSelected ? '#10B981' : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.genreText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                  isSelected && { fontWeight: '700' }
                ]}
              >
                {isSelected ? `✓ ${genre}` : genre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        AVAILABLE FOR
      </Text>

      {/* ── Availability List ── */}
      <View style={styles.availabilityList}>
        {AVAILABILITY.map((item) => {
          const isActive = data.selectedAvailability.includes(item);
          return (
            <TouchableOpacity 
              key={item} 
              onPress={() => toggleAvailability(item)}
              activeOpacity={0.8}
            >
              <View 
                style={[
                  styles.availCard,
                  {
                    backgroundColor: isActive 
                      ? (isDark ? '#16382C' : '#ECFDF5') 
                      : colors.bgCard,
                    borderColor: isActive ? '#10B981' : colors.border,
                    borderWidth: isActive ? 1.5 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.availText, { color: colors.text }]}>
                    {item}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isActive ? '#10B981' : colors.border },
                    isActive && styles.checkboxActive,
                  ]}
                >
                  {isActive && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    lineHeight: 20,
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 1,
    marginBottom: 10,
  },
  availabilityList: {
    gap: 10,
  },
  availCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  availText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
});
