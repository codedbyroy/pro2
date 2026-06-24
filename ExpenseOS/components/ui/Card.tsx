// components/ui/Card.tsx
// Glassmorphism-style gradient card component
// Integrates expo-linear-gradient for vibrant, fluid, and borderless design aesthetics

import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow, Spacing } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'income' | 'expense' | 'saving' | 'glass';
  padding?: number;
  gradientColors?: string[];
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = Spacing.md,
  gradientColors,
}) => {
  const getGradientColors = () => {
    if (gradientColors) return gradientColors;
    switch (variant) {
      case 'elevated':
        // Vibrant glowing brand accent card
        return ['#1C1635', '#0E0B1B']; 
      case 'income':
        return ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.01)'];
      case 'expense':
        return ['rgba(244, 63, 94, 0.08)', 'rgba(244, 63, 94, 0.01)'];
      case 'saving':
        return ['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.01)'];
      case 'glass':
        return ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)'];
      case 'default':
      default:
        return ['#121422', '#0A0C14']; // Dark Obsidian space-blend
    }
  };

  const borderColors = {
    default: 'rgba(255, 255, 255, 0.04)',
    elevated: 'rgba(192, 132, 252, 0.2)', // Amethyst orchid glow
    income: 'rgba(16, 185, 129, 0.12)',
    expense: 'rgba(244, 63, 94, 0.12)',
    saving: 'rgba(245, 158, 11, 0.12)',
    glass: 'rgba(255, 255, 255, 0.06)',
  };

  return (
    <LinearGradient
      colors={getGradientColors() as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.base,
        {
          padding,
          borderColor: borderColors[variant] || borderColors.default,
          borderWidth: 1,
        },
        variant === 'elevated' && Shadow.primary,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
});
