import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MascotProps {
  size?: number;
  animated?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({ size = 160, animated = true }) => {
  const scale = size / 160;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.sin,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.sin,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10 * scale],
  });

  const eyeGlowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: size, height: size, transform: [{ translateY }] }
      ]}
    >
      {/* Glow Backdrop */}
      <Animated.View 
        style={[
          styles.glowBackdrop,
          { 
            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }),
            transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }]
          }
        ]}
      />

      <LinearGradient
        colors={['#a0c8f8', '#7a9de8', '#9b8ef4', '#c084fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mascotBody}
      >
        {/* Headphones */}
        <View style={[styles.headphone, styles.headphoneL]} />
        <View style={[styles.headphone, styles.headphoneR]} />

        {/* Inner Face */}
        <View style={styles.face}>
          <View style={styles.eyesContainer}>
            <View style={styles.eye}>
              <Animated.View style={[styles.eyeGlow, { transform: [{ scale: eyeGlowScale }] }]} />
              <View style={styles.pupil} />
            </View>
            <View style={styles.eye}>
              <Animated.View style={[styles.eyeGlow, { transform: [{ scale: eyeGlowScale }] }]} />
              <View style={styles.pupil} />
            </View>
          </View>
          <View style={styles.smile} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
    opacity: 0.3,
    filter: 'blur(30px)',
  },
  mascotBody: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  face: {
    width: '75%',
    height: '75%',
    backgroundColor: 'rgba(10, 20, 35, 0.85)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headphone: {
    position: 'absolute',
    width: '14%',
    height: '22%',
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    borderRadius: 8,
    top: '28%',
  },
  headphoneL: {
    left: -4,
  },
  headphoneR: {
    right: -4,
  },
  eyesContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  eye: {
    width: 20,
    height: 20,
    backgroundColor: '#00D4FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#00D4FF',
    opacity: 0.5,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  pupil: {
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  smile: {
    width: 34,
    height: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#00D4FF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: 2,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
