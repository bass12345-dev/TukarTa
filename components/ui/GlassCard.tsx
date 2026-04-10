import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'react-native';
import { cn } from '../../utils/cn';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  intensity = 20, 
  tint,
  noPadding = false,
  ...props 
}) => {
  const colorScheme = useColorScheme();
  const activeTint = tint || (colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <View 
      className={cn(
        "overflow-hidden border border-brand-glass-border bg-brand-glass",
        className
      )}
      style={[{ borderRadius: intensity > 20 ? 20 : 14 }]}
      {...props}
    >
      <BlurView intensity={intensity} tint={activeTint} style={StyleSheet.absoluteFill} />
      <View className={noPadding ? "" : "p-4"}>{children}</View>
    </View>
  );
};
