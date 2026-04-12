import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SONG_DATA = {
  title: 'Hotel California',
  artist: 'Eagles',
  meta: 'Key: Am · Capo 2',
  sections: [
    {
      label: 'INTRO',
      lines: [
        { chords: [['Am', 0], ['E7', 60], ['G', 120], ['D', 180]] }
      ]
    },
    {
      label: 'VERSE 1',
      lines: [
        { chords: [['Am', 0]], text: 'On a dark desert highway' },
        { chords: [['E7', 0]], text: 'Cool wind in my hair' },
        { chords: [['G', 0]], text: 'Warm smell of colitas' },
        { chords: [['D', 0]], text: 'Rising up through the air' },
      ]
    },
    {
      label: 'PRE-CHORUS',
      lines: [
        { chords: [['F', 0]], text: 'Up ahead in the distance' }
      ]
    }
  ]
};

export default function StageModeScreen() {
  const router = useRouter();
  const [currentSongIndex, setCurrentSongIndex] = useState(1);
  const totalSongs = 11;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, orientation: 'portrait' }} />

      {/* ── Top Navigation ── */}
      <View style={styles.topNav}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>SONG {currentSongIndex} OF {totalSongs}</Text>
          <View style={styles.dotsRow}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.exitBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.exitBtnText}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.nextSongInfo}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextSongTitle}>Paraluman →</Text>
        </View>
      </View>

      {/* ── Main Performance View ── */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.songHeader}>
          <Text style={styles.songTitle}>{SONG_DATA.title}</Text>
          <Text style={styles.songMeta}>{SONG_DATA.artist} · {SONG_DATA.meta}</Text>
        </View>

        {SONG_DATA.sections.map((section: any, sIdx: number) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.lines.map((line: any, lIdx: number) => (
              <View key={lIdx} style={styles.performanceRow}>
                <View style={[styles.chordLine, !line.text && { marginBottom: 20 }]}>
                  {line.chords.map((c: any, cIdx: number) => (
                    <Text key={cIdx} style={[styles.chord, { marginLeft: cIdx === 0 ? 0 : 30 }]}>
                      {c[0]}
                    </Text>
                  ))}
                </View>
                {line.text ? <Text style={styles.lyric}>{line.text}</Text> : null}
              </View>
            ))}
          </View>
        ))}
        
        {/* Extra spacing for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Controls ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBtn}>
          <View style={styles.navBtnContent}>
            <ArrowLeft size={16} color="#FFF" />
            <Text style={styles.navBtnText}>Prev</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.transposeControl}>
          <Text style={styles.transposeValue}>Am</Text>
          <View style={styles.transposeIcons}>
            <ChevronUp size={14} color="#00D4FF" />
            <ChevronDown size={14} color="#00D4FF" />
          </View>
        </View>

        <TouchableOpacity style={styles.navBtn}>
          <View style={styles.navBtnContent}>
            <Text style={styles.navBtnText}>Next</Text>
            <ArrowRight size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black for OLED
  },
  topNav: {
    height: 100,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressSection: {
    width: 80,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'DM Sans Bold',
    marginBottom: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotActive: {
    backgroundColor: '#00D4FF',
    width: 24,
  },
  exitBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  nextSongInfo: {
    width: 80,
    alignItems: 'flex-end',
  },
  nextLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'DM Sans Bold',
    textAlign: 'right',
  },
  nextSongTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'DM Sans',
    textAlign: 'right',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  songHeader: {
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 42,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 8,
  },
  songMeta: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'DM Sans Medium',
  },
  section: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  performanceRow: {
    marginBottom: 35,
  },
  chordLine: {
    flexDirection: 'row',
  },
  chord: {
    fontSize: 22,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
  lyric: {
    fontSize: 26,
    color: '#FFF',
    fontFamily: 'DM Sans Medium',
    marginTop: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    height: '100%',
    width: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  transposeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transposeValue: {
    fontSize: 20,
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
  },
  transposeIcons: {
    gap: -4,
  }
});
