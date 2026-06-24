// app/(modals)/savings-goal.tsx
// Savings Goals Configuration Modal Screen
// Features: List active savings goals with animated progress bars, add savings to existing goals, create new goals with icon and deadline selectors, and delete goals.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { useAuthStore } from '../../store/authStore';
import { useGoalStore } from '../../store/goalStore';
import { useSettingsStore } from '../../store/settingsStore';
import { CongratsModal } from '../../components/ui/CongratsModal';
import { formatINR } from '../../utils/currency';

const GOAL_ICONS = [
  'trophy', 'shield-checkmark', 'home', 'car', 'airplane', 
  'gift', 'cash', 'wallet', 'star', 'flame', 'heart', 'ribbon'
];

export default function SavingsGoalScreen() {
  const { user } = useAuthStore();
  const { goals, addGoal, updateGoal, removeGoal } = useGoalStore();
  const { showCelebrations } = useSettingsStore();

  const [isAdding, setIsAdding] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [target, setTarget]       = useState('');
  const [current, setCurrent]     = useState('');
  const [deadline, setDeadline]   = useState('');
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [loading, setLoading]     = useState(false);

  // States for congrats popup
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [congratsData, setCongratsData] = useState({ title: '', message: '' });

  // States for adding progress to an existing goal
  const [activeProgressGoalId, setActiveProgressGoalId] = useState<string | null>(null);
  const [progressAmount, setProgressAmount]             = useState('');

  const handleCreateGoal = async () => {
    if (!user) return;
    if (!goalName.trim()) {
      Alert.alert('Required', 'Please enter a goal name.');
      return;
    }

    const targetVal = parseFloat(target);
    const currentVal = parseFloat(current) || 0;
    if (isNaN(targetVal) || targetVal <= 0) {
      Alert.alert('Invalid target', 'Please enter a valid target amount.');
      return;
    }

    setLoading(true);
    try {
      await addGoal(user.uid, {
        name: goalName.trim(),
        target: targetVal,
        current: currentVal,
        deadline: deadline.trim() || undefined,
        icon: selectedIcon,
      });

      setGoalName('');
      setTarget('');
      setCurrent('');
      setDeadline('');
      setIsAdding(false);
      Alert.alert('Success 🎉', 'New savings goal created!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgress = async (goalId: string) => {
    if (!user) return;
    const amountVal = parseFloat(progressAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount to save.');
      return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setLoading(true);
    try {
      const newCurrent = goal.current + amountVal;
      const isNewlyReached = newCurrent >= goal.target && goal.current < goal.target;
      await updateGoal(user.uid, goalId, { current: newCurrent });
      setActiveProgressGoalId(null);
      setProgressAmount('');
      
      if (isNewlyReached && showCelebrations) {
        setCongratsData({
          title: 'Goal Achieved! 🏆',
          message: `Incredible! You have saved the full ${formatINR(goal.target)} and reached your savings goal: "${goal.name}"!`,
        });
        setCongratsVisible(true);
      } else {
        Alert.alert('Goal Updated 🎉', `Saved another ${formatINR(amountVal)} towards "${goal.name}"!`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update progress.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId: string, name: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete the goal "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoal(user.uid, goalId);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete goal.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Existing Savings Goals List */}
        {!isAdding && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Goals</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>New Goal</Text>
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No goals set yet</Text>
                <Text style={styles.emptyText}>Create a savings goal (e.g. Vacation, Car, Laptop) to track your progress.</Text>
              </Card>
            ) : (
              <View style={styles.list}>
                {goals.map(goal => {
                  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                  const isCompleted = goal.current >= goal.target;
                  const isAddingProgress = activeProgressGoalId === goal.id;

                  return (
                    <Animated.View key={goal.id} layout={Layout.springify()}>
                      <Card style={StyleSheet.flatten([styles.goalCard, isCompleted && styles.completedCard])}>
                        <View style={styles.goalHeader}>
                          <View style={styles.goalTitleRow}>
                            <View style={[styles.goalIconBg, { backgroundColor: isCompleted ? Colors.income + '15' : Colors.primary + '15' }]}>
                              <Ionicons
                                name={goal.icon as any}
                                size={20}
                                color={isCompleted ? Colors.income : Colors.primary}
                              />
                            </View>
                            <View>
                              <Text style={styles.goalName}>{goal.name}</Text>
                              {goal.deadline && (
                                <Text style={styles.goalDeadline}>Target: {goal.deadline}</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteGoal(goal.id, goal.name)}>
                            <Ionicons name="trash-outline" size={18} color={Colors.expense} />
                          </TouchableOpacity>
                        </View>

                        {/* Progress display */}
                        <View style={styles.progressTextRow}>
                          <Text style={styles.progressSaved}>{formatINR(goal.current)} saved</Text>
                          <Text style={styles.progressTarget}>of {formatINR(goal.target)} ({pct}%)</Text>
                        </View>

                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: isCompleted ? Colors.income : Colors.primary,
                              },
                            ]}
                          />
                        </View>

                        {/* Quick Add Progress Input */}
                        {isAddingProgress ? (
                          <Animated.View entering={FadeInDown.duration(200)} style={styles.progressForm}>
                            <TextInput
                              style={styles.progressInput}
                              placeholder="Amount to save (₹)"
                              placeholderTextColor={Colors.textMuted}
                              value={progressAmount}
                              onChangeText={text => setProgressAmount(text.replace(/[^0-9.]/g, ''))}
                              keyboardType="decimal-pad"
                            />
                            <TouchableOpacity
                              style={[styles.progressSaveBtn, { backgroundColor: Colors.primary }]}
                              onPress={() => handleAddProgress(goal.id)}
                              disabled={loading}
                            >
                              <Text style={styles.progressSaveText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.progressCancelBtn}
                              onPress={() => {
                                setActiveProgressGoalId(null);
                                setProgressAmount('');
                              }}
                            >
                              <Ionicons name="close" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                          </Animated.View>
                        ) : (
                          !isCompleted && (
                            <TouchableOpacity
                              style={styles.addProgressBtn}
                              onPress={() => {
                                setActiveProgressGoalId(goal.id);
                                setProgressAmount('');
                              }}
                            >
                              <Ionicons name="add" size={16} color={Colors.primary} />
                              <Text style={styles.addProgressText}>Add Progress / Save Money</Text>
                            </TouchableOpacity>
                          )
                        )}

                        {isCompleted && (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.income} />
                            <Text style={styles.completedBadgeText}>Goal Reached! 🎉</Text>
                          </View>
                        )}
                      </Card>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* Create New Goal Form */}
        {isAdding && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>New Savings Goal</Text>

              {/* Goal Name */}
              <Text style={styles.fieldLabel}>Goal Title</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Travel, Emergency, Buy Phone"
                placeholderTextColor={Colors.textMuted}
                value={goalName}
                onChangeText={setGoalName}
                maxLength={30}
              />

              {/* Targets */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Target Amount</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="₹ Target"
                    placeholderTextColor={Colors.textMuted}
                    value={target}
                    onChangeText={text => setTarget(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Already Saved</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="₹ Saved (optional)"
                    placeholderTextColor={Colors.textMuted}
                    value={current}
                    onChangeText={text => setCurrent(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Deadline */}
              <Text style={styles.fieldLabel}>Target Date / Deadline (optional)</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Dec 2026, In 6 Months"
                placeholderTextColor={Colors.textMuted}
                value={deadline}
                onChangeText={setDeadline}
                maxLength={30}
              />

              {/* Icon Selector */}
              <Text style={styles.fieldLabel}>Select Goal Icon</Text>
              <View style={styles.iconPalette}>
                {GOAL_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconDot,
                      selectedIcon === icon && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={selectedIcon === icon ? Colors.background : Colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setIsAdding(false)}>
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedButton
                  label="Create Goal"
                  variant="primary"
                  size="md"
                  onPress={handleCreateGoal}
                  style={styles.createBtn}
                  loading={loading}
                />
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
      <CongratsModal
        visible={congratsVisible}
        onClose={() => setCongratsVisible(false)}
        title={congratsData.title}
        message={congratsData.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  closeBtn: { padding: Spacing.xs },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textSecondary, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.md, marginTop: 40 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  list: { gap: Spacing.md },
  goalCard: { padding: Spacing.md, gap: Spacing.sm },
  completedCard: { borderColor: Colors.income + '40' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  goalIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700' },
  goalDeadline: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  progressSaved: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: '600' },
  progressTarget: { ...Typography.bodySmall, color: Colors.textSecondary },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: Radius.full },
  addProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '60',
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  addProgressText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  progressForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  progressInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.sm,
    height: 36,
    color: Colors.textPrimary,
    ...Typography.bodySmall,
  },
  progressSaveBtn: {
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSaveText: { ...Typography.bodySmall, color: Colors.background, fontWeight: '700' },
  progressCancelBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: Colors.income + '10',
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  completedBadgeText: { ...Typography.bodySmall, color: Colors.income, fontWeight: '700' },
  formCard: { padding: Spacing.md, gap: Spacing.md },
  formTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  nameInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.textPrimary,
    ...Typography.bodyLarge,
  },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },
  iconPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface
  },
  formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  cancelFormBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  cancelFormText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1.5 },
});
