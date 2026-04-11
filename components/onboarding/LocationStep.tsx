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
      
      <GlassCard 
        style={[styles.locationActionCard, { height: 70 }]} 
        contentContainerStyle={styles.roleCardContent}
        noPadding
      >
         <View style={styles.locationIconBox}>
            <MapPin size={20} color="#00D4FF" />
         </View>
         <View style={{ flex: 1, marginLeft: 16 }}>
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
                  style={[styles.cityCard, { height: 70 }, isActive && styles.cityCardActive]}
                  contentContainerStyle={styles.roleCardContent}
                  intensity={isActive ? 30 : 12}
                  noPadding
                >
                   <View style={[
                     styles.cityIconBox, 
                     { backgroundColor: isActive ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)' }
                   ]}>
                      <MapPin size={18} color={isActive ? "#00D4FF" : "rgba(255, 255, 255, 0.4)"} />
                   </View>
                   <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.cityName}>{city.name}</Text>
                      <Text style={styles.citySub}>{city.region} · {city.count}</Text>
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
  locationActionCard: { borderRadius: 24, borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 20, overflow: 'hidden' },
  roleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  locationIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0, 212, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  locationActionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  locationActionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  searchBox: {
    height: 52, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20,
  },
  searchText: { color: '#FFF', fontSize: 15, fontFamily: 'DM Sans' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', fontFamily: 'DM Sans Bold', marginBottom: 12 },
  cityList: { gap: 8 },
  cityCard: { borderRadius: 24, borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  cityCardActive: { 
    borderColor: '#00D4FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  cityIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  cityName: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  citySub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)', 
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#00D4FF', borderColor: '#00D4FF' },
});
