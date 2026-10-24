import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { cn } from '../../utils/cn';
import { useAppTheme } from '../../context/theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  noPadding?: boolean;
  contentContainerStyle?: ViewProps['style'];
  variant?: 'glass' | 'white' | 'mint' | 'forest';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  intensity = 20, 
  tint,
  noPadding = false,
  contentContainerStyle,
  variant = 'white',
  style,
  ...props 
}) => {
  const { colors, isDark } = useAppTheme();

  if (variant === 'forest') {
    return (
      <View 
        style={[
          styles.forestCard,
          { backgroundColor: isDark ? '#064E3B' : '#166534' },
          noPadding ? {} : { padding: 18 },
          style
        ]}
        {...props}
      >
        <View style={contentContainerStyle}>{children}</View>
      </View>
    );
  }

  if (variant === 'mint') {
    return (
      <View 
        style={[
          styles.mintCard,
          { 
            backgroundColor: isDark ? colors.bgSecondary : '#F0FDF4',
            borderColor: colors.border
          },
          noPadding ? {} : { padding: 16 },
          style
        ]}
        {...props}
      >
        <View style={contentContainerStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.whiteCard,
        {
          backgroundColor: isDark ? colors.bgCard : '#FFFFFF',
          borderColor: colors.border
        },
        noPadding ? {} : { padding: 16 },
        style
      ]}
      className={className}
      {...props}
    >
      <View style={contentContainerStyle}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  mintCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 18,
    overflow: 'hidden',
  },
  forestCard: {
    backgroundColor: '#166534',
    borderRadius: 20,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
});
