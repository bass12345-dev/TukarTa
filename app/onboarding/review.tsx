import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Star, Zap, Trash2, ArrowRight } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';
import { Heading, Paragraph, Label } from '../../components/ui/Typography';

const MOCK_EXTRACTED_SONGS = [
  { id: '1', title: 'Ang Huling El Bimbo', artist: 'Eraserheads', confidence: 5, live: true },
  { id: '2', title: 'Narda', artist: 'Kamikazee', confidence: 5, live: true },
  { id: '3', title: 'Kisapmata', artist: 'Rivermaya', confidence: 4, live: false },
  { id: '4', title: 'Magasin', artist: 'Eraserheads', confidence: 3, live: false },
];

export default function ReviewSongsOnboarding() {
  const router = useRouter();
  const [songs, setSongs] = useState(MOCK_EXTRACTED_SONGS);

  const toggleLive = (id: string) => {
    setSongs(s => s.map(item => item.id === id ? { ...item, live: !item.live } : item));
  };

  return (
    <View className="flex-1 bg-brand-bg">
      <ScrollView className="flex-1 px-6 pt-12" contentContainerStyle={{ paddingBottom: 120 }}>
        <Label className="text-brand-purple mb-2">Step 2 of 3</Label>
        <Heading>Review Extracted Songs</Heading>
        <Paragraph className="mt-2 mb-8">
          We found {songs.length} songs. Mark the ones you can perform live right now.
        </Paragraph>

        <View className="gap-4">
          {songs.map((song) => (
            <GlassCard key={song.id} className="flex-row items-center gap-4">
              <Orb size={40} variant={song.live ? "green" : "purple"}>
                <Text className="text-white font-bold">{song.title[0]}</Text>
              </Orb>
              <View className="flex-1">
                <Text className="text-brand-text font-sans font-bold text-base" numberOfLines={1}>
                  {song.title}
                </Text>
                <Text className="text-brand-text-sec text-sm">{song.artist}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => toggleLive(song.id)}
                className={`w-12 h-12 rounded-xl items-center justify-center border ${song.live ? 'bg-brand-green/20 border-brand-green/40' : 'bg-brand-surface border-white/5'}`}
              >
                <Zap size={20} color={song.live ? "#10B981" : "#94A3B8"} />
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>

        <TouchableOpacity className="mt-6 flex-row items-center justify-center gap-2">
           <Text className="text-brand-cyan font-sans font-semibold">+ Add song manually</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Action Container */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-brand-bg/80 border-t border-brand-glass-border">
        <Button 
          title="Looks Good — Save Library" 
          variant="primary" 
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </View>
  );
}
