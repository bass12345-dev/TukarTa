import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Plus, Upload, X, ArrowLeft } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { supabase } from '../../utils/supabase';
import { useAnalyzeScreenshot } from '../../utils/hooks/useSongs';
import { readAsArrayBuffer } from '../../utils/file';
import { useAppTheme } from '../../context/theme';

interface SongUploadProps {
  onBack: () => void;
  onAnalyze: (songs: Array<{ title: string; artist: string }>) => void;
  onSearch: () => void;
}

export function SongUpload({ onBack, onAnalyze, onSearch }: SongUploadProps) {
  const { colors, isDark } = useAppTheme();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analyzeMutation = useAnalyzeScreenshot();

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images allowed per upload.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, ' ')
      .replace(/\s*\[.*?\]\s*/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .trim();
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    try {
      setUploading(true);
      abortControllerRef.current = new AbortController();
      const allExtractedSongs: Array<{ title: string; artist: string; genre: string }> = [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (let i = 0; i < images.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        setCurrentProgress(i + 1);
        const imageUri = images[i];
        
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${user.id}/${fileName}`;
        
        const arrayBuffer = await readAsArrayBuffer(imageUri);

        const { error: uploadError } = await supabase.storage
          .from('song-screenshots')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;
        if (abortControllerRef.current?.signal.aborted) break;

        const songs = await analyzeMutation.mutateAsync(filePath);
        
        if (abortControllerRef.current?.signal.aborted) break;
        allExtractedSongs.push(...songs);
      }
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const uniqueSongsMap = new Map<string, { title: string; artist: string; genre: string }>();
      
      allExtractedSongs.forEach(song => {
        const key = `${normalize(song.title)}|${normalize(song.artist)}`;
        if (!uniqueSongsMap.has(key) || (song.artist.toLowerCase() !== 'unknown artist' && uniqueSongsMap.get(key)?.artist.toLowerCase() === 'unknown artist')) {
          uniqueSongsMap.set(key, { title: song.title, artist: song.artist, genre: song.genre });
        }
      });

      const uniqueSongs = Array.from(uniqueSongsMap.values());
      onAnalyze(uniqueSongs);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not process images.');
    } finally {
      setUploading(false);
      setCurrentProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      setCurrentProgress(0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.bgSecondary, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onBack}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Upload screenshots</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Drop in photos of your song list or sheet music. AI extracts titles and artists automatically.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.uploadHero, { backgroundColor: isDark ? colors.bgCard : '#F0FDF4', borderColor: '#10B981' }]} 
          activeOpacity={0.8}
          onPress={pickImage}
        >
          <View style={styles.uploadRing}>
            <Upload size={30} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={[styles.uploadHeroTitle, { color: colors.text }]}>Tap to select screenshots</Text>
          <Text style={[styles.uploadHeroSubtitle, { color: colors.textSecondary }]}>
            PNG, JPG, HEIC · Up to 5 images
          </Text>
        </TouchableOpacity>

        <View style={styles.thumbnailSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
            {images.map((uri, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.thumbnailCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => setSelectedImage(uri)}
              >
                <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                <View style={styles.thumbnailOverlay}>
                  <Text style={styles.thumbnailText} numberOfLines={1}>
                    Photo {idx + 1}
                  </Text>
                </View>
                <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(idx)}>
                  <X size={12} color="#FFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {images.length < 5 && (
              <TouchableOpacity 
                onPress={pickImage}
                style={[styles.thumbnailCard, styles.thumbnailAdd, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.border }]}
              >
                <View style={[styles.addCircle, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                  <Plus size={16} color="#10B981" />
                </View>
                <Text style={[styles.addText, { color: colors.textSecondary }]}>Add photo</Text>
              </TouchableOpacity>
            )}

            {images.length === 0 && (
              <View style={[styles.thumbnailCard, styles.thumbnailEmpty, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.border }]}>
                <View style={[styles.addCircle, { backgroundColor: isDark ? '#16382C' : '#F0FDF4' }]}>
                  <Plus size={16} color="#10B981" />
                </View>
                <Text style={[styles.addText, { color: colors.textSecondary }]}>No photo yet</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.btnSection}>
          <Button 
            title={uploading ? `Extracting (${currentProgress}/${images.length})...` : "Analyze with AI →"} 
            variant="mint" 
            onPress={handleAnalyze}
            disabled={images.length === 0 || uploading}
            style={{ opacity: (images.length > 0 && !uploading) ? 1 : 0.6 }}
            icon={uploading ? <ActivityIndicator size="small" color="#FFF" /> : null}
          />
          
          {uploading && (
            <Button 
              title="Cancel Analysis" 
              variant="ghost" 
              onPress={handleCancel}
              style={styles.cancelButton}
            />
          )}

          {!uploading && (
            <Button 
              title="Search manually instead" 
              variant="outline-mint" 
              onPress={onSearch} 
            />
          )}
        </View>
      </ScrollView>

      {/* Full View Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={() => setSelectedImage(null)}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
  uploadHero: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
    height: 240,
    justifyContent: 'center',
  },
  uploadRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 4,
  },
  uploadHeroTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  uploadHeroSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  thumbnailSection: {
    marginBottom: 24,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailCard: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbnailEmpty: {
    borderStyle: 'dashed',
  },
  thumbnailAdd: {
    borderStyle: 'dashed',
  },
  thumbnailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  addText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  btnSection: {
    gap: 12,
    paddingBottom: 32,
  },
  cancelButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
