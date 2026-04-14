import React from 'react';
import { useRouter } from 'expo-router';
import { SongReview } from '../../components/songs/SongReview';

export default function OnboardingReviewScreen() {
  const router = useRouter();

  return (
    <SongReview 
      onSave={() => router.replace('/onboarding/index')}
      stepLabel="Step 2 of 3"
    />
  );
}
