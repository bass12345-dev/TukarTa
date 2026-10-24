import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';
import { useAppTheme } from '../../context/theme';

// Modular Step Components
import { OnboardingData } from '../../components/onboarding/types';
import { RoleStep } from '../../components/onboarding/RoleStep';
import { ProfileStep } from '../../components/onboarding/ProfileStep';
import { LocationStep } from '../../components/onboarding/LocationStep';
import { GenreStep } from '../../components/onboarding/GenreStep';
import { SongStep } from '../../components/onboarding/SongStep';

const STEPS = ['role', 'profile', 'location', 'genres', 'songs'] as const;
type OnboardingStep = typeof STEPS[number];

const STEP_TITLES: Record<OnboardingStep, string> = {
  role: 'PRIMARY ROLES',
  profile: 'YOUR PROFILE',
  location: 'LOCATION',
  genres: 'GENRES & GIGS',
  songs: 'SONG REPERTOIRE',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { colors, isDark } = useAppTheme();
  
  // State Management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    selectedRoles: [],
    stageName: '',
    bio: '',
    rate: '',
    rateType: 'per_gig',
    useStageName: false,
    location: 'Oroquieta City',
    selectedGenres: [],
    selectedAvailability: [],
    avatarUri: undefined,
  });

  const updateFormData = (fields: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const canContinue = () => {
    switch (currentStep) {
      case 'role':
        return formData.selectedRoles.length > 0;
      case 'profile':
        return formData.stageName.trim().length > 0;
      case 'location':
        return formData.location.length > 0;
      case 'genres':
        return formData.selectedGenres.length > 0;
      case 'songs':
        return true; // Skip is allowed
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canContinue()) return;
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      await saveOnboarding();
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const uploadAvatar = async (uri: string, userId: string) => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      return null;
    }
  };

  const saveOnboarding = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      
      let avatarUrl = user.user_metadata?.avatar_url || null;
      if (formData.avatarUri) {
        const uploadedUrl = await uploadAvatar(formData.avatarUri, user.id);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      // 1. Update basic user info
      const { error: userError } = await supabase
        .from('users')
        .update({
          display_name: formData.useStageName ? formData.stageName : user.user_metadata?.full_name || formData.stageName,
          bio: formData.bio,
          city: formData.location,
          lat: formData._lat ? parseFloat(formData._lat) : null,
          lng: formData._lng ? parseFloat(formData._lng) : null,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // 2. Update musician detailed profile
      const { error: profileError } = await supabase
        .from('musician_profiles')
        .update({
          roles: formData.selectedRoles,
          genres: formData.selectedGenres,
          rate_amount: formData.rate ? parseFloat(formData.rate) : null,
          rate_type: formData.rateType,
          availability_tags: formData.selectedAvailability,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Onboarding save failed:', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    const props = { data: formData, updateData: updateFormData };
    switch (currentStep) {
      case 'role': return <RoleStep {...props} />;
      case 'profile': return <ProfileStep {...props} />;
      case 'location': return <LocationStep {...props} />;
      case 'genres': return <GenreStep {...props} />;
      case 'songs': return <SongStep {...props} onComplete={saveOnboarding} />;
      default: return null;
    }
  };

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Subtle top wash */}
      <LinearGradient
        colors={isDark ? ['#132821', colors.bg] : ['#F0FDF4', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.mainWrapper}>
        {/* ── PROGRESS BAR ── */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                STEP {currentIndex + 1} OF {STEPS.length}
              </Text>
            </View>
            <Text style={[styles.stepTitleLabel, { color: colors.textSecondary }]}>
              {STEP_TITLES[currentStep]}
            </Text>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progress}%` }]}
            />
          </View>
        </View>

        {/* ── STEP CONTENT ── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* ── FOOTER ACTIONS ── */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: isDark ? 'rgba(10, 22, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.footerInner}>
            {currentIndex > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.btnBack, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color={colors.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btnNext,
                currentIndex === 0 && { flex: 1 },
                !canContinue() && styles.btnDisabled,
              ]}
              onPress={handleNext}
              disabled={isSaving || !canContinue()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canContinue() ? ['#10B981', '#059669'] : isDark ? ['#1F3F34', '#162F27'] : ['#E2E8F0', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnNextGradient}
              >
                <Text
                  style={[
                    styles.btnNextText,
                    !canContinue() && { color: isDark ? '#4B7B6B' : '#94A3B8' },
                  ]}
                >
                  {isSaving
                    ? 'Saving Profile...'
                    : currentStep === 'songs'
                    ? 'Complete Profile ✓'
                    : 'Continue →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  progressContainer: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
    letterSpacing: 0.5,
  },
  stepTitleLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    letterSpacing: 0.8,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    borderTopWidth: 1,
  },
  footerInner: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  btnBack: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNext: {
    flex: 1,
    height: 52,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnNextGradient: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
});
