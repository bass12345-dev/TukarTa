import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, HelpCircle, MessageCircle, FileText, Globe, Mail, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Contact Banner */}
        <GlassCard style={styles.contactCard} intensity={25}>
          <View style={styles.contactHeader}>
             <View style={styles.iconBubble}>
               <MessageCircle size={32} color="#00D4FF" />
             </View>
             <Text style={styles.contactTitle}>Need more help?</Text>
             <Text style={styles.contactSub}>Our team is available 24/7 for Filipino musicians.</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn}>
             <Text style={styles.chatBtnText}>Start Live Chat</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <GlassCard style={styles.listCard} intensity={12}>
            <SupportItem label="How to book a musician?" />
            <View style={styles.hr} />
            <SupportItem label="Setting up Stage Mode" />
            <View style={styles.hr} />
            <SupportItem label="Withdrawing earnings" />
            <View style={styles.hr} />
            <SupportItem label="Subscription benefits" />
          </GlassCard>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL & VERSION</Text>
          <GlassCard style={styles.listCard} intensity={12}>
             <SupportItem label="Terms of Service" Icon={FileText} />
             <View style={styles.hr} />
             <SupportItem label="Privacy Policy" Icon={FileText} />
             <View style={styles.hr} />
             <SupportItem label="Official Website" Icon={Globe} />
             <View style={styles.hr} />
             <SupportItem label="Contact Email" Icon={Mail} sub="support@tukarta.com" />
          </GlassCard>
        </View>

        <View style={styles.footer}>
           <Text style={styles.versionText}>TukarTa for Musicians</Text>
           <Text style={styles.versionNum}>v1.0.4 - Build 2026.04.13</Text>
        </View>

      </ScrollView>
    </View>
  );
}

function SupportItem({ label, Icon, sub }: any) {
  return (
    <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        {Icon && <Icon size={18} color="rgba(255,255,255,0.4)" />}
        <View>
          <Text style={styles.itemLabel}>{label}</Text>
          {sub && <Text style={styles.itemSub}>{sub}</Text>}
        </View>
      </View>
      <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 35,
    alignItems: 'center',
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 6,
  },
  contactSub: {
    fontSize: 14,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatBtn: {
    backgroundColor: '#00D4FF',
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  chatBtnText: {
    color: '#071420',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DM Sans Bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
    fontFamily: 'DM Sans Bold',
  },
  listCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemLabel: {
    fontSize: 15,
    color: '#FFF',
    fontFamily: 'DM Sans Medium',
  },
  itemSub: {
    fontSize: 12,
    color: 'rgba(150, 175, 200, 0.4)',
    marginTop: 2,
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'DM Sans Bold',
  },
  versionNum: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    fontFamily: 'DM Sans',
  }
});
