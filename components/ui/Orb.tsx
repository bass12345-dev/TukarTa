import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../utils/cn';

interface OrbProps extends ViewProps {
  variant?: 'cyan' | 'purple' | 'gold' | 'green' | 'pink';
  size?: number;
}

const variantConfig = {
  cyan: {
    colors: ['rgba(0, 212, 255, 0.25)', 'rgba(0, 180, 220, 0.08)'],
    border: 'rgba(0, 212, 255, 0.3)',
    shadow: '#00D4FF',
  },
  purple: {
    colors: ['rgba(139, 92, 246, 0.25)', 'rgba(100, 60, 200, 0.08)'],
    border: 'rgba(139, 92, 246, 0.3)',
    shadow: '#8B5CF6',
  },
  gold: {
    colors: ['rgba(245, 158, 11, 0.25)', 'rgba(200, 120, 0, 0.08)'],
    border: 'rgba(245, 158, 11, 0.3)',
    shadow: '#F59E0B',
  },
  green: {
    colors: ['rgba(16, 185, 129, 0.25)', 'rgba(0, 150, 100, 0.08)'],
    border: 'rgba(16, 185, 129, 0.3)',
    shadow: '#10B981',
  },
  pink: {
    colors: ['rgba(236, 72, 153, 0.25)', 'rgba(180, 40, 120, 0.08)'],
    border: 'rgba(236, 72, 153, 0.3)',
    shadow: '#EC4899',
  },
};

export const Orb: React.FC<OrbProps> = ({ 
  children, 
  variant = 'cyan', 
  size = 44, 
  className,
  ...props 
}) => {
  const config = variantConfig[variant];

  return (
    <View 
      style={{ width: size, height: size }}
      className={cn("items-center justify-center relative", className)}
      {...props}
    >
      {/* Outer Glow */}
      <View 
        style={[
          styles.glow, 
          { 
            backgroundColor: config.shadow,
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2
          }
        ]} 
      />
      
      <LinearGradient
        colors={config.colors as any}
        start={{ x: 0.5, y: 0.5 }} // Simulated radial center
        end={{ x: 1, y: 1 }}
        style={[
          styles.orbContainer,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderColor: config.border,
          }
        ]}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  orbContainer: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
    filter: 'blur(8px)',
  }
});
