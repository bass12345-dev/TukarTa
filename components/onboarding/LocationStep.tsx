import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Search, ChevronRight, Check } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { CITIES } from './constants';
import { StepProps } from './types';

export const LocationStep: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you based?</Text>
      <Text style={styles.subtitle}>Bands search for musicians nearby. Choose your city.</Text>
      
      <GlassCard style={styles.locationActionCard}>
         <View style={styles.locationIconBox}>
            <MapPin size={20} color="#00D4FF" />
         </View>
         <View style={{ flex: 1 }}>
            <Text style={styles.locationActionTitle}>Use my current location</Text>
            <Text style={styles.locationActionSub}>Detect automatically via GPS</Text>
         </View>
         <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
      </GlassCard>

      <View style={styles.searchBox}>
         <Search size={18} color="rgba(255, 255, 255, 0.4)" />
         <Text style={styles.searchText}>{data.location || 'Search Cebu...'}</Text>
      </View>

      <Text style={styles.sectionTitle}>POPULAR CITIES IN THE PHILIPPINES</Text>
      <View style={styles.cityList}>
         {CITIES.map((city) => {
            const isActive = data.location === city.name;
            return (
              <TouchableOpacity 
                key={city.name} 
                onPress={() => updateData({ location: city.name })}
                activeOpacity={0.7}
              >
                <GlassCard 
                  style={[styles.cityCard, isActive && styles.cityCardActive]}
                  intensity={isActive ? 20 : 5}
                >
                   <View style={[styles.cityIconBox, { backgroundColor: isActive ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)' }]}>
                      <MapPin size={18} color={isActive ? "#00D4FF" : "rgba(255, 255, 255, 0.4)"} />
                   </View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.cityName}>{city.name}</Text>
                      <Text style={styles.citySub}>{city.region} · {city.count}</Text>
                   </View>
                   <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                     {isActive && <Check size={14} color="#FFF" />}
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
  locationActionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderRadius: 20, marginBottom: 20 },
  locationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 212, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  locationActionTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  locationActionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  searchBox: {
    height: 52, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20,
  },
  searchText: { color: '#FFF', fontSize: 15, fontFamily: 'DM Sans' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', fontFamily: 'DM Sans Bold', marginBottom: 12 },
  cityList: { gap: 12 },
  cityCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14, borderRadius: 16 },
  cityCardActive: { borderColor: 'rgba(0, 212, 255, 0.3)' },
  cityIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cityName: { fontSize: 15, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  citySub: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', 
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#00D4FF', borderColor: '#00D4FF' },
});
