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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pill label="Step 1 of 3" variant="cyan" style={{ alignSelf: 'flex-start', marginBottom: 12 }} />
          <Text style={styles.title}>Import your songs</Text>
          <Text style={styles.subtitle}>
            Upload screenshots — Notes app, handwritten lists, old setlists. AI extracts everything instantly.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.uploadHero, image ? styles.heroActive : null]} 
          activeOpacity={0.8}
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.uploadRing}>
                <Upload size={32} color="#00D4FF" />
              </View>
              <Text style={styles.uploadHeroTitle}>Tap to upload screenshots</Text>
              <Text style={styles.uploadHeroSubtitle}>
                Photos, Notes, handwritten lists{"\n"}Up to 5 images · PNG, JPG, HEIC
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.thumbnailSection}>
          <View style={styles.thumbnailRow}>
             <GlassCard style={styles.thumbnailCard} intensity={25}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: image ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 212, 255, 0.08)' }]} />
                <Check size={20} color={image ? "#10B981" : "rgba(150, 175, 200, 0.35)"} />
                <Text style={styles.thumbnailText}>
                  {image ? "screenshot_01.png" : "no_file.png"}{"\n"}
                  <Text style={{ color: image ? '#10B981' : 'rgba(200, 215, 235, 0.4)' }}>
                    {image ? 'Songs found' : 'Ready to scan'}
                  </Text>
                </Text>
             </GlassCard>

             <TouchableOpacity 
                onPress={pickImage}
                style={[styles.thumbnailCard, styles.thumbnailAdd]}
             >
                <View style={styles.addCircle}>
                  <Plus size={14} color="rgba(150, 175, 200, 0.35)" />
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
            title="Skip for now" 
            variant="ghost" 
            onPress={() => router.replace('/(tabs)')} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--color-bg)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: 'var(--color-text-sec)',
    lineHeight: 22,
    fontFamily: 'DM Sans',
  },
  uploadHero: {
    backgroundColor: 'rgba(0, 180, 220, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    gap: 14,
    marginVertical: 12,
    height: 240,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroActive: {
    borderStyle: 'solid',
    padding: 0,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHeroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans Bold',
  },
  uploadHeroSubtitle: {
    fontSize: 12.5,
    color: 'rgba(200, 215, 235, 0.45)',
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  thumbnailSection: {
    marginBottom: 24,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnailCard: {
    flex: 1,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'var(--color-text-sec)',
    textAlign: 'center',
    fontFamily: 'DM Sans Bold',
  },
  thumbnailAdd: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'var(--color-glass-border)',
    backgroundColor: 'transparent',
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 10,
    color: 'var(--color-text-dim)',
    fontFamily: 'DM Sans',
  },
  btnSection: {
    gap: 10,
    paddingBottom: 32,
  },
});
