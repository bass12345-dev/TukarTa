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
import { X, Search, MapPin, ChevronRight, Globe } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Country, State, City } from 'country-state-city';
import { useAppTheme } from '../../context/theme';

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
  const { colors, isDark } = useAppTheme();
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
      style={[styles.item, { borderBottomColor: colors.border }]} 
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
          {step === 'country' ? <Globe size={18} color="#10B981" /> : <MapPin size={18} color="#10B981" />}
        </View>
        <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
      </View>
      <ChevronRight size={18} color={colors.textSecondary} />
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
          <BlurView intensity={25} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        </TouchableOpacity>

        <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.indicator, { backgroundColor: colors.border }]} />
          
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>
                {step === 'country' ? 'SELECT NATION' : 
                 `CITIES IN ${selectedCountry?.name?.toUpperCase() || 'PH'}`}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {step === 'country' ? 'Choose Country' : 'Search Your City'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4' }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <View style={[styles.searchWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Search size={18} color={colors.primary} />
              <TextInput
                style={[styles.searchInput, { color: colors.inputText }]}
                placeholder={step === 'country' ? "Search for a country..." : "Search for a city (e.g. Oroquieta, Cebu)..."}
                placeholderTextColor={colors.inputPlaceholder}
                value={search}
                onChangeText={setSearch}
                autoFocus={false}
              />
            </View>
          </View>

          {step !== 'country' && (
            <TouchableOpacity onPress={handleBack} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.primary }]}>← Back to Countries</Text>
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
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: SCREEN_HEIGHT * 0.85,
    borderWidth: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  backLink: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  backLinkText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    fontWeight: '600',
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
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 15,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  empty: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
});
