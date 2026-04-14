import React from 'react';
import { useRouter } from 'expo-router';
import { SongUpload } from '../../components/songs/SongUpload';

export default function SongsUploadScreen() {
  const router = useRouter();

  return (
    <SongUpload 
      onBack={() => router.back()}
      onAnalyze={(songs) => router.push({
        pathname: '/songs/review',
        params: { songs: JSON.stringify(songs) }
      })}
      onSearch={() => router.replace('/songs/search')}
    />
  );
}
