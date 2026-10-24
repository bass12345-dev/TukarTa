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
import { X, Calendar, MapPin, Clock, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Button } from '../ui/Button';
import { useMyBands, useCreateGig, useCreateBand } from '../../utils/hooks/useMusician';
import { useAppTheme } from '../../context/theme';

interface CreateGigModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGigModal({ visible, onClose }: CreateGigModalProps) {
  const { colors, isDark } = useAppTheme();
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: bands, isLoading: loadingBands } = useMyBands();
  const createGig = useCreateGig();
  const createBand = useCreateBand();

  // Auto-select the only band
  React.useEffect(() => {
    const onlyBand = bands && bands.length === 1 ? (bands[0] as any)?.band : null;
    const resolvedId = Array.isArray(onlyBand) ? onlyBand[0]?.id : onlyBand?.id;
    if (!selectedBandId && resolvedId) {
      setSelectedBandId(resolvedId);
    }
  }, [bands, selectedBandId]);

  const handleCreate = async () => {
    setErrorMsg(null);

    if (!name.trim() || !venue.trim()) {
      setErrorMsg('Please enter a gig name and venue.');
      return;
    }

    setIsSaving(true);
    try {
      let bandId = selectedBandId;

      if (!bandId) {
        if (bands && bands.length > 1) {
          setErrorMsg('Please select which band this gig is for.');
          return;
        }
        // No band yet: create a personal solo band so the gig has an owner
        const solo = await createBand.mutateAsync({
          name: 'My Band',
          genres: [],
          city: '',
        });
        bandId = solo.id;
      }

      await createGig.mutateAsync({
        bandId: bandId!,
        name: name.trim(),
        venue: venue.trim(),
        date: dateObj.toISOString(),
        duration: parseInt(duration) || 60,
      });
      
      onClose();
      setName('');
      setVenue('');
      setDateObj(new Date());
      setDuration('60');
      setSelectedBandId(null);
    } catch (error: any) {
      console.error('Failed to create gig:', error);
      setErrorMsg(error?.message || 'Could not create the gig. Please try again.');
    } finally {
      setIsSaving(false);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={25} style={styles.backdrop} tint={isDark ? 'dark' : 'light'}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>SCHEDULE PERFORMANCE</Text>
                <Text style={[styles.title, { color: colors.text }]}>New Gig</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.closeBtn, { backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4' }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Band Select */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT BAND *</Text>
              {loadingBands ? (
                <ActivityIndicator color="#10B981" style={{ marginBottom: 16 }} />
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.bandScroll}
                  contentContainerStyle={styles.bandScrollContent}
                >
                  {bands?.map((item: any) => {
                    const isSelected = selectedBandId === item.band.id;
                    return (
                      <TouchableOpacity
                        key={item.band.id}
                        style={[
                          styles.bandItem,
                          {
                            backgroundColor: isSelected ? '#10B981' : colors.bgSecondary,
                            borderColor: isSelected ? '#10B981' : colors.border,
                          }
                        ]}
                        onPress={() => setSelectedBandId(item.band.id)}
                      >
                        <View style={[styles.bandAvatar, { backgroundColor: isSelected ? '#047857' : (isDark ? '#1F3F34' : '#F0FDF4') }]}>
                          <Users size={14} color={isSelected ? '#FFFFFF' : '#10B981'} />
                        </View>
                        <Text style={[styles.bandName, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {item.band.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Gig Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>GIG NAME</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: colors.inputText }]}
                    placeholder="e.g. Saturday Night Live Set"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Venue */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>VENUE / LOCATION</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <MapPin size={18} color="#10B981" />
                  <TextInput
                    style={[styles.input, { color: colors.inputText }]}
                    placeholder="e.g. Route 196, Katipunan"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>DATE & TIME</Text>
                  <TouchableOpacity 
                    style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    onPress={() => setShowPicker(true)}
                  >
                    <Calendar size={18} color="#10B981" />
                    <Text style={[styles.inputText, { color: colors.text }]}>
                      {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Duration */}
                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>DURATION (MIN)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <Clock size={18} color="#10B981" />
                    <TextInput
                      style={[styles.input, { color: colors.inputText }]}
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                </View>
              </View>

              {/* Date Picker Component */}
              {showPicker && (
                <View style={[styles.pickerContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <DateTimePicker
                    value={dateObj}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    textColor={colors.text}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      style={styles.doneBtn}
                      onPress={() => setShowPicker(false)}
                    >
                      <Text style={styles.doneBtnText}>Confirm Date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {errorMsg && (
                <Text style={{ color: '#EF4444', fontSize: 12, width: '100%', marginBottom: 8, textAlign: 'center' }}>
                  {errorMsg}
                </Text>
              )}
              <Button
                title="Cancel"
                variant="outline-mint"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? "Creating..." : "Create Gig"}
                variant="mint"
                onPress={handleCreate}
                style={{ flex: 2 }}
                disabled={isSaving}
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
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    maxHeight: 480,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  bandScroll: {
    marginBottom: 16,
  },
  bandScrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  bandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  bandAvatar: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandName: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  inputText: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerContainer: {
    borderRadius: 20,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
});
