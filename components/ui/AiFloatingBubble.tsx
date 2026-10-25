import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/theme';

/** Floating "Ask AI" robot mascot that sits above the tab bar and opens the AI assistant. */
export const AiFloatingBubble: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: (Platform.OS === 'web' ? 82 : 74) + insets.bottom }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/ai-agent')}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Open AI assistant"
      >
        <View style={[styles.robotWrapper, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Image
            source={require('../../assets/images/ai-robot-removebg-preview.png')}
            style={styles.robotImage}
            resizeMode="contain"
          />
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.bgCard }]}>
          <Text style={styles.badgeText}>ASK AI</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
  },
  button: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotImage: {
    width: 50,
    height: 50,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
