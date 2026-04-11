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
          <GlassCard 
            style={[styles.songOptionCard, { height: 75, borderColor: 'rgba(0, 212, 255, 0.4)', borderWidth: 1.5 }]}
            contentContainerStyle={styles.roleCardContent}
            intensity={25}
            noPadding
          >
            <View style={styles.songOptionIcon}>
              <FileImage size={24} color="#00D4FF" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={styles.miniRow}>
                <Text style={styles.songOptionTitle}>Upload screenshots</Text>
                <Pill label="FASTEST" variant="cyan" />
              </View>
              <Text style={styles.songOptionSub} numberOfLines={1}>AI extracts all songs automatically</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push('/onboarding/search')}
        >
          <GlassCard 
            style={[styles.songOptionCard, { height: 75 }]}
            contentContainerStyle={styles.roleCardContent}
            noPadding
          >
            <View style={[styles.songOptionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Search size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.songOptionTitle}>Search songs manually</Text>
              <Text style={styles.songOptionSub} numberOfLines={1}>Search by title or artist — LRCLIB + TheAudioDB</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onComplete}>
          <GlassCard 
            style={[styles.songOptionCard, { height: 75 }]}
            contentContainerStyle={styles.roleCardContent}
            noPadding
          >
            <View style={[styles.songOptionIcon, { backgroundColor: 'rgba(150, 175, 200, 0.1)' }]}>
              <SkipForward size={24} color="rgba(255, 255, 255, 0.4)" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.songOptionTitle}>Skip for now</Text>
              <Text style={styles.songOptionSub} numberOfLines={1}>Add songs later from your profile</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
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
  songOptions: { gap: 12 },
  roleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  songOptionCard: { borderRadius: 24, borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  songOptionIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0, 212, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  songOptionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  songOptionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  attributionCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 20, marginTop: 24, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)' },
  attributionTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.3)', fontFamily: 'DM Sans Bold', textAlign: 'center', letterSpacing: 1 },
  attributionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
});
