import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Sparkles, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Heading, Paragraph, Label } from '../../components/ui/Typography';
import * as ImagePicker from 'expo-image-picker';

export default function UploadOnboarding() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView className="flex-1 bg-brand-bg px-6 pt-12">
      <View className="mb-10">
        <Label className="text-brand-cyan mb-2">Step 1 of 3</Label>
        <Heading>Build your song library</Heading>
        <Paragraph className="mt-2">
          Upload a screenshot of your songs from Notes or a photo of your setlist.
        </Paragraph>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={pickImage}
        className="mb-10"
      >
        <GlassCard className="items-center py-20 border-dashed border-2 border-brand-cyan/30 bg-brand-cyan/5">
          {image ? (
            <Image source={{ uri: image }} className="w-full h-64 rounded-xl" resizeMode="cover" />
          ) : (
            <>
              <View className="w-16 h-16 rounded-full bg-brand-cyan items-center justify-center mb-4">
                <ImageIcon size={32} color="white" />
              </View>
              <Text className="text-brand-text font-sans font-bold text-lg">Upload Screenshot</Text>
              <Text className="text-brand-text-sec text-center mt-2 px-6">
                Supports .jpg, .png from your Gallery
              </Text>
            </>
          )}
        </GlassCard>
      </TouchableOpacity>

      <View className="gap-4">
        <GlassCard className="flex-row items-center gap-4 bg-brand-purple/5 border-brand-purple/20">
          <Sparkles size={24} color="#8B5CF6" />
          <View className="flex-1">
            <Text className="text-brand-text font-sans font-bold">AI Extraction</Text>
            <Text className="text-brand-text-sec text-sm">We'll identify titles, artists, and keys automatically.</Text>
          </View>
        </GlassCard>
      </View>

      <View className="mt-12 flex-row gap-4 items-center justify-between pb-20">
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text className="text-brand-text-dim font-sans font-bold">Skip for now</Text>
        </TouchableOpacity>
        <Button 
          title="Analyze Songs" 
          variant="primary" 
          size="sm"
          onPress={() => router.push('/onboarding/review')}
          disabled={!image}
          className={!image ? "opacity-50" : ""}
        />
      </View>
    </ScrollView>
  );
}
