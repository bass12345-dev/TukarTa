import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

// Band profile photo (avatar_url) and cover photo (cover_url). Files go to the public
// 'band-images' bucket under <bandId>/. Only the band's leader can change them (migration 0027).

type ImageKind = 'avatar' | 'cover';

async function uploadBandImage(bandId: string, kind: ImageKind, uri: string): Promise<string> {
  const ext = (uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const fileName = `${bandId}/${kind}-${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('band-images')
    .upload(fileName, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('band-images').getPublicUrl(fileName);
  return data.publicUrl;
}

/** Opens the photo library, uploads the chosen image, and saves it on the band. Returns false if cancelled. */
export function useChangeBandImage(bandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kind }: { kind: ImageKind }) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') throw new Error('Allow photo access to change the band picture.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: kind === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return false;

      const url = await uploadBandImage(bandId, kind, result.assets[0].uri);
      const column = kind === 'avatar' ? 'avatar_url' : 'cover_url';
      const { error } = await supabase.from('bands').update({ [column]: url }).eq('id', bandId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['band', bandId] });
      queryClient.invalidateQueries({ queryKey: ['my-bands'] });
    },
  });
}
