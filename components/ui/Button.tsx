import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../utils/cn';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'glass' | 'ghost' | 'cyan' | 'mint' | 'mint-dark' | 'outline-mint';
  size?: 'default' | 'sm' | 'lg';
  title: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  size = 'default', 
  icon,
  isLoading,
  className,
  style,
  ...props 
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  if (variant === 'mint') {
    return (
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={[
          styles.base,
          isSm ? styles.sm : isLg ? styles.lg : styles.default,
          { backgroundColor: '#10B981', shadowColor: '#D1FAE5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 4 },
          style
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[styles.text, { color: '#FFFFFF', fontWeight: '700' }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'mint-dark') {
    return (
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={[
          styles.base,
          isSm ? styles.sm : isLg ? styles.lg : styles.default,
          { backgroundColor: '#166534' },
          style
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[styles.text, { color: '#FFFFFF', fontWeight: '700' }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'outline-mint') {
    return (
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={[
          styles.base,
          isSm ? styles.sm : isLg ? styles.lg : styles.default,
          { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1FAE5' },
          style
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color="#166534" size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[styles.text, { color: '#166534', fontWeight: '600' }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const isPrimary = variant === 'primary' || variant === 'cyan';
  const isGlass = variant === 'glass';

  const containerClasses = cn(
    "flex-row items-center justify-center",
    isSm ? "h-[38px] px-[18px] rounded-[10px]" : "h-[52px] w-full px-6 rounded-r-md",
    isGlass && "bg-brand-glass border border-brand-glass-border rounded-r-md",
    variant === 'ghost' && "bg-transparent",
    className
  );

  const textClasses = cn(
    "font-sans font-semibold text-center",
    isSm ? "text-[13px]" : "text-[16px]",
    isPrimary ? "text-white" : "text-brand-text",
    variant === 'ghost' && "text-mint-600 text-[15px]"
  );

  if (isPrimary) {
    const gradientColors = ['#10B981', '#059669'] as const;
    
    return (
      <TouchableOpacity activeOpacity={0.8} style={style} {...props}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={containerClasses}
          style={{ 
            boxShadow: [{
              color: 'rgba(16, 185, 129, 0.35)', 
              offsetX: 0, 
              offsetY: 4, 
              blurRadius: 24 
            }],
            elevation: 8 
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
              <Text className={textClasses}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      className={containerClasses} 
      style={style}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#10B981" size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text className={textClasses}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  default: {
    height: 48,
    paddingHorizontal: 20,
    width: '100%',
  },
  sm: {
    height: 38,
    paddingHorizontal: 16,
  },
  lg: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 18,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
  },
});
