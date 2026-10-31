import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Music, MapPin, Tag, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { LocationPicker } from '../ui/LocationPicker';
import { useCreateBand } from '../../utils/hooks/useMusician';

interface CreateBandModalProps {
  visible: boolean;
  onClose: () => void;
}

const GENRE_OPTIONS = ['OPM', 'Rock', 'Pop', 'Acoustic', 'Jazz', 'Alternative', 'Reggae', 'Funk'];

export function CreateBandModal({ visible, onClose }: CreateBandModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<{ lat: string | null, lng: string | null }>({ lat: null, lng: null });
  const [showPicker, setShowPicker] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  const createBand = useCreateBand();
  const insets = useSafeAreaInsets();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const handleCreate = async () => {
    if (!name || !city || selectedGenres.length === 0) return;
    
    try {
      await createBand.mutateAsync({
        name,
        city,
        lat: coords.lat ? parseFloat(coords.lat) : null,
        lng: coords.lng ? parseFloat(coords.lng) : null,
        genres: selectedGenres
      });
      setName('');
      setCity('');
      setCoords({ lat: null, lng: null });
      setSelectedGenres([]);
      onClose();
    } catch (error) {
      console.error('Error creating band:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create a New Band</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BAND NAME</Text>
              <View style={styles.inputWrapper}>
                <Music size={18} color="rgba(255,255,255,0.2)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. The Night Owls"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>BASE CITY</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <MapPin size={18} color="rgba(255,255,255,0.2)" style={styles.inputIcon} />
                <Text style={[styles.inputText, !city && { color: 'rgba(255,255,255,0.2)' }]}>
                  {city || 'Select City'}
                </Text>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', right: 16 }} />
              </TouchableOpacity>
            </View>

            <LocationPicker
              visible={showPicker}
              onClose={() => setShowPicker(false)}
              onSelect={(loc) => {
                setCity(loc.city);
                setCoords({ lat: loc.lat, lng: loc.lng });
              }}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GENRES (Select at least one)</Text>
              <View style={styles.genreGrid}>
                {GENRE_OPTIONS.map(genre => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <TouchableOpacity
                      key={genre}
                      onPress={() => toggleGenre(genre)}
                      style={[styles.genreChip, active && styles.genreChipActive]}
                    >
                      <Text style={[styles.genreText, active && styles.genreTextActive]}>{genre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 40 : 24) }]}>
            <Button
              title="Create Band"
              variant="cyan"
              onPress={handleCreate}
              isLoading={createBand.isPending}
              disabled={!name || !city || selectedGenres.length === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111A18',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
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
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: 'DM Sans Bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  inputText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  genreChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: '#00D4FF',
  },
  genreText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DM Sans Medium',
  },
  genreTextActive: {
    color: '#00D4FF',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
});
