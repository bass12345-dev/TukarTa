import React from 'react';
import { useRouter } from 'expo-router';
import { ChordImporter } from '../../components/songs/ChordImporter';

export default function SongsImportScreen() {
  const router = useRouter();

  return <ChordImporter onBack={() => router.back()} />;
}
