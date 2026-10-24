import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Crown, Sparkles, Check, Music2 } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import { useBandSession } from '../../context/bandSession';
import { useMyGigs } from '../../utils/hooks/useMusician';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';

interface CreateSessionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultSetlistId?: string;
  defaultGigName?: string;
}

export function CreateSessionModal({
  visible,
  onClose,
  defaultSetlistId,
  defaultGigName,
}: CreateSessionModalProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { startSession } = useBandSession();
  const { data: gigs, isLoading: loadingGigs } = useMyGigs();

  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const gigTitle = selectedGig?.name || defaultGigName || 'Live Band Session';
      let sId: string | undefined = defaultSetlistId;
      if (selectedGig?.id) {
        // A gig can have several sets; pick its first one that has songs, else the first set
        const { data: sets } = await supabase
          .from('setlists')
          .select('id, setlist_songs(id)')
          .eq('gig_id', selectedGig.id)
          .order('created_at', { ascending: true });
        const withSongs = (sets || []).find((s: any) => s.setlist_songs?.length > 0);
        sId = withSongs?.id || sets?.[0]?.id;
      }
      await startSession({
        gigName: gigTitle,
        setlistId: sId,
      });

      onClose();
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#10B98115' }]}>
                <Crown size={20} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Host Band Session</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Broadcast setlist and chords to bandmates
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Select Gig Section */}
          <View style={styles.gigSelectSection}>
            <Text style={[styles.label, { color: colors.textMuted }]}>LINK TO GIG / SETLIST (OPTIONAL)</Text>
            
            {loadingGigs ? (
              <ActivityIndicator color="#10B981" style={{ padding: 12 }} />
            ) : (
              <ScrollView style={styles.gigsList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.gigOption,
                    {
                      backgroundColor: selectedGig === null ? (isDark ? '#064E3B' : '#ECFDF5') : colors.bgSecondary,
                      borderColor: selectedGig === null ? '#10B981' : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedGig(null)}
                >
                  <View style={styles.gigOptionInfo}>
                    <Text
                      style={[
                        styles.gigOptionTitle,
                        { color: selectedGig === null ? '#10B981' : colors.text },
                      ]}
                    >
                      Quick Jam / Rehearsal
                    </Text>
                    <Text style={[styles.gigOptionSub, { color: colors.textDim }]}>
                      Pick and broadcast songs on the fly
                    </Text>
                  </View>
                  {selectedGig === null && <Check size={18} color="#10B981" />}
                </TouchableOpacity>

                {gigs?.map((g: any) => {
                  const isSelected = selectedGig?.id === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.gigOption,
                        {
                          backgroundColor: isSelected ? (isDark ? '#064E3B' : '#ECFDF5') : colors.bgSecondary,
                          borderColor: isSelected ? '#10B981' : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedGig(g)}
                    >
                      <View style={styles.gigOptionInfo}>
                        <Text
                          style={[
                            styles.gigOptionTitle,
                            { color: isSelected ? '#10B981' : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {g.name}
                        </Text>
                        <Text style={[styles.gigOptionSub, { color: colors.textDim }]}>
                          {g.venue || 'Live Gig'} • {g.band?.name || 'My Band'}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#10B981" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isStarting}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: '#10B981' }]}
              onPress={handleStart}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.startBtnText}>Generate Session Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  gigSelectSection: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  gigsList: {
    maxHeight: 220,
  },
  gigOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  gigOptionInfo: {
    flex: 1,
    paddingRight: 10,
    gap: 2,
  },
  gigOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  gigOptionSub: {
    fontSize: 11.5,
    fontFamily: 'DM Sans',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  startBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
});
