import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Music, Star, Zap, Search, Mic, Calendar, Users, MessageSquare, Sparkles, Camera } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Orb } from '../../components/ui/Orb';
import { Pill } from '../../components/ui/Pill';
import { Heading, Subheading, Paragraph, Label } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-brand-bg" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header / Profile Summary */}
      <View className="px-6 pt-16 pb-8 flex-row items-center justify-between">
        <View>
          <Text className="text-brand-text-sec font-sans text-sm">Welcome back,</Text>
          <Heading className="text-3xl">Marco 👋</Heading>
        </View>
        <TouchableOpacity onPress={() => router.push('/design-system')}>
          <View className="w-12 h-12 rounded-full border-2 border-brand-cyan items-center justify-center overflow-hidden">
             <Image 
               source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco' }} 
               className="w-full h-full"
             />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View className="px-6 flex-row gap-4 mb-8">
        <StatCard label="Songs" value="142" icon={<Music size={16} color="#00D4FF" />} />
        <StatCard label="Live Set" value="28" icon={<Zap size={16} color="#10B981" />} />
        <StatCard label="Rating" value="4.9" icon={<Star size={16} color="#F59E0B" />} />
      </View>

      {/* Main Feature Banner */}
      <View className="px-6 mb-8">
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/ai-agent')}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-r-lg p-6 overflow-hidden"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <View className="bg-white/20 self-start px-2 py-1 rounded-full mb-2">
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">New Setlist AI</Text>
                </View>
                <Text className="text-white font-sans font-bold text-xl mb-1">
                  Ready for the gig?
                </Text>
                <Text className="text-white/80 text-sm">
                  Let AI build your next setlist based on your band's repertoire.
                </Text>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                <Sparkles size={32} color="white" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Grid */}
      <View className="px-6 mb-10">
        <Label className="mb-4">Quick Actions</Label>
        <View className="flex-row gap-4 mb-4">
          <ActionItem 
            title="Scan Setlist" 
            icon={<Camera size={24} color="#00D4FF" />} 
            onPress={() => router.push('/onboarding/upload')} 
          />
          <ActionItem 
            title="Stage Mode" 
            icon={<Zap size={24} color="#10B981" />} 
            onPress={() => router.push('/stage-mode')} 
          />
        </View>
        <View className="flex-row gap-4">
           <ActionItem 
            title="Marketplace" 
            icon={<Search size={24} color="#8B5CF6" />} 
            onPress={() => router.push('/discover')} 
          />
          <ActionItem 
            title="Upcoming Gigs" 
            icon={<Calendar size={24} color="#F59E0B" />} 
            onPress={() => {}} 
          />
        </View>
      </View>

      {/* Recent Activity / Next Event */}
      <View className="px-6">
        <Label className="mb-4">Next Event</Label>
        <GlassCard>
            <View className="flex-row items-center gap-4 mb-4">
              <Orb variant="cyan" size={48}>
                <Calendar size={24} color="#00D4FF" />
              </Orb>
              <View>
                <Subheading>The 19th Street Gig</Subheading>
                <Text className="text-brand-text-sec text-xs">Tomorrow · 9:00 PM</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center pt-4 border-t border-brand-glass-border">
              <View className="flex-row -space-x-3">
                 {[1,2,3].map(i => (
                    <View key={i} className="w-8 h-8 rounded-full border-2 border-brand-bg bg-brand-bg2" />
                 ))}
                 <View className="w-8 h-8 rounded-full border-2 border-brand-bg bg-brand-surface items-center justify-center">
                    <Text className="text-[10px] text-white">+2</Text>
                 </View>
              </View>
              <Pill label="32 SONGS" variant="purple" />
            </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <GlassCard className="flex-1 p-3 items-center">
      <View className="mb-1">{icon}</View>
      <Text className="text-brand-text font-bold text-lg">{value}</Text>
      <Text className="text-brand-text-dim text-[10px] uppercase font-bold">{label}</Text>
    </GlassCard>
  );
}

function ActionItem({ title, icon, onPress }: { title: string, icon: React.ReactNode, onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} className="flex-1">
      <GlassCard className="items-center py-6">
        <View className="mb-3">{icon}</View>
        <Text className="text-brand-text font-sans font-bold text-sm text-center">{title}</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

