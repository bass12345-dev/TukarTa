import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileImage, Search, SkipForward, ChevronRight, Sparkles, FileCode2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pill } from '../ui/Pill';
import { StepProps } from './types';
import { useAppTheme } from '../../context/theme';

export const SongStep: React.FC<StepProps & { onComplete: () => void }> = ({ onComplete }) => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Add your songs</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        The more songs in your repertoire, the easier bands can match and build instant gig setlists with you.
      </Text>
      
      <View style={styles.songOptions}>
        {/* Option 0: Import Web Chords / Tab */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/onboarding/import')}>
          <View 
            style={[
              styles.songOptionCard, 
              { 
                backgroundColor: isDark ? '#16382C' : '#ECFDF5', 
                borderColor: '#10B981',
                borderWidth: 1.5,
              }
            ]}
          >
            <View style={[styles.songOptionIcon, { backgroundColor: '#10B981' }]}>
              <FileCode2 size={22} color="#FFFFFF" />
            </View>
            <View style={styles.songOptionInfo}>
              <View style={styles.miniRow}>
                <Text style={[styles.songOptionTitle, { color: colors.text }]}>
                  Import Web Chords / Tab
                </Text>
                <Pill label="CHORDS + KEY" variant="mint" />
              </View>
              <Text style={[styles.songOptionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Paste any guitar tab or upload .txt / .cho files
              </Text>
            </View>
            <ChevronRight size={20} color="#10B981" />
          </View>
        </TouchableOpacity>

        {/* Option 1: Upload Screenshots */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/onboarding/upload')}>
          <View 
            style={[
              styles.songOptionCard, 
              { 
                backgroundColor: isDark ? '#16382C' : '#ECFDF5', 
                borderColor: '#10B981',
                borderWidth: 1.5,
              }
            ]}
          >
            <View style={[styles.songOptionIcon, { backgroundColor: '#10B981' }]}>
              <Sparkles size={22} color="#FFFFFF" />
            </View>
            <View style={styles.songOptionInfo}>
              <View style={styles.miniRow}>
                <Text style={[styles.songOptionTitle, { color: colors.text }]}>
                  Upload screenshots
                </Text>
                <Pill label="FASTEST" variant="mint" />
              </View>
              <Text style={[styles.songOptionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                AI extracts all songs and artists automatically
              </Text>
            </View>
            <ChevronRight size={20} color="#10B981" />
          </View>
        </TouchableOpacity>

        {/* Option 2: Search Songs */}
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={() => router.push('/onboarding/search')}
        >
          <View 
            style={[
              styles.songOptionCard, 
              { 
                backgroundColor: colors.bgCard, 
                borderColor: colors.border,
                borderWidth: 1,
              }
            ]}
          >
            <View style={[styles.songOptionIcon, { backgroundColor: isDark ? '#1F3F34' : '#F0FDF4' }]}>
              <Search size={22} color="#10B981" />
            </View>
            <View style={styles.songOptionInfo}>
              <Text style={[styles.songOptionTitle, { color: colors.text }]}>
                Search songs manually
              </Text>
              <Text style={[styles.songOptionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Search 1M+ tracks with chords & synced lyrics
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Option 3: Skip for now */}
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={onComplete}
        >
          <View 
            style={[
              styles.songOptionCard, 
              { 
                backgroundColor: colors.bgCard, 
                borderColor: colors.border,
                borderWidth: 1,
                opacity: 0.85,
              }
            ]}
          >
            <View style={[styles.songOptionIcon, { backgroundColor: isDark ? '#162F27' : '#F8FAFC' }]}>
              <SkipForward size={22} color={colors.textSecondary} />
            </View>
            <View style={styles.songOptionInfo}>
              <Text style={[styles.songOptionTitle, { color: colors.text }]}>
                Skip for now
              </Text>
              <Text style={[styles.songOptionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Add songs later anytime from your profile
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Attribution Card */}
      <View style={[styles.attributionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.attributionTitle, { color: colors.textSecondary }]}>
          POWERED BY EMBEDDED MUSIC SERVICES
        </Text>
        <View style={styles.attributionRow}>
          <Pill label="LRCLIB Synced Lyrics" variant="mint-subtle" dotColor="#10B981" />
          <Pill label="TheAudioDB Repertoire" variant="mint-subtle" dotColor="#059669" />
          <Pill label="Gemini AI Extraction" variant="mint-subtle" dotColor="#10B981" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    lineHeight: 20,
    marginBottom: 16,
  },
  songOptions: {
    gap: 12,
  },
  songOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  songOptionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songOptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  songOptionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  songOptionSub: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  attributionCard: {
    padding: 16,
    borderRadius: 18,
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
  },
  attributionTitle: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    textAlign: 'center',
    letterSpacing: 1,
  },
  attributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});
