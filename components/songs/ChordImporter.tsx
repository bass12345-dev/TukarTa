import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  FileText,
  Upload,
  Globe,
  Sparkles,
  Check,
  ShieldCheck,
  Music,
  Eye,
  Edit3,
  ExternalLink,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';
import {
  parseRawChordText,
  parseLineSegments,
  transposeChord,
  transposeChordProText,
} from '../../utils/chordParser';
import { useImportChordSheet } from '../../utils/hooks/useSongs';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';

const GENRES = ['OPM', 'Rock', 'Pop', 'Acoustic', 'Worship', 'Ballad', 'R&B', 'Jazz', 'Folk', 'Reggae'];

const SAMPLE_TAB = `Title: Harana
Artist: Parokya ni Edgar
Key: G
BPM: 76

[Verse 1]
G              C
Uso pa ba ang harana?
Bm             E7           Am
Marahil ikaw ay nagtataka
       Bm               F                 D7
Sino ba 'tong mukhang gago nagkandarapa sa pagkanta
G              C
At nasisintunado sa kaba

[Chorus]
         CM7             Bm7
Puno ang langit ng bituin
         Am7           D7          G
At kay lamig pa ng hangin
       CM7            Bm7
Sa'yong tingin akoy nababaliw giliw
         Am7              D7            G
At sa awitin kong ito sana'y maibigan mo`;

