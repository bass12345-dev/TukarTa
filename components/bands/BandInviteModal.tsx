import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { X, Search, UserPlus, Music, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Button } from '../ui/Button';
import { supabase } from '../../utils/supabase';
import { useInviteMusician, profileOf } from '../../utils/hooks/useMusician';

interface BandInviteModalProps {
  visible: boolean;
  onClose: () => void;
  bandId: string;
  bandName: string;
}

export function BandInviteModal({ visible, onClose, bandId, bandName }: BandInviteModalProps) {
  const [query, setQuery] = useState('');
  const [musicians, setMusicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const inviteMutation = useInviteMusician();

  useEffect(() => {
    if (query.length > 2) {
      searchMusicians();
    } else {
      setMusicians([]);
    }
  }, [query]);

  const searchMusicians = async () => {
    setLoading(true);
    try {
      // Find users who have musician profiles and match the name/email
      const { data, error } = await supabase
        .from('users')
        .select('*, musician_profiles(*)')
        .or(`display_name.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      setMusicians(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedId) return;
    
    try {
      await inviteMutation.mutateAsync({
        bandId,
        musicianId: selectedId,
        message: message || `Hey! Join ${bandName} on Setlist AI.`
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setSelectedId(null);
        setQuery('');
        setMessage('');
      }, 2000);
    } catch (err) {
      console.error('Invite error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite to {bandName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successState}>
              <View style={styles.successCircle}>
                <Check size={40} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Invitation Sent!</Text>
              <Text style={styles.successText}>We'll let you know when they respond.</Text>
            </View>
          ) : (
            <>
              <View style={styles.searchSection}>
                <View style={styles.searchWrapper}>
                  <Search size={18} color="rgba(255,255,255,0.2)" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or email..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={query}
                    onChangeText={setQuery}
                  />
                </View>
              </View>

              <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
                {loading ? (
                  <Text style={styles.statusText}>Searching...</Text>
                ) : musicians.length > 0 ? (
                  musicians.map((m) => (
                    <TouchableOpacity 
                      key={m.id} 
                      style={[styles.musicianRow, selectedId === m.id && styles.musicianRowSelected]}
                      onPress={() => setSelectedId(m.id)}
                    >
                      <View style={styles.musicianAvatar}>
                        {m.avatar_url ? (
                          <Image source={{ uri: m.avatar_url }} style={styles.avatarImg} />
                        ) : (
                          <Text style={styles.avatarText}>{m.display_name[0].toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={styles.musicianInfo}>
                        <Text style={styles.musicianName}>{m.display_name}</Text>
                        <Text style={styles.musicianRole}>
                          {profileOf(m)?.roles?.join(', ') || 'Musician'}
                        </Text>
                      </View>
                      {selectedId === m.id && (
                        <View style={styles.checkBubble}>
                          <Check size={14} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : query.length > 2 ? (
                  <Text style={styles.statusText}>No musicians found</Text>
                ) : (
                  <Text style={styles.statusText}>Start typing to find musicians</Text>
                )}
              </ScrollView>

              {selectedId && (
                <View style={styles.inviteForm}>
                  <Text style={styles.label}>PERSONAL MESSAGE (OPTIONAL)</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder={`Hey! Join ${bandName}...`}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                    value={message}
                    onChangeText={setMessage}
                  />
                </View>
              )}

              <View style={styles.footer}>
                <Button
                  title="Send Invitation"
                  variant="cyan"
                  disabled={!selectedId}
                  isLoading={inviteMutation.isPending}
                  onPress={handleInvite}
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0A1A2F',
    borderRadius: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  resultsList: {
    maxHeight: 250,
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'DM Sans',
  },
  musicianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  musicianRowSelected: {
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    borderWidth: 1,
  },
  musicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a7a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '700',
  },
  musicianInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicianName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  musicianRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  checkBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteForm: {
    padding: 20,
    paddingTop: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 10,
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    fontFamily: 'DM Sans',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  successState: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
});
