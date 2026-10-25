import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Music2, Zap, ArrowRight, Radio, Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/auth';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { session, isLoading, loginAsOfflineGuest, isOfflineGuest } = useAuth();
  const [isEnteringOffline, setIsEnteringOffline] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-route to home tabs if already logged in / cached session exists
  useEffect(() => {
    if (!isLoading && session) {
      router.replace(isOfflineGuest ? '/offline-gigs' : '/(tabs)');
    }
  }, [isLoading, session, isOfflineGuest]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing pulse for primary CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = () => {
    router.replace('/login');
  };

  const handleContinueOffline = async () => {
    try {
      setIsEnteringOffline(true);
      await loginAsOfflineGuest('Stage Musician');
      router.replace('/offline-gigs');
    } catch (e) {
      console.warn('Offline guest entry error:', e);
    } finally {
      setIsEnteringOffline(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Deep Forest Emerald / Mint Theme Gradient */}
      <LinearGradient
        colors={['#064E3B', '#022C22', '#011C15']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Glow Badge Icon */}
        <View style={styles.iconGlowWrapper}>
          <View style={styles.iconCircle}>
            <Music2 size={44} color="#10B981" strokeWidth={2.2} />
          </View>
        </View>

        {/* Brand Wordmark */}
        <Text style={styles.logoText}>
          <Text style={styles.logoTextLight}>Tukar</Text>
          <Text style={styles.logoTextBold}>Ta</Text>
        </Text>

        <View style={styles.taglineBadge}>
          <Text style={styles.taglineBadgeText}>LIVE SETLIST & MUSICIAN NETWORK</Text>
        </View>

        <Text style={styles.tagline}>
          The live co-pilot for musicians and bands. Built for the stage, offline-first, zero latency.
        </Text>

        {/* Feature Highlights Pills */}
        <View style={styles.featurePillsRow}>
          <View style={styles.featurePill}>
            <Radio size={12} color="#10B981" />
            <Text style={styles.featurePillText}>Hotspot Sync</Text>
          </View>
          <View style={styles.featurePill}>
            <Zap size={12} color="#10B981" />
            <Text style={styles.featurePillText}>0-Net Ready</Text>
          </View>
          <View style={styles.featurePill}>
            <Sparkles size={12} color="#10B981" />
            <Text style={styles.featurePillText}>AI Setlists</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleGetStarted}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Get Started / Sign In</Text>
              <ArrowRight size={18} color="#064E3B" />
            </TouchableOpacity>
          </Animated.View>

          {/* 1-Tap Offline Gig Mode Entry */}
          <TouchableOpacity
            style={styles.offlineBtn}
            onPress={handleContinueOffline}
            activeOpacity={0.85}
            disabled={isEnteringOffline}
          >
            {isEnteringOffline ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Zap size={16} color="#10B981" />
                <Text style={styles.offlineBtnText}>Continue in Offline Gig Mode</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Build / Version Footer */}
        <Text style={styles.footerText}>v1.2.0 • STAGE READY • HYBRID SYNC</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 420,
  },
  iconGlowWrapper: {
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#064E3B',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 42,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  logoTextLight: {
    fontFamily: 'DM Sans',
    fontWeight: '300',
    color: '#10B981',
  },
  logoTextBold: {
    fontFamily: 'DM Sans',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  taglineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  taglineBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A7F3D0',
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'DM Sans',
    marginBottom: 20,
  },
  featurePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 36,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1FAE5',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 18,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: 'DM Sans',
  },
  offlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
  },
  offlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A7F3D0',
    fontFamily: 'DM Sans',
  },
  footerText: {
    marginTop: 40,
    fontSize: 10,
    color: 'rgba(167, 243, 208, 0.45)',
    fontFamily: 'JetBrains Mono',
    letterSpacing: 1.5,
  },
});
