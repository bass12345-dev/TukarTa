import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../utils/cn';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'glass' | 'ghost';
  size?: 'default' | 'sm';
  title: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  size = 'default', 
  className,
  ...props 
}) => {
  const isPrimary = variant === 'primary';
  const isGlass = variant === 'glass';
  const isSm = size === 'sm';

  const containerClasses = cn(
    "flex-row items-center justify-center rounded-r-md",
    isSm ? "h-[38px] px-[18px]" : "h-[52px] w-full px-6",
    isGlass && "bg-brand-glass border border-brand-glass-border",
    className
  );

  const textClasses = cn(
    "font-sans font-semibold text-center",
    isSm ? "text-[13px]" : "text-[16px]",
    isPrimary ? "text-white" : "text-brand-text",
    variant === 'ghost' && "text-brand-cyan"
  );

  if (isPrimary) {
    return (
      <TouchableOpacity activeOpacity={0.8} {...props}>
        <LinearGradient
          colors={['#00c8f0', '#0080c8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={containerClasses}
          style={{ shadowColor: '#00b4dc', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 }}
        >
          <Text className={textClasses}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      className={containerClasses} 
      {...props}
    >
      <Text className={textClasses}>{title}</Text>
    </TouchableOpacity>
  );
};
