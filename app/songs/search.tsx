import React from 'react';
import { useRouter } from 'expo-router';
import { SongSearch } from '../../components/songs/SongSearch';

export default function SongsSearchScreen() {
  const router = useRouter();

  return (
    <SongSearch 
      onBack={() => router.back()}
    />
  );
}
