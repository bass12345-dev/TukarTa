import React from 'react';
import { ScrollView, View, StyleSheet, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Music, Star, Zap, Search, Mic, Sun, Moon } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Orb } from '../components/ui/Orb';
import { Pill } from '../components/ui/Pill';
import { Heading, Subheading, Paragraph, Label, Mono } from '../components/ui/Typography';

export default function DesignSystemScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <View style={styles.container} className="flex-1 bg-brand-bg">
      <Stack.Screen 
        options={{ 
          title: "Design System",
          headerShown: true,
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071420' : '#F8FAFC' },
          headerTintColor: colorScheme === 'dark' ? '#F0F4FF' : '#0F172A',
        }} 
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* Typography Section */}
        <Section title="Typography">
          <Heading className="mb-2">Heading 1</Heading>
          <Subheading className="mb-2">Subheading 2</Subheading>
          <Paragraph className="mb-4">
            This is a paragraph using the DM Sans font, matching the premium aesthetic of the mobile prototype.
          </Paragraph>
          <Label className="mb-2">Section Label</Label>
          <Mono>JetBrains Mono: Key: Am | 120 BPM</Mono>
        </Section>

        {/* Theme Section */}
        <Section title="Theme Info">
          <GlassCard className="flex-row items-center gap-4">
            {colorScheme === 'dark' ? (
              <Orb variant="purple"><Moon size={20} color="#8B5CF6" /></Orb>
            ) : (
              <Orb variant="gold"><Sun size={20} color="#F59E0B" /></Orb>
            )}
            <View>
              <Subheading>Current Mode: {colorScheme?.toUpperCase()}</Subheading>
              <Paragraph>Colors are now driven by CSS variables.</Paragraph>
            </View>
          </GlassCard>
        </Section>

        {/* Buttons Section */}
        <Section title="Buttons">
          <View className="gap-4">
            <Button title="Primary Button" variant="primary" />
            <Button title="Glass Button" variant="glass" />
            <Button title="Ghost Button" variant="ghost" />
            <View className="flex-row gap-4">
              <Button title="Small Primary" size="sm" variant="primary" />
              <Button title="Small Glass" size="sm" variant="glass" />
            </View>
          </View>
        </Section>

        {/* Cards Section */}
        <Section title="Glass Cards">
          <GlassCard className="mb-4">
            <Subheading className="mb-1">Handuraw Café</Subheading>
            <Paragraph>Tomorrow · 8:00 PM · 90 min</Paragraph>
            <View className="flex-row justify-between items-center mt-4 pt-2 border-t border-brand-glass-border">
              <Paragraph className="text-brand-text-sec">Acoustic Vibes Mix</Paragraph>
              <Pill label="TONIGHT" variant="gold" />
            </View>
          </GlassCard>
          
          <GlassCard intensity={40} className="border-brand-cyan/20">
            <Paragraph className="text-brand-cyan italic">
              "Build smarter setlists. Find musicians who already know your songs."
            </Paragraph>
          </GlassCard>
        </Section>

        {/* Orbs & Pills Section */}
        <Section title="Status Orbs & Pills">
          <View className="flex-row flex-wrap gap-4 mb-6">
            <Orb variant="cyan"><Music size={20} color="#00D4FF" /></Orb>
            <Orb variant="purple"><Zap size={20} color="#8B5CF6" /></Orb>
            <Orb variant="green"><Search size={20} color="#10B981" /></Orb>
            <Orb variant="gold"><Star size={20} color="#F59E0B" /></Orb>
            <Orb variant="pink"><Mic size={20} color="#EC4899" /></Orb>
          </View>
          
          <View className="flex-row flex-wrap gap-4">
            <Pill label="SINGERS" variant="cyan" />
            <Pill label="EXPERIENCED" variant="purple" />
            <Pill label="AVAILABLE" variant="green" />
            <Pill label="PREMIUM" variant="gold" />
            <Pill label="VOCALS" variant="pink" />
          </View>
        </Section>

      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View className="mb-10">
      <Label className="mb-6 border-b border-brand-glass-border pb-2">{title}</Label>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  }
});
