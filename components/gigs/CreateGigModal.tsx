import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar, MapPin, Music, Clock, ChevronRight, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Button } from '../ui/Button';
import { useMyBands, useCreateGig } from '../../utils/hooks/useMusician';
import { Pill } from '../ui/Pill';

interface CreateGigModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGigModal({ visible, onClose }: CreateGigModalProps) {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  
  const { data: bands, isLoading: loadingBands } = useMyBands();
  const createGig = useCreateGig();

  const handleCreate = async () => {
    if (!selectedBandId) {
      Alert.alert("Action Required", "Please select a band before creating a gig.");
      return;
    }

    if (!name || !venue || !dateObj) return;
    
    try {
      await createGig.mutateAsync({
        bandId: selectedBandId,
        name,
        venue,
        date: dateObj.toISOString(),
        duration: parseInt(duration) || 60,
      });
      
      onClose();
      // Reset form
      setName('');
      setVenue('');
      setDateObj(new Date());
      setDuration('60');
      setSelectedBandId(null);
    } catch (error) {
      console.error('Failed to create gig:', error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDateObj(selectedDate);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.backdrop} tint="dark">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>LOG NEW EVENT</Text>
                <Text style={styles.title}>Create Gig</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              
              {/* Band Selection */}
              <Text style={styles.label}>Select Band</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.bandScroll}
                contentContainerStyle={styles.bandScrollContent}
              >
                {loadingBands ? (
                  <ActivityIndicator color="#00D4FF" />
                ) : bands?.map((item: any) => (
                  <TouchableOpacity
                    key={item.band.id}
                    onPress={() => setSelectedBandId(item.band.id)}
                    style={[
                      styles.bandItem,
                      selectedBandId === item.band.id && styles.bandItemActive
                    ]}
                  >
                    <View style={styles.bandAvatar}>
                      <Users size={16} color={selectedBandId === item.band.id ? '#071420' : '#00D4FF'} />
                    </View>
                    <Text style={[
                      styles.bandName,
                      selectedBandId === item.band.id && styles.bandNameActive
                    ]}>
                      {item.band.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gig Name</Text>
                <View style={styles.inputWrapper}>
                  <Music size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Friday Night Jazz"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Blue Note Café"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date & Time</Text>
                  <TouchableOpacity 
                    style={styles.inputWrapper}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Calendar size={18} color="#00D4FF" />
                    <Text style={styles.inputText}>
                      {formatDateDisplay(dateObj)}
                    </Text>
                  </TouchableOpacity>

                  {showPicker && (
                    <DateTimePicker
                      value={dateObj}
                      mode="datetime"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                      textColor="#FFF"
                      themeVariant="dark"
                    />
                  )}
                </View>
                <View style={[styles.inputGroup, { width: 100 }]}>
                  <Text style={styles.label}>Min</Text>
                  <View style={styles.inputWrapper}>
                    <Clock size={16} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={styles.input}
                      placeholder="60"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={createGig.isPending ? "Creating..." : "Create Gig"}
                variant="primary"
                onPress={handleCreate}
                style={{ flex: 2 }}
                disabled={createGig.isPending}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#071420',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontFamily: 'DM Sans Bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    maxHeight: 500,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  bandScroll: {
    marginBottom: 20,
  },
  bandScrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  bandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bandItemActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  bandAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandName: {
    fontSize: 13,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  bandNameActive: {
    color: '#071420',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
