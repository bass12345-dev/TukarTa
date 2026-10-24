import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, HelpCircle, MessageCircle, FileText, Globe, Mail, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';

export default function SupportScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const handleStartChat = () => {
    router.push('/ai-agent');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@tukarta.ph');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Contact Banner */}
        <View style={[styles.contactCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.contactHeader}>
             <View style={[styles.iconBubble, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
               <MessageCircle size={28} color={colors.primary} />
             </View>
             <Text style={[styles.contactTitle, { color: colors.text }]}>Need Help with a Gig?</Text>
             <Text style={[styles.contactSub, { color: colors.textDim }]}>
               Our AI Bot and live assistance are here for Filipino musicians 24/7.
             </Text>
          </View>
          <TouchableOpacity 
            style={[styles.chatBtn, { backgroundColor: colors.primary }]}
            onPress={handleStartChat}
            activeOpacity={0.85}
          >
             <Text style={styles.chatBtnText}>Chat with TukarTa Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={[styles.listCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SupportItem 
              label="How does Offline Stage Mode work?" 
              colors={colors}
              onPress={() => {
                const msg = 'Stage Mode downloads setlist lyrics & chords to your device SQLite cache so you can perform without internet.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Offline Stage Mode', msg);
              }}
            />
            <View style={[styles.hr, { backgroundColor: colors.border }]} />
            <SupportItem 
              label="Connecting multi-device Band Sync" 
              colors={colors}
              onPress={() => {
                const msg = 'Enter your band 4-character session code (e.g. TUKA) on the Band tab to synchronize teleprompters in real time.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Band Sync', msg);
              }}
            />
            <View style={[styles.hr, { backgroundColor: colors.border }]} />
            <SupportItem 
              label="Scanning lyrics from screenshots" 
              colors={colors}
              onPress={() => {
                const msg = 'Open the AI Assistant, tap the camera/image icon, and upload a photo of your handwritten or printed setlist.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('AI Song Extraction', msg);
              }}
            />
          </View>
        </View>

        {/* Contact Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>GET IN TOUCH</Text>
          <View style={[styles.listCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
             <SupportItem label="Email: support@tukarta.ph" Icon={Mail} colors={colors} onPress={handleEmailSupport} />
             <View style={[styles.hr, { backgroundColor: colors.border }]} />
             <SupportItem label="Website: tukarta.ph" Icon={Globe} colors={colors} onPress={() => Linking.openURL('https://tukarta.ph')} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function SupportItem({ label, Icon = HelpCircle, colors, onPress }: any) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <Icon size={18} color={colors.primary} />
        <Text style={[styles.itemText, { color: colors.text }]}>{label}</Text>
      </View>
      <ChevronRight size={16} color={colors.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: Platform.OS === 'ios' ? 100 : 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 24,
  },
  contactCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginBottom: 4,
  },
  contactSub: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  chatBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: 'DM Sans',
    paddingLeft: 4,
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  hr: {
    height: 1,
  },
});
