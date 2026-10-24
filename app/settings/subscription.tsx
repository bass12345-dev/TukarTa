import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Crown, Check, Zap, Star } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Current Plan Card */}
        <View style={[styles.planCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.planHeader}>
            <View style={[styles.crownCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Crown size={24} color="#D97706" fill="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.planName, { color: colors.text }]}>TukarTa Pro</Text>
              <Text style={[styles.planPrice, { color: colors.primaryDark }]}>
                ₱249 <Text style={[styles.planDuration, { color: colors.textDim }]}>/ month</Text>
              </Text>
            </View>
          </View>
          <View style={[styles.planBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
             <Text style={[styles.badgeText, { color: colors.primaryDark }]}>CURRENT PLAN</Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRO FEATURES</Text>
          <FeatureItem title="Unlimited Setlists" description="Create as many gig setlists as your band needs." colors={colors} />
          <FeatureItem title="Offline Stage Mode" description="Full lyrics, chords, and sync with zero latency." colors={colors} />
          <FeatureItem title="AI Song Extraction" description="Upload setlist photos & screenshots to add songs instantly." colors={colors} />
          <FeatureItem title="Band Session Sync" description="Real-time live multi-device song teleprompter sync." colors={colors} />
          <FeatureItem title="Direct Musician Recruitment" description="Direct messaging and booking with top performers." colors={colors} />
        </View>

        {/* Manage Button */}
        <TouchableOpacity 
          style={[styles.manageBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.alert('Your subscription is managed through Stripe / Google Play Store.');
            } else {
              Alert.alert('Subscription Details', 'Your subscription is active and managed through your app store.');
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage Billing & Receipt</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function FeatureItem({ title, description, colors }: any) {
  return (
    <View style={[styles.featureCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.checkCircle, { backgroundColor: colors.primaryLight }]}>
        <Check size={16} color={colors.primary} strokeWidth={3} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.textDim }]}>{description}</Text>
      </View>
    </View>
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
  planCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crownCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
    marginTop: 2,
  },
  planDuration: {
    fontSize: 13,
    fontWeight: '500',
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
  manageBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
});
