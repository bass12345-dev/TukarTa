import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Check, Plus, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';

export default function UploadScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
          <View style={styles.thumbnailRow}>
             <View style={[styles.thumbnailCard, image ? styles.thumbnailFilled : styles.thumbnailEmpty]}>
                {image ? (
                  <>
                    <Check size={20} color="#10B981" />
                    <Text style={styles.thumbnailText}>
                      notes_setlist.png{"\n"}
                      <Text style={{ color: '#10B981', fontSize: 11 }}>7 songs found</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.addCircle}>
                      <Plus size={16} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                    <Text style={styles.addText}>No file selected</Text>
                  </>
                )}
             </View>

             <TouchableOpacity 
                onPress={pickImage}
                style={[styles.thumbnailCard, styles.thumbnailAdd]}
             >
                <View style={styles.addCircle}>
                  <Plus size={16} color="rgba(255, 255, 255, 0.4)" />
                </View>
                <Text style={styles.addText}>Add more</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.btnSection}>
          <Button 
            title="Analyze with AI →" 
            variant="cyan" 
            onPress={() => router.push('/onboarding/review')}
            disabled={!image}
            style={{ opacity: image ? 1 : 0.6 }}
          />
          <Button 
            title="Search manually instead" 
            variant="ghost" 
            onPress={() => router.replace('/onboarding/search')} 
          />
        </View>
      </ScrollView>
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
    paddingTop: 40,
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
  previewImage: {
    width: '100%',
    height: '100%',
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
    flex: 1,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
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
});
