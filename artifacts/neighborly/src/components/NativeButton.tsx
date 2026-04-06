import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { cn } from '../lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const NativeButton = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  className, 
  disabled,
  loading 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-primary shadow-md',
    secondary: 'bg-surface-container-highest',
    outline: 'border border-outline',
    ghost: '',
  };

  const textVariants = {
    primary: 'text-on-primary',
    secondary: 'text-on-surface',
    outline: 'text-primary',
    ghost: 'text-on-surface-variant',
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={cn(
        'px-6 py-3 rounded-full flex-row items-center justify-center transition-all',
        variants[variant],
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#6750A4'} />
      ) : (
        <Text className={cn('font-bold text-base', textVariants[variant])}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
