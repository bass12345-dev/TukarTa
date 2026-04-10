import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Maximize2, Minimize2, MoreHorizontal, Music, Settings } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Heading, Subheading, Paragraph, Mono } from '../components/ui/Typography';
import { Pill } from '../components/ui/Pill';

export default function StageModeScreen() {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(18);
  const [key, setKey] = useState('Am');

  return (
    <View className="flex-1 bg-[#050d14]">
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      {/* Stage Header */}
      <View className="px-6 pt-12 pb-4 flex-row items-center justify-between border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()}>
          <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
            <ChevronLeft size={24} color="#F0F4FF" />
          </View>
        </TouchableOpacity>
        
        <View className="items-center">
           <Text className="text-brand-cyan font-mono text-[10px] tracking-widest uppercase">Now Playing</Text>
           <Text className="text-white font-sans font-bold text-lg">Ang Huling El Bimbo</Text>
        </View>

        <TouchableOpacity>
           <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
            <Settings size={20} color="#F0F4FF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Control Bar */}
      <View className="px-6 py-4 flex-row gap-4">
        <GlassCard className="flex-1 flex-row items-center justify-between py-2 px-4 border-brand-purple/20">
          <Text className="text-brand-text-sec text-xs uppercase font-bold">Key</Text>
          <Text className="text-brand-purple font-mono font-bold text-lg">{key}</Text>
        </GlassCard>
        <GlassCard className="flex-1 flex-row items-center justify-between py-2 px-4 border-brand-cyan/20">
          <Text className="text-brand-text-sec text-xs uppercase font-bold">BPM</Text>
          <Text className="text-brand-cyan font-mono font-bold text-lg">120</Text>
        </GlassCard>
      </View>

      {/* Lyrics Content */}
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="mb-10">
          <Mono className="text-brand-purple mb-2">[Intro]</Mono>
          <Text style={{ fontSize, color: '#F0F4FF', lineHeight: fontSize * 1.6 }} className="font-sans">
            G - A - C - G
          </Text>
        </View>

        <View className="mb-10">
          <Mono className="text-brand-purple mb-2">[Verse 1]</Mono>
          <Text style={{ fontSize, color: '#F0F4FF', lineHeight: fontSize * 1.6 }} className="font-sans">
            Kamukha mo si Paraluman nung tayo ay bata pa{"\n"}
            At ang galing-galing mong sumayaw, mapa-Boogie man o Cha-Cha{"\n"}
            Ngunit ang paborito ay ang pagsayaw mo ng El Bimbo{"\n"}
            Nakaka-indak, nakaka-aliw, nakaka-tindig-balahibo
          </Text>
        </View>

        <View className="mb-10">
           <Mono className="text-brand-purple mb-2">[Chorus]</Mono>
           <Text style={{ fontSize, color: '#F0F4FF', lineHeight: fontSize * 1.6 }} className="font-sans font-bold">
             Magkahawak ang ating kamay at walang kamalay-malay{"\n"}
             Na tinuturuan mo ang puso ko na umibig ng tunay
           </Text>
        </View>

        <View className="h-40" />
      </ScrollView>

      {/* Font Controls Overlay */}
      <View className="absolute bottom-10 right-6 gap-3">
        <TouchableOpacity 
          onPress={() => setFontSize(s => Math.min(s + 2, 32))}
          className="w-14 h-14 rounded-full bg-brand-cyan items-center justify-center shadow-lg"
        >
          <Text className="text-white text-xl font-bold">A+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setFontSize(s => Math.max(s - 2, 12))}
          className="w-14 h-14 rounded-full bg-brand-glass border border-white/10 items-center justify-center"
        >
          <Text className="text-white text-xl font-bold">A-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
