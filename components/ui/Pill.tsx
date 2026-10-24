import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface PillProps extends ViewProps {
  variant?: 'cyan' | 'purple' | 'green' | 'gold' | 'pink' | 'outline' | 'gray' | 'mint' | 'mint-subtle' | 'mint-dark';
  label: string;
  dotColor?: string;
}

const variantStyles = {
  mint: "bg-[#10B981] text-white border-transparent",
  "mint-subtle": "bg-[#D1FAE5] text-[#166534] border-[#A7F3D0]",
  "mint-dark": "bg-[#166534] text-[#D1FAE5] border-transparent",
  cyan: "bg-brand-cyan-dim text-brand-cyan border-brand-cyan/20",
  purple: "bg-brand-purple-dim text-[#a78bfa] border-brand-purple/25",
  green: "bg-[#F0FDF4] text-[#10B981] border-[#D1FAE5]",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  pink: "bg-rose-50 text-rose-600 border-rose-200",
  outline: "bg-transparent text-[#166534] border-[#D1FAE5]",
  gray: "bg-slate-100 text-slate-600 border-slate-200",
};

export const Pill: React.FC<PillProps> = ({ 
  label, 
  variant = 'mint-subtle', 
  dotColor,
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
      {dotColor && <View className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: dotColor }} />}
      <Text className={cn("font-sans font-semibold text-[11px]", variantStyles[variant].split(' ').find(c => c.startsWith('text-')))}>
        {label}
      </Text>
    </View>
  );
};
