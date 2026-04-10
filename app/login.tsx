import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Orb } from '../components/ui/Orb';
import { Heading, Subheading, Paragraph, Label } from '../components/ui/Typography';
import { Chrome, ShieldCheck, Zap, Library } from 'lucide-react-native';
import { supabase } from '../utils/supabase';

export default function LoginScreen() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    // In a real implementation with Supabase:
    // const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    // For now, we simulate success and move to onboarding
    router.replace('/onboarding/upload');
  };

  return (
    <ScrollView className="flex-1 bg-brand-bg" contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Hero Section */}
      <View className="px-6 pt-20 pb-10 items-center">
        <Orb size={64} variant="cyan" className="mb-6">
          <Text className="text-white text-2xl font-bold">T</Text>
        </Orb>
        <Heading className="text-center mb-2">Join the Future of Gigging</Heading>
        <Paragraph className="text-center">
          The all-in-one assistant for the modern Filipino musician.
        </Paragraph>
      </View>

      {/* Feature Cards */}
      <View className="px-6 gap-6 mb-10">
        <ValueProp 
          icon={<Zap size={24} color="#00D4FF" />}
          title="Instant Song Extraction"
          description="Snap a photo of your setlist. AI does the rest."
        />
        <ValueProp 
          icon={<Library size={24} color="#8B5CF6" />}
          title="Shared Knowledge"
          description="Find bandmates who already know your repertoire."
        />
        <ValueProp 
          icon={<ShieldCheck size={24} color="#10B981" />}
          title="Stage Ready"
          description="Access synced lyrics and chords, even offline."
        />
      </View>

      {/* Auth Section */}
      <View className="px-6 items-center">
        <GlassCard className="w-full items-center py-8">
          <Label className="mb-6">Get Started</Label>
          <Button 
            title="Continue with Google" 
            variant="glass" 
            onPress={handleGoogleLogin}
            className="flex-row gap-4"
          />
          <Paragraph className="mt-6 text-xs text-center opacity-60">
            By continuing, you agree to TukarTa's Terms of Service and Privacy Policy.
          </Paragraph>
        </GlassCard>
      </View>

      {/* Design System Link (Internal/Dev) */}
      <Button 
        title="View Design System" 
        variant="ghost" 
        onPress={() => router.push('/design-system')}
        className="mt-8"
      />
    </ScrollView>
  );
}

function ValueProp({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <GlassCard className="flex-row items-center gap-4">
      <View className="w-12 h-12 rounded-2xl bg-brand-surface items-center justify-center border border-white/5">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-brand-text font-sans font-bold text-base">{title}</Text>
        <Text className="text-brand-text-sec font-sans text-sm">{description}</Text>
      </View>
    </GlassCard>
  );
}
