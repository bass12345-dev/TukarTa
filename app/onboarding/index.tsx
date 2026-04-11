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
  Dimensions,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../utils/supabase';

// Modular Imports
import { OnboardingData } from '../../components/onboarding/types';
import { RoleStep } from '../../components/onboarding/RoleStep';
import { ProfileStep } from '../../components/onboarding/ProfileStep';
import { LocationStep } from '../../components/onboarding/LocationStep';
import { GenreStep } from '../../components/onboarding/GenreStep';
import { SongStep } from '../../components/onboarding/SongStep';

const STEPS = ['role', 'profile', 'location', 'genres', 'songs'] as const;
type OnboardingStep = typeof STEPS[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
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
    location: 'Cebu City',
    selectedGenres: [],
    selectedAvailability: []
  });

  const updateFormData = (fields: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
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

  const saveOnboarding = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      
      // 1. Update basic user info
      const { error: userError } = await supabase
        .from('users')
        .update({
          display_name: formData.useStageName ? formData.stageName : user.user_metadata?.full_name || formData.stageName,
          bio: formData.bio,
          city: formData.location,
          onboarding_completed: true
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
          availability_tags: formData.selectedAvailability
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#071420', '#0d2d45']} style={StyleSheet.absoluteFill} />

      {/* ── PROGRESS BAR ── */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepIndicator}>
          STEP {currentIndex + 1} OF 5 — {currentStep.toUpperCase()}
        </Text>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#8B5CF6', '#00D4FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* ── FOOTER ACTIONS ── */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.btnBack}>
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.btnNext, currentIndex === 0 && { width: '100%' }]} 
            onPress={handleNext}
            disabled={isSaving}
          >
            <LinearGradient colors={['#00D4FF', '#00A8E8']} style={styles.btnNextGradient}>
              <Text style={styles.btnNextText}>
                {isSaving ? 'Saving...' : currentStep === 'songs' ? 'Complete Profile' : 'Continue →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071420' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  progressContainer: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20 },
  stepIndicator: { fontSize: 10, fontWeight: '700', color: 'rgba(150, 175, 200, 0.4)', marginBottom: 8, fontFamily: 'DM Sans Bold' },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: 'rgba(7, 20, 32, 0.9)' },
  footerInner: { flexDirection: 'row', gap: 12 },
  btnBack: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  btnNext: { flex: 1, height: 56 },
  btnNextGradient: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnNextText: { color: '#FFF', fontSize: 16, fontFamily: 'DM Sans Bold' },
});
