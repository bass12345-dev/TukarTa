import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { X, Search, MapPin, ChevronRight, Globe, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Country, State, City } from 'country-state-city';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: {
    city: string;
    state: string;
    country: string;
    lat: string | null;
    lng: string | null;
    fullString: string;
  }) => void;
  initialCountryCode?: string;
}

export function LocationPicker({ visible, onClose, onSelect, initialCountryCode = 'PH' }: LocationPickerProps) {
  const [step, setStep] = useState<'country' | 'city'>('city');
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Initialize with PH
  useEffect(() => {
    if (visible && initialCountryCode) {
      const country = Country.getCountryByCode(initialCountryCode);
      if (country) {
        setSelectedCountry(country);
        setStep('city');
      }
    }
  }, [visible]);

  const listData = useMemo(() => {
    const query = search.toLowerCase();
    
    if (step === 'country') {
      const countries = Country.getAllCountries();
      return countries.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.isoCode.toLowerCase().includes(query)
      );
    }
    
    if (step === 'city') {
      if (!selectedCountry) return [];
      const cities = City.getCitiesOfCountry(selectedCountry.isoCode) || [];
      
      if (!query) {
        // Show priority cities or just some sample cities
        return cities.slice(0, 50);
      }
      
      return cities.filter(c => c.name.toLowerCase().includes(query)).slice(0, 50);
    }
    
    return [];
  }, [step, selectedCountry, search]);

  const handleBack = () => {
    if (step === 'city') {
      setStep('country');
      setSearch('');
      setSelectedCountry(null);
    } else {
      onClose();
    }
  };

  const handleSelectItem = (item: any) => {
    if (step === 'country') {
      setSelectedCountry(item);
      setStep('city');
      setSearch('');
    } else if (step === 'city') {
      const state = State.getStateByCodeAndCountry(item.stateCode, selectedCountry.isoCode);
      onSelect({
        city: item.name,
        state: state?.name || item.stateCode,
        country: selectedCountry.name,
        lat: item.latitude || null,
        lng: item.longitude || null,
        fullString: `${item.name}, ${state?.name || item.stateCode}`
      });
      onClose();
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          {step === 'country' ? <Globe size={18} color="#00D4FF" /> : <MapPin size={18} color="#00D4FF" />}
        </View>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
      <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </TouchableOpacity>

        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {step === 'country' ? 'SELECT NATION' : 
                 `CITIES IN ${selectedCountry?.name.toUpperCase()}`}
              </Text>
              <Text style={styles.title}>
                {step === 'country' ? 'Choose Country' : 
                 'Search Your City'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="rgba(255,255,255,0.3)" />
              <TextInput
                style={styles.searchInput}
                placeholder={step === 'country' ? "Search for a country..." : "Search for a city (e.g. Oroquieta)..."}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={search}
                onChangeText={setSearch}
                autoFocus={false}
              />
            </View>
          </View>

          {step !== 'country' && (
            <TouchableOpacity onPress={handleBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back to Countries</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={listData}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A1A2F',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: SCREEN_HEIGHT * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  backLink: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans Medium',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontFamily: 'DM Sans Medium',
  },
  empty: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
});
