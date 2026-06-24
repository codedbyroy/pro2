// app/(tabs)/settings.tsx
// Settings Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { signOut } from '../../services/firebase/auth';
import { clearPin } from '../../services/pin';
import { router } from 'expo-router';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, signOut: clearAuth, setHasPin, setPinVerified } = useAuthStore();
  const { showCelebrations, setShowCelebrations } = useSettingsStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearPin();
          await signOut();
          clearAuth();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleChangePin = () => {
    Alert.alert('Change PIN', 'Are you sure you want to change your PIN? This will replace your current PIN.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        style: 'destructive',
        onPress: async () => {
          await clearPin();
          setHasPin(false);
          setPinVerified(false);
          router.push('/(auth)/pin');
        },
      },
    ]);
  };

  const toggleCelebrations = async () => {
    await setShowCelebrations(!showCelebrations);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.displayName ?? 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </Card>

      {/* Settings sections */}
      <Card style={styles.section}>
        <SettingRow icon="grid-outline"         label="Manage Categories" onPress={() => router.push('/(modals)/category-manager')} />
        <SettingRow icon="calculator-outline"   label="Budget Limits" onPress={() => router.push('/(modals)/budget-limit')} />
        <SettingRow icon="trophy-outline"       label="Savings Goals" onPress={() => router.push('/(modals)/savings-goal')} />
        <SettingRow icon="lock-closed-outline" label="Change PIN" onPress={handleChangePin} />
        <SettingRow icon="person-outline"      label="Edit Profile" onPress={() => {}} />
      </Card>

      <Card style={styles.section}>
        <SettingRow icon="download-outline"    label="Export Data (CSV)" onPress={() => {}} />
        <SettingRow icon="sparkles-outline"    label="Celebration Popups" value={showCelebrations ? "On" : "Off"} onPress={toggleCelebrations} />
        <SettingRow icon="cloud-outline"       label="Backup & Sync" value="On" onPress={() => {}} />
        <SettingRow icon="shield-outline"      label="Privacy Policy" onPress={() => {}} />
      </Card>

      <Card style={styles.section}>
        <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
      </Card>

      <Text style={styles.version}>ExpenseOS v1.0.0 · Made with ❤️</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  title: { ...Typography.h2, color: Colors.textPrimary, paddingVertical: Spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.h2, color: Colors.primary },
  profileName: { ...Typography.h3, color: Colors.textPrimary },
  profileEmail: { ...Typography.bodySmall, color: Colors.textSecondary },
  section: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: Colors.expenseLight },
  rowLabel: { ...Typography.bodyLarge, color: Colors.textPrimary, flex: 1 },
  rowLabelDanger: { color: Colors.danger },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowValue: { ...Typography.bodySmall, color: Colors.textSecondary },
  version: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
