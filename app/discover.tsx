import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Filter, MapPin, Star, Music, MessageCircle } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Orb } from '../components/ui/Orb';
import { Pill } from '../components/ui/Pill';
import { Heading, Subheading, Paragraph, Label } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

const MOCK_MUSICIANS = [
  {
    id: '1',
    name: 'Sarah J.',
    role: 'Lead Vocals',
    location: 'Quezon City',
    rating: 4.9,
    reviews: 24,
    matches: 12,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    genres: ['Rock', 'Pop', 'OPM'],
  },
  {
    id: '2',
    name: 'David L.',
    role: 'Drummer',
    location: 'Makati City',
    rating: 4.8,
    reviews: 18,
    matches: 8,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    genres: ['Jazz', 'Funk', 'Blues'],
  },
];

export default function DiscoverScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-brand-bg">
      <Stack.Screen options={{ title: "Marketplace", headerShown: false }} />
      
      <ScrollView className="flex-1 px-6 pt-16" contentContainerStyle={{ paddingBottom: 100 }}>
        <Heading className="mb-2">Discover Players</Heading>
        <Paragraph className="mb-8">Find sessionists who already know your songs.</Paragraph>

        {/* Search Bar */}
        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 h-12 bg-brand-bg2 rounded-r-md border border-brand-glass-border flex-row items-center px-4">
            <Search size={20} color="#94A3B8" />
            <TextInput 
              placeholder="Search by role or city..." 
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-3 text-brand-text font-sans"
            />
          </View>
          <TouchableOpacity className="w-12 h-12 bg-brand-cyan items-center justify-center rounded-r-md">
             <Filter size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Featured Musicians */}
        <Label className="mb-4">Recommended for You</Label>
        <View className="gap-6">
          {MOCK_MUSICIANS.map((musician) => (
            <GlassCard key={musician.id} className="p-0 overflow-hidden">
               <View className="p-5">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center gap-4">
                      <Image source={{ uri: musician.avatar }} className="w-16 h-16 rounded-2xl bg-brand-surface" />
                      <View>
                        <Subheading>{musician.name}</Subheading>
                        <Text className="text-brand-cyan font-sans font-bold text-xs uppercase">{musician.role}</Text>
                        <View className="flex-row items-center gap-1 mt-1">
                           <MapPin size={12} color="#94A3B8" />
                           <Text className="text-brand-text-dim text-xs">{musician.location}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                       <View className="flex-row items-center gap-1">
                          <Star size={14} color="#F59E0B" fill="#F59E0B" />
                          <Text className="text-brand-text font-bold text-sm">{musician.rating}</Text>
                       </View>
                       <Text className="text-brand-text-dim text-[10px]">{musician.reviews} Reviews</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-4 flex-wrap">
                     {musician.genres.map(g => <Pill key={g} label={g} variant="purple" />)}
                  </View>

                  <GlassCard className="bg-brand-cyan/5 border-brand-cyan/20 p-3 mb-4">
                     <View className="flex-row items-center gap-2">
                        <Music size={16} color="#00D4FF" />
                        <Text className="text-brand-text text-xs font-sans">
                           Knows <Text className="font-bold text-brand-cyan">{musician.matches} songs</Text> from your current setlist.
                        </Text>
                     </View>
                  </GlassCard>

                  <View className="flex-row gap-3">
                     <Button title="View Profile" variant="glass" className="flex-1 h-[44px]" />
                     <Button title="Chat" variant="primary" className="flex-1 h-[44px]" />
                  </View>
               </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
