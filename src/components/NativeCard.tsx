import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  unread?: boolean;
}

export const NativeCard = ({ children, className, unread }: CardProps) => (
  <View className={cn(
    'p-6 rounded-3xl border transition-all duration-300 relative',
    unread ? 'bg-surface-container-lowest shadow-lg border-outline-variant/20' : 'bg-surface-container-low border-transparent',
    className
  )}>
    {unread && <View className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-full" />}
    {children}
  </View>
);
