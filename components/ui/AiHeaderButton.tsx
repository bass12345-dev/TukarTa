import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/theme';

/** Compact "Ask AI" entry point that lives in screen headers (replaces the old floating mascot). */
export const AiHeaderButton: React.FC<{ label?: string }> = ({ label = 'Ask AI' }) => {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push('/ai-agent')}
      accessibilityLabel="Open AI assistant"
    >
      <Sparkles size={15} color={colors.primaryDark} />
      <Text style={[styles.text, { color: colors.primaryDark }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
  },
  text: { fontSize: 12.5, fontWeight: '800' },
});
