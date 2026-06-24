// components/ui/AnimatedButton.tsx
// Reusable button with scale-press animation and LinearGradient support
// Used everywhere in ExpenseOS for premium feel

import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Typography, Shadow, Animation } from '../../constants/theme';

interface AnimatedButtonProps {
  onPress: () => void;
  label?: string;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  label,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  labelStyle,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.springBouncy);
  };

  const isPrimary = variant === 'primary';
  const variantStyle = styles[variant];
  const sizeStyle = sizeStyles[size];

  const content = loading ? (
    <ActivityIndicator color={variant === 'ghost' ? Colors.primary : Colors.white} size="small" />
  ) : children ? (
    children
  ) : (
    <Text style={[labelStyles[variant], sizeLabels[size], labelStyle]}>
      {label}
    </Text>
  );

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        !isPrimary && variantStyle,
        !isPrimary && sizeStyle,
        isPrimary && styles.primaryBase,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#C084FC', '#8B5CF6']} // Amethyst Orchid to Violet gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            sizeStyle,
            { borderRadius: sizeStyle.borderRadius ?? Radius.md },
          ]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
  },
  primaryBase: {
    backgroundColor: 'transparent',
    ...Shadow.primary,
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
});

const sizeStyles: Record<string, ViewStyle & { borderRadius?: number }> = {
  sm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.sm },
  md: { paddingHorizontal: 24, paddingVertical: 14 },
  lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: Radius.lg },
};

const labelStyles: Record<string, TextStyle> = {
  primary:   { color: Colors.white, fontWeight: '700' },
  secondary: { color: Colors.textPrimary },
  ghost:     { color: Colors.primary },
  danger:    { color: Colors.white },
};

const sizeLabels: Record<string, TextStyle> = {
  sm: { ...Typography.label },
  md: { ...Typography.bodyLarge, fontWeight: '600' },
  lg: { ...Typography.h3 },
};
