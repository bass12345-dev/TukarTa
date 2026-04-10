import React from 'react';
import { Text, TextProps } from 'react-native';
import { cn } from '../../utils/cn';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

export const Heading: React.FC<TypographyProps> = ({ children, className, ...props }) => (
  <Text className={cn("font-sans font-bold text-brand-text text-[24px]", className)} {...props}>
    {children}
  </Text>
);

export const Subheading: React.FC<TypographyProps> = ({ children, className, ...props }) => (
  <Text className={cn("font-sans font-semibold text-brand-text text-[18px]", className)} {...props}>
    {children}
  </Text>
);

export const Paragraph: React.FC<TypographyProps> = ({ children, className, ...props }) => (
  <Text className={cn("font-sans text-brand-text-sec text-[14px] leading-[22px]", className)} {...props}>
    {children}
  </Text>
);

export const Label: React.FC<TypographyProps> = ({ children, className, ...props }) => (
  <Text 
    className={cn("font-sans font-bold text-brand-text-dim text-[11px] uppercase tracking-[0.09em]", className)} 
    {...props}
  >
    {children}
  </Text>
);

export const Mono: React.FC<TypographyProps> = ({ children, className, ...props }) => (
  <Text className={cn("font-mono text-brand-cyan text-[12px]", className)} {...props}>
    {children}
  </Text>
);