const WEB_SOURCES = [
  { name: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=' },
  { name: 'Boite à Chansons (ChordPro)', url: 'https://www.boiteachansons.net/recherche?q=' },
  { name: 'Chordify Web', url: 'https://chordify.net/search/' },
];

export function ChordImporter({ onBack }: { onBack: () => void }) {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; artist?: string; key?: string }>();

  const [title, setTitle] = useState(params.title || '');
  const [artist, setArtist] = useState(params.artist || '');
  const [songKey, setSongKey] = useState(params.key || '');
  const [bpm, setBpm] = useState('');
  const [genre, setGenre] = useState('OPM');
  const [rawTab, setRawTab] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [attestedPersonalUse, setAttestedPersonalUse] = useState(true);

  const fileInputRef = useRef<any>(null);
  const importMutation = useImportChordSheet();

  // Live auto-parse of whatever the user pastes or uploads
  const parsed = useMemo(() => {
    return parseRawChordText(rawTab, title, artist);
  }, [rawTab, title, artist]);

  const effectiveKey = songKey.trim() || parsed.key || 'C';
  const transposedKey = transposeChord(effectiveKey, transposeSteps);
  const previewChordPro = useMemo(() => {
    return transposeChordProText(parsed.chordProText, transposeSteps);
  }, [parsed.chordProText, transposeSteps]);

  const handleLoadSample = () => {
    setRawTab(SAMPLE_TAB);
    const sampleParsed = parseRawChordText(SAMPLE_TAB);
    setTitle(sampleParsed.title);
    setArtist(sampleParsed.artist);
    setSongKey(sampleParsed.key);
    if (sampleParsed.bpm) setBpm(String(sampleParsed.bpm));
    setActiveTab('preview');
  };

  // Web & File upload handler (.txt, .cho, .chopro, .crd, .pro)
  const handleFileUploadWeb = (event: any) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setRawTab(content);
      const fileParsed = parseRawChordText(content, title, artist);
      if (!title && fileParsed.title !== 'Untitled Song') {
        setTitle(fileParsed.title);
      } else if (!title && file.name) {
        setTitle(file.name.replace(/\.(txt|cho|chopro|crd|pro|tab)$/i, ''));
      }
      if (!artist && fileParsed.artist !== 'Unknown Artist') {
        setArtist(fileParsed.artist);
      }
      if (!songKey && fileParsed.key) {
        setSongKey(fileParsed.key);
      }
      if (!bpm && fileParsed.bpm) {
        setBpm(String(fileParsed.bpm));
      }
      setActiveTab('preview');
    };
    reader.readAsText(file);
  };

  const handleOpenWebSearch = async (baseUrl: string) => {
    const query = `${title} ${artist}`.trim() || 'OPM guitar chords';
    await WebBrowser.openBrowserAsync(`${baseUrl}${encodeURIComponent(query)}`, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const handleSave = async () => {
    const finalTitle = (title.trim() || parsed.title).trim();
    const finalArtist = (artist.trim() || parsed.artist).trim();

    if (!finalTitle || finalTitle === 'Untitled Song') {
      Alert.alert('Missing Song Title', 'Please enter the song title before importing.');
      return;
    }
    if (!rawTab.trim()) {
      Alert.alert('Empty Chord Sheet', 'Please paste a guitar tab/chord sheet or upload a file first.');
      return;
    }
    if (!attestedPersonalUse) {
      Alert.alert('Personal Repertoire Notice', 'Please confirm this chart is for your personal/band practice repertoire.');
      return;
    }

    try {
      await importMutation.mutateAsync({
        title: finalTitle,
        artist: finalArtist,
        key: transposedKey,
        bpm: parseInt(bpm, 10) || parsed.bpm,
        capo: parsed.capo,
        genre,
        chordProText: previewChordPro,
        sourceType: 'user_import',
      });

      if (Platform.OS === 'web') {
        window.alert(`Saved to Repertoire! "${finalTitle}" is now ready with offline chords.`);
        onBack();
      } else {
        Alert.alert('Saved to Repertoire!', `"${finalTitle}" is now ready with offline chords in Stage Mode.`, [
          { text: 'Done', onPress: () => onBack() },
        ]);
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      if (Platform.OS === 'web') {
        window.alert(`Import Error: ${err?.message || 'Failed to save chord sheet'}`);
      } else {
        Alert.alert('Import Error', err?.message || 'Failed to save chord sheet.');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.bgSecondary, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Hidden HTML file input for Web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.cho,.chopro,.crd,.pro,.tab,.md"
          style={{ display: 'none' }}
          onChange={handleFileUploadWeb}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={onBack}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Pill label="OFFLINE STAGE READY" variant="mint" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Import Web Chords & Tabs</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Paste any guitar tab from the web or upload a `.txt` / `.cho` file. TukarTa automatically converts Chords-over-Lyrics into transposable Stage Mode charts.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Actions Bar: Upload File, Load Sample, or Search Web */}
        <View style={styles.quickActionsRow}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: '#10B981' }]}
              onPress={() => fileInputRef.current?.click()}
            >
              <Upload size={15} color="#10B981" />
              <Text style={[styles.quickBtnText, { color: '#10B981' }]}>Upload .TXT / .CHO File</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={handleLoadSample}
          >
            <Sparkles size={15} color="#10B981" />
            <Text style={[styles.quickBtnText, { color: colors.text }]}>Try OPM Sample Chart</Text>
          </TouchableOpacity>
        </View>

        {/* Web Lookup Shortcuts */}
        <View style={[styles.webLookupBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.webLookupHeader}>
            <Globe size={14} color="#10B981" />
            <Text style={[styles.webLookupTitle, { color: colors.textSecondary }]}>
              FIND & COPY CHORDS FROM THE WEB:
            </Text>
          </View>
          <View style={styles.webChipsRow}>
            {WEB_SOURCES.map((src) => (
              <TouchableOpacity
                key={src.name}
                style={[styles.webChip, { backgroundColor: isDark ? '#132821' : '#F0FDF4', borderColor: colors.border }]}
                onPress={() => handleOpenWebSearch(src.url)}
              >
                <Text style={[styles.webChipText, { color: '#10B981' }]}>{src.name}</Text>
                <ExternalLink size={11} color="#10B981" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Song Metadata Fields */}
        <View style={styles.metaGrid}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SONG TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder={parsed.title !== 'Untitled Song' ? parsed.title : 'e.g. Harana'}
              placeholderTextColor={colors.inputPlaceholder}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ARTIST *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder={parsed.artist !== 'Unknown Artist' ? parsed.artist : 'e.g. Parokya ni Edgar'}
              placeholderTextColor={colors.inputPlaceholder}
              value={artist}
              onChangeText={setArtist}
            />
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>KEY (AUTO-DETECTED: {parsed.key})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder={parsed.key || 'G'}
              placeholderTextColor={colors.inputPlaceholder}
              value={songKey}
              onChangeText={setSongKey}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BPM (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder={parsed.bpm ? String(parsed.bpm) : '120'}
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="numeric"
              value={bpm}
              onChangeText={setBpm}
            />
          </View>
        </View>

        {/* Genre Selector */}
        <View style={styles.genreSection}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>GENRE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
            {GENRES.map((g) => {
              const active = genre === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGenre(g)}
                  style={[
                    styles.genrePill,
                    {
                      backgroundColor: active ? '#10B981' : colors.bgCard,
                      borderColor: active ? '#10B981' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.genrePillText, { color: active ? '#FFFFFF' : colors.text }]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Detected Chords Summary */}
        {parsed.detectedChords.length > 0 && (
          <View style={[styles.detectedBanner, { backgroundColor: isDark ? '#16382C' : '#ECFDF5', borderColor: '#10B981' }]}>
            <View style={styles.detectedTitleRow}>
              <Music size={15} color="#10B981" />
              <Text style={[styles.detectedTitle, { color: colors.text }]}>
                Auto-Detected {parsed.detectedChords.length} Chords (Key of {transposedKey})
              </Text>
            </View>
            <View style={styles.chordChipsWrap}>
              {parsed.detectedChords.map((c) => (
                <View key={c} style={[styles.chordChip, { backgroundColor: colors.bgCard, borderColor: '#10B981' }]}>
                  <Text style={styles.chordChipText}>{transposeChord(c, transposeSteps)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mode Switcher: Edit Raw Tab vs Interactive Stage Preview */}
        <View style={styles.tabHeaderRow}>
          <View style={[styles.segmentedControl, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'edit' && { backgroundColor: '#10B981' }]}
              onPress={() => setActiveTab('edit')}
            >
              <Edit3 size={14} color={activeTab === 'edit' ? '#FFF' : colors.textSecondary} />
              <Text style={[styles.segmentText, { color: activeTab === 'edit' ? '#FFF' : colors.textSecondary }]}>
                Paste / Edit Tab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'preview' && { backgroundColor: '#10B981' }]}
              onPress={() => setActiveTab('preview')}
            >
              <Eye size={14} color={activeTab === 'preview' ? '#FFF' : colors.textSecondary} />
              <Text style={[styles.segmentText, { color: activeTab === 'preview' ? '#FFF' : colors.textSecondary }]}>
                Stage Mode Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transpose Controls */}
          <View style={styles.transposeGroup}>
            <TouchableOpacity
              style={[styles.transposeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setTransposeSteps((s) => s - 1)}
            >
              <Text style={[styles.transposeBtnText, { color: colors.text }]}>-1</Text>
            </TouchableOpacity>
            <Text style={[styles.transposeLabel, { color: '#10B981' }]}>
              {transposeSteps === 0 ? `Key: ${transposedKey}` : `${transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps} (${transposedKey})`}
            </Text>
            <TouchableOpacity
              style={[styles.transposeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setTransposeSteps((s) => s + 1)}
            >
              <Text style={[styles.transposeBtnText, { color: colors.text }]}>+1</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'edit' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            multiline
            textAlignVertical="top"
            placeholder={`Paste any guitar tab or ChordPro sheet here...\n\nExample:\nG              C\nUso pa ba ang harana?\nBm             E7           Am\nMarahil ikaw ay nagtataka`}
            placeholderTextColor={colors.inputPlaceholder}
            value={rawTab}
            onChangeText={setRawTab}
          />
        ) : (
          <View style={[styles.previewBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {!previewChordPro ? (
              <Text style={[styles.emptyPreviewText, { color: colors.textSecondary }]}>
                Paste a chord chart or tap "Try OPM Sample Chart" above to preview live chord alignment and transposition.
              </Text>
            ) : (
              previewChordPro.split('\n').map((line, lineIdx) => {
                if (!line.trim()) {
                  return <View key={lineIdx} style={{ height: 14 }} />;
                }
                const parsedLine = parseLineSegments(line);
                if (parsedLine.isSectionHeader) {
                  return (
                    <Text key={lineIdx} style={styles.previewSectionHeader}>
                      {parsedLine.sectionTitle}
                    </Text>
                  );
                }
                const hasAnyChords = parsedLine.segments.some((s) => !!s.chord);
                return (
                  <View key={lineIdx} style={styles.previewLineWrap}>
                    {parsedLine.segments.map((seg, sIdx) => (
                      <View key={sIdx} style={styles.segmentColumn}>
                        {hasAnyChords && (
                          <Text style={styles.previewChordText}>{seg.chord ? seg.chord : ' '}</Text>
                        )}
                        <Text style={[styles.previewLyricText, { color: colors.text }]}>
                          {seg.lyric || (seg.chord ? '   ' : '')}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* App Store & DMCA Safe Harbor Compliance Attestation */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.complianceBox,
            {
              backgroundColor: isDark ? '#11221C' : '#F8FAFC',
              borderColor: attestedPersonalUse ? '#10B981' : colors.border,
            },
          ]}
          onPress={() => setAttestedPersonalUse(!attestedPersonalUse)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: attestedPersonalUse ? '#10B981' : 'transparent',
                borderColor: attestedPersonalUse ? '#10B981' : colors.textSecondary,
              },
            ]}
          >
            {attestedPersonalUse && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={[styles.complianceTitle, { color: colors.text }]}>
                Personal & Band Practice Repertoire (Safe Harbor)
              </Text>
            </View>
            <Text style={[styles.complianceSub, { color: colors.textSecondary }]}>
              I confirm this chart is imported for my personal/band performance library and offline stage practice.
            </Text>
          </View>
        </TouchableOpacity>

        <Button
          title={importMutation.isPending ? 'Importing into Repertoire...' : 'Save Chords & Song to My Repertoire →'}
          variant="mint"
          onPress={handleSave}
          disabled={importMutation.isPending}
          icon={importMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : undefined}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  webLookupBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  webLookupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webLookupTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.8,
  },
  webChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  webChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  webChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  genreSection: {
    gap: 4,
  },
  genreRow: {
    gap: 8,
    paddingVertical: 2,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  detectedBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  detectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  chordChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chordChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chordChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'JetBrains Mono',
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  transposeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transposeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transposeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'JetBrains Mono',
  },
  transposeLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'JetBrains Mono',
    minWidth: 68,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 260,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 13.5,
    fontFamily: 'JetBrains Mono',
    lineHeight: 20,
  },
  previewBox: {
    minHeight: 260,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  emptyPreviewText: {
    fontSize: 13.5,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    marginTop: 40,
  },
  previewSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  previewLineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  segmentColumn: {
    flexDirection: 'column',
  },
  previewChordText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'JetBrains Mono',
    lineHeight: 18,
    paddingRight: 4,
  },
  previewLyricText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'DM Sans',
    lineHeight: 22,
  },
  complianceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  complianceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  complianceSub: {
    fontSize: 11.5,
    fontFamily: 'DM Sans',
    lineHeight: 17,
  },
});
