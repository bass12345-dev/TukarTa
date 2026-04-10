import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Share2, MoreHorizontal, Music, Clock } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';
import { Heading, Subheading, Paragraph, Mono, Label } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

const MOCK_SETLIST_SONGS = [
  { id: '1', title: 'Ang Huling El Bimbo', artist: 'Eraserheads', key: 'G', duration: '5:42' },
  { id: '2', title: 'Narda', artist: 'Kamikazee', key: 'A', duration: '3:58' },
  { id: '3', title: 'Kisapmata', artist: 'Rivermaya', key: 'D', duration: '4:15' },
  { id: '4', title: 'Magasin', artist: 'Eraserheads', key: 'G', duration: '4:11' },
  { id: '5', title: 'Alapaap', artist: 'Eraserheads', key: 'C', duration: '4:25' },
];

export default function SetlistDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View className="flex-1 bg-brand-bg">
      <Stack.Screen 
        options={{ 
          title: "Setlist Details",
          headerShown: false,
        }} 
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Hero */}
        <View className="px-6 pt-16 pb-8 bg-brand-bg2">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <ChevronLeft size={24} color="#F0F4FF" />
          </TouchableOpacity>
          <Pill label="UPCOMING GIG" variant="cyan" className="mb-2" />
          <Heading className="text-3xl mb-1">The 19th Street Gig</Heading>
          <View className="flex-row items-center gap-4">
             <View className="flex-row items-center gap-1">
                <Clock size={14} color="#94A3B8" />
                <Text className="text-brand-text-dim text-xs">90 Minutes</Text>
             </View>
             <View className="flex-row items-center gap-1">
                <Music size={14} color="#94A3B8" />
                <Text className="text-brand-text-dim text-xs">32 Songs</Text>
             </View>
          </View>
        </View>

        {/* Action Bar */}
        <View className="flex-row gap-4 px-6 -mt-6">
          <Button 
            title="Start Stage Mode" 
            variant="primary" 
            className="flex-1 shadow-lg"
            onPress={() => router.push('/stage-mode')}
          />
          <TouchableOpacity className="w-12 h-12 bg-brand-glass border border-white/10 rounded-r-md items-center justify-center">
             <Share2 size={20} color="#F0F4FF" />
          </TouchableOpacity>
        </View>

        {/* Songs List */}
        <View className="px-6 mt-10">
          <Label className="mb-6">Setlist Order</Label>
          {MOCK_SETLIST_SONGS.map((song, index) => (
            <TouchableOpacity 
              key={song.id}
              activeOpacity={0.7}
              onPress={() => router.push('/stage-mode')}
            >
              <View className="flex-row items-center gap-4 mb-4">
                <View className="w-8 items-center">
                  <Text className="text-brand-text-dim font-mono font-bold">{index + 1}</Text>
                </View>
                <GlassCard className="flex-1 flex-row items-center justify-between">
                   <View>
                      <Text className="text-brand-text font-sans font-bold text-base">{song.title}</Text>
                      <Text className="text-brand-text-sec text-xs">{song.artist}</Text>
                   </View>
                   <View className="items-end">
                      <Mono className="text-brand-cyan mb-1">{song.key}</Mono>
                      <Text className="text-brand-text-dim text-[10px]">{song.duration}</Text>
                   </View>
                </GlassCard>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
