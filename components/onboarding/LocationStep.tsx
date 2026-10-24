import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, ChevronRight, Globe } from 'lucide-react-native';
import { LocationPicker } from '../ui/LocationPicker';
import { StepProps } from './types';
import { useAppTheme } from '../../context/theme';

export const LocationStep: React.FC<StepProps> = ({ data, updateData }) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      <LocationPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(loc) => {
          updateData({ 
            location: loc.city,
            _lat: loc.lat,
            _lng: loc.lng,
            _fullLocation: loc.fullString
          });
        }}
      />

      <Text style={[styles.title, { color: colors.text }]}>Where are you based?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Bands look for musicians nearby. Set your base city so you get matched with local gigs.
      </Text>
      
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8}>
        <View 
          style={[
            styles.locationActionCard, 
            { backgroundColor: colors.bgCard, borderColor: colors.border }
          ]}
        >
          <View 
            style={[
              styles.locationIconBox, 
              { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }
            ]}
          >
            <MapPin size={22} color="#10B981" />
          </View>

          <View style={styles.locationInfo}>
            <Text style={[styles.locationActionTitle, { color: colors.text }]}>
              {data.location || 'Select your location'}
            </Text>
            <Text style={[styles.locationActionSub, { color: colors.textSecondary }]}>
              {data._fullLocation || 'Tap to choose your province / city'}
            </Text>
          </View>

          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <View 
        style={[
          styles.infoBox, 
          { 
            backgroundColor: isDark ? '#132821' : '#F0FDF4', 
            borderColor: colors.border 
          }
        ]}
      >
        <Globe size={18} color="#10B981" />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Accurate location helps calculate travel distances for upcoming gigs and pairs you with bands in your immediate area.
        </Text>
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
  locationActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  locationActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 3,
  },
  locationActionSub: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
});
