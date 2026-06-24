// app/(auth)/welcome.tsx
// Onboarding / welcome screen — first screen new users see
// See BUILDPLAN.md for full context

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { Colors, Spacing, Typography } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animation values
  const logoScale   = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleTY     = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const subTY       = useSharedValue(20);
  const subOpacity  = useSharedValue(0);
  const btnOpacity  = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    logoScale.value   = withDelay(100, withSpring(1, { damping: 10, stiffness: 120 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    titleTY.value     = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subTY.value       = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    subOpacity.value  = withDelay(600, withTiming(1, { duration: 500 }));
    btnOpacity.value  = withDelay(900, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle  = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }], opacity: logoOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: titleTY.value }], opacity: titleOpacity.value }));
  const subStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: subTY.value }], opacity: subOpacity.value }));
  const btnStyle   = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Background glow */}
      <View style={styles.glow} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>₹</Text>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.textContainer, titleStyle]}>
        <Text style={styles.title}>ExpenseOS</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={[styles.subContainer, subStyle]}>
        <Text style={styles.subtitle}>
          Your money.{'\n'}Beautifully tracked.
        </Text>
        <View style={styles.features}>
          {['💰 Income & Expense Tracking', '📊 Daily / Weekly / Monthly Charts', '🔐 PIN Protected & Cloud Synced'].map((f, i) => (
            <Text key={i} style={styles.feature}>{f}</Text>
          ))}
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonContainer, btnStyle]}>
        <AnimatedButton
          label="Get Started"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/register')}
        />
        <AnimatedButton
          label="I already have an account"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: Spacing.sm }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  glow: {
    position: 'absolute',
    top: height * 0.1,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    // blur effect via large shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
    color: Colors.primary,
    fontWeight: '700',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.display,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  subtitle: {
    ...Typography.h2,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  features: {
    gap: Spacing.sm,
    width: '100%',
  },
  feature: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
});
