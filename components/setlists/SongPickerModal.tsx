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
import { GlassCard } from '../ui/GlassCard';

interface SongPickerModalProps {
  visible: boolean;
  onClose: () => void;
  setlistId: string;
  currentSongCount: number;
}

export function SongPickerModal({ visible, onClose, setlistId, currentSongCount }: SongPickerModalProps) {
  const [search, setSearch] = useState('');
  const { data: knownSongs, isLoading } = useMyKnownSongs();
  const addSong = useAddSongToSetlist();

  const filteredSongs = knownSongs?.filter((item: any) => 
    item.song.title.toLowerCase().includes(search.toLowerCase()) ||
    item.song.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (songId: string) => {
    try {
      await addSong.mutateAsync({
        setlistId,
        songId,
        position: currentSongCount + 1
      });
      // Optionally keep it open for multiple adds, but let's close for now or provide feedback
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
      <BlurView intensity={40} style={styles.backdrop} tint="dark">
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR REPERTOIRE</Text>
              <Text style={styles.title}>Add Song</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={18} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your songs..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator color="#00D4FF" style={{ marginTop: 40 }} />
            ) : filteredSongs?.length === 0 ? (
              <View style={styles.emptyState}>
                <Music size={40} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>No matching songs found</Text>
              </View>
            ) : (
              filteredSongs?.map((item: any) => (
                <TouchableOpacity 
                  key={item.song.id} 
                  style={styles.songItem}
                  onPress={() => handleAdd(item.song.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.songIcon}>
                    <Music size={16} color="#00D4FF" />
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{item.song.title}</Text>
                    <Text style={styles.songArtist}>{item.song.artist}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addIconBtn}
                    onPress={() => handleAdd(item.song.id)}
                  >
                    <Plus size={20} color="#00D4FF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
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
    backgroundColor: '#071420',
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
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
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  songIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  addIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans',
  },
});
