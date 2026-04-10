import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface PillProps extends ViewProps {
  variant?: 'cyan' | 'purple' | 'green' | 'gold' | 'pink';
  label: string;
}

const variantStyles = {
  cyan: "bg-brand-cyan-dim text-brand-cyan border-brand-cyan/20",
  purple: "bg-brand-purple-dim text-[#a78bfa] border-brand-purple/25",
  green: "bg-brand-green-dim text-brand-green border-brand-green/20",
  gold: "bg-brand-gold-dim text-brand-gold border-brand-gold/20",
  pink: "bg-brand-pink/10 text-brand-pink border-brand-pink/20",
};

export const Pill: React.FC<PillProps> = ({ 
  label, 
  variant = 'cyan', 
  className,
  ...props 
}) => {
  return (
    <View 
      className={cn(
        "inline-flex flex-row items-center gap-[5px] px-[10px] py-[4px] rounded-full border",
        variantStyles[variant].split(' ').filter(c => !c.startsWith('text-')).join(' '),
        className
      )}
      {...props}
    >
      <Text className={cn("font-sans font-semibold text-[11px]", variantStyles[variant].split(' ').find(c => c.startsWith('text-')))}>
        {label}
      </Text>
    </View>
  );
};
