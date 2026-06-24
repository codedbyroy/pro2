// app/(auth)/pin.tsx
// PIN screen — handles both SET mode (new users) and VERIFY mode (returning)
// Animated PIN dots with shake-on-wrong-pin effect
// See BUILDPLAN.md for full context

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { setPin, verifyPin } from '../../services/pin';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

const PIN_LENGTH = 4;

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function PinScreen() {
  const { hasPin, setPinVerified, setHasPin } = useAuthStore();
  const isSetMode = !hasPin;

  const [pin, setCurrentPin]   = useState('');
  const [step, setStep]        = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Shake animation for wrong PIN
  const shakeX = useSharedValue(0);
  const dotScale = useSharedValue(1);

  const shake = useCallback(() => {
    Vibration.vibrate([0, 50, 50, 50]);
    shakeX.value = withSequence(
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleKey = async (key: string) => {
    if (key === '') return;
    if (key === '⌫') {
      setCurrentPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + key;
    setCurrentPin(newPin);

    if (newPin.length < PIN_LENGTH) return;

    // PIN complete — process after short delay (so last dot fills)
    setTimeout(async () => {
      if (isSetMode) {
        if (step === 'enter') {
          // First entry — ask to confirm
          setFirstPin(newPin);
          setCurrentPin('');
          setStep('confirm');
        } else {
          // Confirm step
          if (newPin === firstPin) {
            await setPin(newPin);
            setHasPin(true);
            setPinVerified(true);
            router.replace('/(tabs)/home');
          } else {
            shake();
            setCurrentPin('');
            setStep('enter');
            setFirstPin('');
          }
        }
      } else {
        // Verify mode
        const correct = await verifyPin(newPin);
        if (correct) {
          setPinVerified(true);
          router.replace('/(tabs)/home');
        } else {
          shake();
          setCurrentPin('');
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= 5) {
            Alert.alert(
              'Too many attempts',
              'Please sign in with your password to reset your PIN.',
              [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
            );
          }
        }
      }
    }, 100);
  };

  const getTitle = () => {
    if (isSetMode) {
      return step === 'enter' ? 'Set your PIN' : 'Confirm your PIN';
    }
    return 'Enter your PIN';
  };

  const getSubtitle = () => {
    if (isSetMode) {
      return step === 'enter'
        ? 'Choose a 4-digit PIN to secure your app'
        : 'Enter the same PIN again';
    }
    return `${attempts > 0 ? `${attempts} failed attempt${attempts > 1 ? 's' : ''}` : 'Keep your finances private'}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Purple glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={[styles.subtitle, attempts > 0 && { color: Colors.danger }]}>
          {getSubtitle()}
        </Text>
      </View>

      {/* PIN Dots */}
      <Animated.View style={[styles.dots, shakeStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
            ]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[styles.key, key === '' && styles.keyInvisible]}
                onPress={() => handleKey(key)}
                disabled={key === ''}
                activeOpacity={0.7}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={24} color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Forgot PIN (verify mode only) */}
      {!isSetMode && (
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.forgotText}>Forgot PIN? Sign in again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
  },
  glow: {
    position: 'absolute',
    top: 80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    opacity: 0.06,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  keypad: { gap: Spacing.md, width: '80%' },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyInvisible: { opacity: 0, pointerEvents: 'none' },
  keyText: { ...Typography.h2, color: Colors.textPrimary },
  forgotBtn: { padding: Spacing.md },
  forgotText: { ...Typography.label, color: Colors.primary },
});
