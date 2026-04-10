import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface OrbProps extends ViewProps {
  variant?: 'cyan' | 'purple' | 'gold' | 'green' | 'pink';
  size?: number;
}

const variantStyles = {
  cyan: "bg-brand-cyan-glow border-brand-cyan/30",
  purple: "bg-brand-purple-glow border-brand-purple/30",
  gold: "bg-brand-gold-dim border-brand-gold/30",
  green: "bg-brand-green-dim border-brand-green/30",
  pink: "bg-brand-pink/10 border-brand-pink/20",
};

export const Orb: React.FC<OrbProps> = ({ 
  children, 
  variant = 'cyan', 
  size = 44, 
  className,
  ...props 
}) => {
  return (
    <View 
      style={{ width: size, height: size }}
      className={cn(
        "rounded-full items-center justify-center border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <View 
        className={cn("absolute inset-[-4px] rounded-full opacity-30 blur-sm", 
        variant === 'cyan' ? "bg-brand-cyan" : 
        variant === 'purple' ? "bg-brand-purple" : 
        variant === 'gold' ? "bg-brand-gold" : 
        variant === 'green' ? "bg-brand-green" : "bg-brand-pink")} 
      />
      {children}
    </View>
  );
};
