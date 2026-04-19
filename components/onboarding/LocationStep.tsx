import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Search, ChevronRight, Check, Globe } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { LocationPicker } from '../ui/LocationPicker';
import { StepProps } from './types';

export const LocationStep: React.FC<StepProps> = ({ data, updateData }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <View style={styles.container}>
      <LocationPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(loc) => {
          updateData({ 
            location: loc.city,
            // We'll store coordinates in a way that index.tsx can grab them
            // In a real app we might update the whole object
            _lat: loc.lat,
            _lng: loc.lng,
            _fullLocation: loc.fullString
          });
        }}
      />

      <Text style={styles.title}>Where are you based?</Text>
      <Text style={styles.subtitle}>Bands search for musicians nearby. Choose your city to get found.</Text>
      
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8}>
        <GlassCard 
          style={styles.locationActionCard} 
          contentContainerStyle={styles.roleCardContent}
          noPadding
        >
           <View style={styles.locationIconBox}>
              <MapPin size={20} color="#00D4FF" />
           </View>
           <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.locationActionTitle}>
                {data.location || 'Select your location'}
              </Text>
              <Text style={styles.locationActionSub}>
                {data._fullLocation || 'Country, State, City'}
              </Text>
           </View>
           <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
        </GlassCard>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Globe size={18} color="rgba(150, 175, 200, 0.4)" />
        <Text style={styles.infoText}>
          Accurate location helps us match you with gigs in your area and calculate travel distances.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  locationActionCard: { borderRadius: 24, borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 20, overflow: 'hidden', height: 80 },
  roleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  locationIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0, 212, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  locationActionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  locationActionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans', marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
});
