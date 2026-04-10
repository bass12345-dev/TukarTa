import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Play, X, Settings, List, Music, Maximize2, SkipForward, SkipBack } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Orb } from '../components/ui/Orb';
import { Pill } from '../components/ui/Pill';

export default function StageModeScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
        <View style={styles.songHeader}>
          <Text style={styles.nowPlaying}>01 · HOTEL CALIFORNIA</Text>
          <View style={styles.progressBar}>
             <View style={[styles.progressLine, { width: '35%' }]} />
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Settings size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      {/* Stage Content */}
      <ScrollView contentContainerStyle={styles.stageContent} scrollEnabled={false}>
         <View style={styles.lyricsArea}>
            <Text style={styles.lyricPast}>On a dark desert highway</Text>
            <Text style={styles.lyricCurrent}>Cool wind in my hair</Text>
            <Text style={styles.lyricNext}>Warm smell of colitas</Text>
            <Text style={styles.lyricNext}>Rising up through the air</Text>
         </View>

         {/* Floating Chord Orb */}
         <View style={styles.chordContainer}>
            <Orb variant="cyan" size={120} style={styles.chordOrb}>
               <Text style={styles.chordText}>Bm</Text>
               <Text style={styles.chordSubtext}>Barre</Text>
            </Orb>
            <View style={styles.nextChordRow}>
               <Text style={styles.nextLabel}>NEXT</Text>
               <Orb variant="purple" size={44}>
                  <Text style={styles.nextChordText}>F#</Text>
               </Orb>
            </View>
         </View>
      </ScrollView>

      {/* Control Bar */}
      <View style={styles.controlsLayer}>
         <View style={styles.pillRow}>
            <Pill label="Metronome: 122 BPM" variant="cyan" />
            <Pill label="Acoustic Vibes Mix" variant="purple" />
         </View>

         <View style={styles.mainControls}>
            <TouchableOpacity style={styles.ctrlBtnSec}>
               <SkipBack size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playBtn}
              onPress={() => setIsPlaying(!isPlaying)}
            >
               {isPlaying ? <Music size={32} color="#00D4FF" /> : <Play size={32} color="#00D4FF" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctrlBtnSec}>
               <SkipForward size={24} color="#FFF" />
            </TouchableOpacity>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 8,
  },
  songHeader: {
    flex: 1,
    alignItems: 'center',
  },
  nowPlaying: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: 'JetBrains Mono',
  },
  progressBar: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressLine: {
    height: '100%',
    backgroundColor: '#00D4FF',
  },
  stageContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  lyricsArea: {
    marginBottom: 40,
  },
  lyricPast: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.1)',
    fontFamily: 'DM Sans',
    marginBottom: 10,
    textAlign: 'center',
  },
  lyricCurrent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans',
    marginBottom: 10,
    textAlign: 'center',
  },
  lyricNext: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'DM Sans',
    marginBottom: 6,
    textAlign: 'center',
  },
  chordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  chordOrb: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  chordText: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans',
  },
  chordSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  nextChordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontFamily: 'DM Sans',
  },
  nextChordText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans',
  },
  controlsLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  ctrlBtnSec: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
});
