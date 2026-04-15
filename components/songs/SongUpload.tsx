import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Check, Plus, Upload, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { supabase } from '../../utils/supabase';
import { useAnalyzeScreenshot } from '../../utils/hooks/useSongs';
import { ActivityIndicator } from 'react-native';

interface SongUploadProps {
  onBack: () => void;
  onAnalyze: (songs: Array<{ title: string; artist: string }>) => void;
  onSearch: () => void;
}

export function SongUpload({ onBack, onAnalyze, onSearch }: SongUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0); // For bulk upload progress
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For full preview
  const analyzeMutation = useAnalyzeScreenshot();

  const pickImage = async () => {
    if (images.length >= 5) {
      alert("Maximum 5 images allowed.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: images.length === 0, // Disable editing for multi-select feel
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
      .replace(/\s*\(.*?\)\s*/g, ' ') // Remove parentheses content e.g. (Live)
      .replace(/\s*\[.*?\]\s*/g, ' ') // Remove bracket content e.g. [Official]
      .replace(/[^a-z0-9 ]/g, '')     // Remove special characters
      .trim();
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    try {
      setUploading(true);
      const allExtractedSongs: Array<{ title: string; artist: string }> = [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (let i = 0; i < images.length; i++) {
        setCurrentProgress(i + 1);
        const imageUri = images[i];
        
        // 1. Prepare file
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${user.id}/${fileName}`;
        
        // Convert URI to Blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // 2. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('song-screenshots')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        // 3. Trigger AI Analysis
        const songs = await analyzeMutation.mutateAsync(filePath);
        allExtractedSongs.push(...songs);
      }
      
      // 4. De-duplicate results intelligently
      const uniqueSongsMap = new Map<string, { title: string; artist: string }>();
      
      allExtractedSongs.forEach(song => {
        const key = `${normalize(song.title)}|${normalize(song.artist)}`;
        // If we don't have this song yet, or the current one has a better artist name (not "Unknown Artist")
        if (!uniqueSongsMap.has(key) || (song.artist.toLowerCase() !== 'unknown artist' && uniqueSongsMap.get(key)?.artist.toLowerCase() === 'unknown artist')) {
          uniqueSongsMap.set(key, song);
        }
      });

      const uniqueSongs = Array.from(uniqueSongsMap.values());

      // 5. Proceed to review
      onAnalyze(uniqueSongs);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze: ' + error.message);
    } finally {
      setUploading(false);
      setCurrentProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload screenshots</Text>
          <Text style={styles.subtitle}>
            Drop in photos of your song list. Gemini AI reads handwriting, typed text, even blurry photos.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.uploadHero} 
          activeOpacity={0.8}
          onPress={pickImage}
        >
          <View style={styles.uploadRing}>
            <Upload size={32} color="#00D4FF" />
          </View>
          <Text style={styles.uploadHeroTitle}>Tap to upload</Text>
          <Text style={styles.uploadHeroSubtitle}>
            PNG, JPG, HEIC · Up to 5 images
          </Text>
        </TouchableOpacity>

         <View style={styles.thumbnailSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
             {images.map((uri, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.thumbnailCard, styles.thumbnailFilled]}
                  onPress={() => setSelectedImage(uri)}
                >
                   <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                   <View style={styles.thumbnailOverlay}>
                     <Text style={styles.thumbnailText} numberOfLines={1}>
                       Image {idx + 1}
                     </Text>
                   </View>
                   <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(idx)}>
                     <X size={14} color="#FFF" />
                   </TouchableOpacity>
                </TouchableOpacity>
             ))}

             {images.length < 5 && (
               <TouchableOpacity 
                  onPress={pickImage}
                  style={[styles.thumbnailCard, styles.thumbnailAdd]}
               >
                  <View style={styles.addCircle}>
                    <Plus size={16} color="rgba(255, 255, 255, 0.4)" />
                  </View>
                  <Text style={styles.addText}>Add more</Text>
               </TouchableOpacity>
             )}

             {images.length === 0 && (
               <View style={[styles.thumbnailCard, styles.thumbnailEmpty]}>
                  <View style={styles.addCircle}>
                    <Plus size={16} color="rgba(255, 255, 255, 0.4)" />
                  </View>
                  <Text style={styles.addText}>No file selected</Text>
               </View>
             )}
          </ScrollView>
        </View>

        <View style={styles.btnSection}>
          <Button 
            title={uploading ? `Analyzing (${currentProgress}/${images.length})...` : "Analyze with AI →"} 
            variant="cyan" 
            onPress={handleAnalyze}
            disabled={images.length === 0 || uploading}
            style={{ opacity: (images.length > 0 && !uploading) ? 1 : 0.6 }}
            icon={uploading ? <ActivityIndicator size="small" color="#FFF" /> : null}
          />
          <Button 
            title="Search manually instead" 
            variant="ghost" 
            onPress={onSearch} 
          />
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
    backgroundColor: '#071420',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 15,
    color: '#00D4FF',
    fontFamily: 'DM Sans',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
    fontFamily: 'DM Sans',
  },
  uploadHero: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    borderStyle: 'dashed',
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
    height: 280,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 8,
  },
  uploadHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  uploadHeroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(7, 20, 32, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbnailFilled: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  thumbnailEmpty: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  thumbnailAdd: {
    backgroundColor: '#162032',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  thumbnailText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: 'DM Sans Bold',
    lineHeight: 18,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans',
  },
  btnSection: {
    gap: 10,
    paddingBottom: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
