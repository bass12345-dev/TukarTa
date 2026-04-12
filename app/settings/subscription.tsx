import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Crown, Check, Zap, Star } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export default function SubscriptionScreen() {
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
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Current Plan Card */}
        <GlassCard style={styles.planCard} intensity={25}>
          <View style={styles.planHeader}>
            <View style={styles.crownCircle}>
              <Crown size={24} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View>
              <Text style={styles.planName}>TukarTa Pro</Text>
              <Text style={styles.planPrice}>₱249 <Text style={styles.planDuration}>/ month</Text></Text>
            </View>
          </View>
          <View style={styles.planBadge}>
             <Text style={styles.badgeText}>CURRENT PLAN</Text>
          </View>
        </GlassCard>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRO FEATURES</Text>
          <FeatureItem title="Unlimited Setlists" description="Create as many gig setlists as you need." />
          <FeatureItem title="AI Song Matching" description="Instantly see who knows your setlist." />
          <FeatureItem title="Stage Mode Pro" description="Advanced teleprompter and chord tools." />
          <FeatureItem title="Direct Messaging" description="Chat with musicians and band leaders." />
          <FeatureItem title="Marketplace Listing" description="Promote your services with priority search." />
        </View>

        <TouchableOpacity style={styles.manageBtn}>
           <Text style={styles.manageText}>Manage billing with App Store</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
           <Text style={styles.footerText}>Next billing date: May 12, 2026</Text>
        </View>

      </ScrollView>
    </View>
  );
}

function FeatureItem({ title, description }: any) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.checkCircle}>
        <Check size={14} color="#00D4FF" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
  planCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  crownCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  planName: {
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  planPrice: {
    fontSize: 16,
    color: '#F59E0B',
    fontFamily: 'DM Sans Bold',
    marginTop: 2,
  },
  planDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  planBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 10,
    color: '#F59E0B',
    fontFamily: 'DM Sans Bold',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 20,
    fontFamily: 'DM Sans Bold',
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(150, 175, 200, 0.6)',
    fontFamily: 'DM Sans',
    lineHeight: 20,
  },
  manageBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  manageText: {
    color: '#00D4FF',
    fontSize: 14,
    fontFamily: 'DM Sans Bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'DM Sans',
  }
});
