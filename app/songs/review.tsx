import { useRouter, useLocalSearchParams } from 'expo-router';
import { SongReview } from '../../components/songs/SongReview';

export default function SongsReviewScreen() {
  const router = useRouter();
  const { songs } = useLocalSearchParams();
  
  const parsedSongs = songs ? JSON.parse(songs as string) : [];

  return (
    <SongReview 
      initialSongs={parsedSongs}
      onSave={() => router.replace('/(tabs)/profile')}
    />
  );
}
