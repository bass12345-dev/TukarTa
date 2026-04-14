import React from 'react';
import { useRouter } from 'expo-router';
import { SongUpload } from '../../components/songs/SongUpload';

export default function OnboardingUploadScreen() {
  const router = useRouter();

  return (
    <SongUpload 
      onBack={() => router.back()}
      onAnalyze={() => router.push('/onboarding/review')}
      onSearch={() => router.replace('/onboarding/search')}
    />
  );
}
