import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  FileImage,
  Search,
  Sparkles,
  Music2,
} from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pill } from '../../components/ui/Pill';
import { useAppTheme } from '../../context/theme';

export default function AddSongsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['#132821', colors.bg] : ['#F0FDF4', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add your songs</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Build your repertoire dictionary so bands can match and prepare offline gig setlists with you.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {/* Upload Option */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/songs/upload')}>
            <View 
              style={[
                styles.optionCard, 
                { 
                  backgroundColor: isDark ? '#16382C' : '#ECFDF5', 
                  borderColor: '#10B981', 
                  borderWidth: 1.5 
                }
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#10B981' }]}>
                <Sparkles size={24} color="#FFFFFF" />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.labelRow}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Upload screenshots</Text>
                  <Pill label="FASTEST" variant="mint" />
                </View>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  AI extracts all songs and artists automatically
                </Text>
              </View>
              <ChevronRight size={20} color="#10B981" />
            </View>
          </TouchableOpacity>

          {/* Search Option */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/songs/search')}>
            <View 
              style={[
                styles.optionCard,
                { 
                  backgroundColor: colors.bgCard, 
                  borderColor: colors.border,
                  borderWidth: 1 
                }
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: isDark ? '#1F3F34' : '#F0FDF4' }]}>
                <Search size={24} color="#10B981" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Search songs manually</Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  Search 1M+ tracks with synced chords & lyrics
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Info / Attribution */}
        <View style={[styles.attributionSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.attributionHeader, { color: colors.textSecondary }]}>
            POWERED BY FREE MUSIC APIS
          </Text>
          <View style={styles.attributionChips}>
            <Pill label="LRCLIB lyrics · search" variant="mint-subtle" dotColor="#10B981" />
            <Pill label="TheAudioDB genre · artist" variant="mint-subtle" dotColor="#059669" />
            <Pill label="Gemini AI vision" variant="mint-subtle" dotColor="#10B981" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
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
    fontFamily: 'DM Sans',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  optionsContainer: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    marginBottom: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  optionSub: {
    fontSize: 12.5,
    fontFamily: 'DM Sans',
  },
  attributionSection: {
    padding: 16,
    borderRadius: 18,
    marginTop: 24,
    gap: 10,
    borderWidth: 1,
  },
  attributionHeader: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    textAlign: 'center',
    letterSpacing: 1,
  },
  attributionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});
