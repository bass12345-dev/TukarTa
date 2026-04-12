import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import { Button } from '../components/ui/Button';
import { Mascot } from '../components/ui/Mascot';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1250,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1250,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0d2d45', '#071420']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />

        <Text style={styles.tagline}>
          The AI co-pilot for musicians and bands
        </Text>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <Button 
            title="Get Started" 
            variant="cyan" 
            onPress={handleGetStarted}
            style={styles.button}
          />
        </Animated.View>

        <Text style={styles.footerText}>
          v1.0.0 — GEC PROJECT
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoImage: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 34,
  },
  logoTextLight: {
    fontFamily: 'DM Sans Medium',
    color: '#00D4FF', 
  },
  logoTextBold: {
    fontFamily: 'DM Sans Bold',
    color: '#F0F4FF',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(200, 215, 235, 0.6)',
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 22,
    fontFamily: 'DM Sans',
  },
  buttonWrapper: {
    marginTop: 60,
    width: 200,
  },
  button: {
    width: '100%',
  },
  footerText: {
    position: 'absolute',
    bottom: -100, // Relative to content center
    fontSize: 10,
    color: 'rgba(150, 175, 200, 0.35)',
    fontFamily: 'JetBrains Mono Bold',
  }
});
