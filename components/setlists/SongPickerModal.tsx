import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Search, Music, Plus, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useMyKnownSongs, useAddSongToSetlist } from '../../utils/hooks/useMusician';
import { useAppTheme } from '../../context/theme';

interface SongPickerModalProps {
  visible: boolean;
  onClose: () => void;
  setlistId: string;
  currentSongCount: number;
}

export function SongPickerModal({ visible, onClose, setlistId, currentSongCount }: SongPickerModalProps) {
  const { colors, isDark } = useAppTheme();
  const [search, setSearch] = useState('');
  const { data: knownSongs, isLoading } = useMyKnownSongs();
  const addSong = useAddSongToSetlist();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const filteredSongs = knownSongs?.filter((item: any) => 
    item.song.title.toLowerCase().includes(search.toLowerCase()) ||
    item.song.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (songId: string) => {
    try {
      await addSong.mutateAsync({
        setlistId,
        songId,
        position: currentSongCount + addedIds.size + 1
      });
      setAddedIds(prev => new Set([...prev, songId]));
    } catch (error) {
      console.error('Failed to add song:', error);
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
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR REPERTOIRE</Text>
              <Text style={[styles.title, { color: colors.text }]}>Add Song</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeBtn, { backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4' }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Search size={18} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder="Search your songs..."
              placeholderTextColor={colors.inputPlaceholder}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
            ) : filteredSongs?.length === 0 ? (
              <View style={styles.emptyState}>
                <Music size={40} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No matching songs found</Text>
              </View>
            ) : (
              filteredSongs?.map((item: any) => {
                const isAdded = addedIds.has(item.song.id);
                return (
                  <TouchableOpacity 
                    key={item.song.id} 
                    style={[styles.songItem, { borderBottomColor: colors.border }]}
                    onPress={() => !isAdded && handleAdd(item.song.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.songIcon, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                      <Music size={16} color="#10B981" />
                    </View>
                    <View style={styles.songInfo}>
                      <Text style={[styles.songTitle, { color: colors.text }]}>{item.song.title}</Text>
                      <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{item.song.artist}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.addIconBtn, 
                        { borderColor: colors.border },
                        isAdded && { backgroundColor: '#10B981', borderColor: '#10B981' }
                      ]}
                      onPress={() => !isAdded && handleAdd(item.song.id)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <Plus size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  list: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  songIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  addIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
});
