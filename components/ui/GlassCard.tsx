import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'react-native';
import { cn } from '../../utils/cn';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  intensity = 20, 
  tint,
  ...props 
}) => {
  const colorScheme = useColorScheme();
  const activeTint = tint || (colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <View 
      className={cn(
        "overflow-hidden border border-brand-glass-border rounded-r-lg bg-brand-glass",
        className
      )}
      {...props}
    >
      <BlurView intensity={intensity} tint={activeTint} style={StyleSheet.absoluteFill} />
      <View className="p-4">{children}</View>
    </View>
  );
};
