import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite breathing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = () => {
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-brand-bg items-center justify-center px-6">
      {/* Background Gradient Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: '#00D4FF20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: '#8B5CF620', width: 300, height: 300 }]} />

      <Animated.View 
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        className="items-center"
      >
        {/* Animated Mascot Wrapper */}
        <View className="relative w-40 h-40 items-center justify-center mb-8">
          <Animated.View 
            style={{ 
              opacity: glowAnim,
              transform: [{ scale: glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [1, 1.25] }) }] 
            }}
            className="absolute w-32 h-32 rounded-full bg-brand-cyan/20 blur-xl"
          />
          <View className="w-24 h-24 rounded-3xl bg-brand-cyan items-center justify-center rotate-12 border-4 border-white/20">
            <Text className="text-white text-5xl font-bold -rotate-12">T</Text>
          </View>
          {/* Audio Wave Decor */}
          <View className="flex-row gap-1 absolute bottom-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <View 
                key={i} 
                style={{ height: 10 + Math.random() * 15 }} 
                className="w-1 bg-white/40 rounded-full" 
              />
            ))}
          </View>
        </View>

        <Text className="text-white font-sans font-bold text-4xl mb-2 text-center">
          TukarTa
        </Text>
        <Text className="text-brand-cyan font-mono text-sm tracking-widest mb-10 text-center">
          SETLIST AI · MANILA
        </Text>

        <GlassCard className="w-full max-w-sm mb-12">
          <Text className="text-brand-text-sec font-sans text-center leading-6">
            Transform your song library into smart setlists using AI.
          </Text>
        </GlassCard>

        <Button 
          title="Get Started" 
          variant="primary" 
          onPress={handleGetStarted}
          className="w-full max-w-sm"
        />
        
        <Text className="text-brand-text-dim font-sans text-xs mt-6">
          v1.0.0 — GEC PROJECT
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 999,
    filter: 'blur(60px)',
  }
});
