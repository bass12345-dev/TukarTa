import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileImage, Search, SkipForward, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '../ui/GlassCard';
import { Pill } from '../ui/Pill';
import { StepProps } from './types';

export const SongStep: React.FC<StepProps & { onComplete: () => void }> = ({ onComplete }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add your songs</Text>
      <Text style={styles.subtitle}>The more songs you add, the better bands can match you. Choose how to import.</Text>
      
      <View style={styles.songOptions}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/onboarding/upload')}>
          <GlassCard style={styles.songOptionCard}>
            <View style={styles.songOptionIcon}>
              <FileImage size={24} color="#00D4FF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.miniRow}>
                <Text style={styles.songOptionTitle}>Upload screenshots</Text>
                <Pill label="FASTEST" variant="cyan" />
              </View>
              <Text style={styles.songOptionSub}>AI extracts all songs automatically — Notes app, photos, old setlists</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8}>
          <GlassCard style={styles.songOptionCard}>
            <View style={[styles.songOptionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Search size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songOptionTitle}>Search songs manually</Text>
              <Text style={styles.songOptionSub}>Search by song title or artist — powered by LRCLIB + TheAudioDB</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onComplete}>
          <GlassCard style={styles.songOptionCard}>
            <View style={[styles.songOptionIcon, { backgroundColor: 'rgba(150, 175, 200, 0.1)' }]}>
              <SkipForward size={24} color="rgba(255, 255, 255, 0.4)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songOptionTitle}>Skip for now</Text>
              <Text style={styles.songOptionSub}>Add songs later from your profile. You'll need at least 3 to appear in search.</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>

      <View style={styles.attributionCard}>
        <Text style={styles.attributionTitle}>POWERED BY FREE APIS</Text>
        <View style={styles.attributionRow}>
           <Pill label="LRCLIB lyrics · search" variant="outline" dotColor="#10B981" />
           <Pill label="TheAudioDB genre · artist" variant="outline" dotColor="#00D4FF" />
           <Pill label="Gemini Flash AI vision" variant="outline" dotColor="#8B5CF6" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  songOptions: { gap: 16 },
  songOptionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderRadius: 20 },
  songOptionIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 212, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  songOptionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  songOptionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans', lineHeight: 18 },
  attributionCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 20, marginTop: 30, gap: 14 },
  attributionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', fontFamily: 'DM Sans Bold', textAlign: 'center' },
  attributionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
