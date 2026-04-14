import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  FileImage,
  Search
} from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Pill } from '../../components/ui/Pill';

export default function AddSongsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0a1a2a']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#F0F4FF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add your songs</Text>
        <Text style={styles.subtitle}>
          The more songs you add, the better we can match you with the right opportunities.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {/* Upload Option */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/songs/upload')}>
            <GlassCard 
              style={[styles.optionCard, { borderColor: 'rgba(0, 212, 255, 0.4)', borderWidth: 1 }]}
              contentContainerStyle={styles.cardInner}
              intensity={25}
              noPadding
            >
              <View style={styles.optionIcon}>
                <FileImage size={28} color="#00D4FF" />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.labelRow}>
                  <Text style={styles.optionTitle}>Upload screenshots</Text>
                  <Pill label="FASTEST" variant="cyan" />
                </View>
                <Text style={styles.optionSub}>AI extracts all songs automatically</Text>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
            </GlassCard>
          </TouchableOpacity>

          {/* Search Option */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/songs/search')}>
            <GlassCard 
              style={styles.optionCard}
              contentContainerStyle={styles.cardInner}
              intensity={15}
              noPadding
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Search size={28} color="#8B5CF6" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Search songs manually</Text>
                <Text style={styles.optionSub}>Search by title, artist, or style</Text>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Footer Info / Attribution */}
        <View style={styles.attributionSection}>
          <Text style={styles.attributionHeader}>POWERED BY FREE APIS</Text>
          <View style={styles.attributionChips}>
            <Pill label="LRCLIB lyrics · search" variant="outline" dotColor="#10B981" />
            <Pill label="TheAudioDB genre · artist" variant="outline" dotColor="#00D4FF" />
            <Pill label="Gemini Flash 2.0 AI vision" variant="outline" dotColor="#8B5CF6" />
          </View>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  optionTitle: {
    fontSize: 17,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  optionSub: {
    fontSize: 13,
    color: 'rgba(150, 175, 200, 0.5)',
    fontFamily: 'DM Sans',
  },
  attributionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    gap: 15,
  },
  attributionHeader: {
    fontSize: 10,
    color: 'rgba(150, 175, 200, 0.3)',
    fontFamily: 'DM Sans Bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  attributionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  }
});
