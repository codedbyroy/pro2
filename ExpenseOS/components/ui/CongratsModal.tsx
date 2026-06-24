// components/ui/CongratsModal.tsx
// Animated Congratulations / Milestone Modal Popup
// Provides custom spring animations and a setting toggle to turn off future celebrations.

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius, Shadow, Animation } from '../../constants/theme';
import { AnimatedButton } from './AnimatedButton';
import { useSettingsStore } from '../../store/settingsStore';

interface CongratsModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const CongratsModal: React.FC<CongratsModalProps> = ({
  visible,
  onClose,
  title = 'Goal Achieved! 🎉',
  message = 'Congratulations! Your financial discipline is paying off. Keep up the amazing work!',
}) => {
  const { showCelebrations, setShowCelebrations } = useSettingsStore();
  const [localKeep, setLocalKeep] = useState(true);

  // Animation values
  const cardScale = useSharedValue(0.3);
  const cardOpacity = useSharedValue(0);
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(0);
  const checkScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setLocalKeep(showCelebrations);
      
      // Trigger card entrance
      cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      cardOpacity.value = withSpring(1, { duration: 300 });

      // Trigger bouncy trophy drop
      trophyScale.value = withDelay(
        200,
        withSpring(1, { damping: 8, stiffness: 90 })
      );
      
      // Play brief rotate animation
      trophyRotate.value = withDelay(
        400,
        withSequence(
          withSpring(-15, { damping: 5, stiffness: 120 }),
          withSpring(15, { damping: 5, stiffness: 120 }),
          withSpring(0, { damping: 8, stiffness: 100 })
        )
      );
    } else {
      cardScale.value = 0.3;
      cardOpacity.value = 0;
      trophyScale.value = 0;
      trophyRotate.value = 0;
    }
  }, [visible]);

  const toggleKeep = () => {
    const nextVal = !localKeep;
    setLocalKeep(nextVal);
    // Animate checkbox pop
    checkScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1.0, { damping: 8, stiffness: 200 })
    );
  };

  const handleDismiss = async () => {
    // Save preference to store
    await setShowCelebrations(localKeep);
    onClose();
  };

  // Animated styles
  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const trophyAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` }
    ],
  }));

  const checkboxAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap dismiss */}
        <Pressable style={styles.backdrop} onPress={handleDismiss} />

        {/* Modal content card */}
        <Animated.View style={[styles.card, cardAnimStyle]}>
          <View style={styles.glow} />
          
          {/* Animated Trophy Icon */}
          <Animated.View style={[styles.iconContainer, trophyAnimStyle]}>
            <View style={styles.iconRingInner}>
              <Ionicons name="trophy" size={48} color={Colors.primary} />
            </View>
          </Animated.View>

          {/* Texts */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Toggle option for next time */}
          <Pressable style={styles.toggleRow} onPress={toggleKeep}>
            <Animated.View
              style={[
                styles.checkbox,
                localKeep && styles.checkboxActive,
                checkboxAnimStyle
              ]}
            >
              {localKeep && (
                <Ionicons name="checkmark" size={14} color={Colors.background} />
              )}
            </Animated.View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Show celebrations for next goals</Text>
              <Text style={styles.toggleSub}>Turn off if you prefer a faster, cleaner flow</Text>
            </View>
          </Pressable>

          {/* Confirm Button */}
          <AnimatedButton
            label="Awesome! 🚀"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleDismiss}
            style={styles.actionBtn}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    padding: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.lg,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    pointerEvents: 'none',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(244, 3, 142, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 3, 142, 0.2)',
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    marginTop: Spacing.xs,
  },
});
