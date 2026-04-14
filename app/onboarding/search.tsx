import React from 'react';
import { useRouter } from 'expo-router';
import { SongSearch } from '../../components/songs/SongSearch';

export default function OnboardingSearchScreen() {
  const router = useRouter();

  return (
    <SongSearch 
      onBack={() => router.back()}
    />
  );
}
