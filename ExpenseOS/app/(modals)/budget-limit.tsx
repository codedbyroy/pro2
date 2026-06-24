// app/(modals)/budget-limit.tsx
// Budget Limit Configuration Modal Screen
// Features: Select expense categories, set/update spending limits in INR (weekly/monthly), and delete limits.

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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { useAuthStore } from '../../store/authStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useCategoryStore } from '../../store/categoryStore';
import { formatINR } from '../../utils/currency';

export default function BudgetLimitScreen() {
  const { user } = useAuthStore();
  const { budgets, setBudgetLimit, removeBudgetLimit } = useBudgetStore();
  const { getCategoriesByType } = useCategoryStore();

  const expenseCategories = useMemo(() => getCategoriesByType('expense'), [getCategoriesByType]);

  const [selectedCatId, setSelectedCatId] = useState(expenseCategories[0]?.id ?? '');
  const [limit, setLimit]                 = useState('');
  const [period, setPeriod]               = useState<'monthly' | 'weekly'>('monthly');
  const [loading, setLoading]             = useState(false);

  // Load existing budget details if category changes
  const activeBudget = useMemo(() => {
    return budgets[selectedCatId];
  }, [selectedCatId, budgets]);

  // Sync state with selected category's budget
  React.useEffect(() => {
    if (activeBudget) {
      setLimit(activeBudget.limit.toString());
      setPeriod(activeBudget.period);
    } else {
      setLimit('');
      setPeriod('monthly');
    }
  }, [selectedCatId, activeBudget]);

  const handleSave = async () => {
    if (!user) return;
    if (!selectedCatId) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    const limitVal = parseFloat(limit);
    if (isNaN(limitVal) || limitVal <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid budget limit.');
      return;
    }

    setLoading(true);
    try {
      await setBudgetLimit(user.uid, selectedCatId, limitVal, period);
      Alert.alert('Success 🎉', 'Budget limit configured successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !activeBudget) return;

    Alert.alert(
      'Remove Budget',
      'Are you sure you want to remove the budget limit for this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await removeBudgetLimit(user.uid, selectedCatId);
              setLimit('');
              Alert.alert('Removed', 'Budget limit removed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete budget.');
            } finally {
              setLoading(false);
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
        <Text style={styles.headerTitle}>Budget Limits</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Set budget limits on categories to monitor spending.</Text>

        {/* 1. Category Selector */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.fieldLabel}>1. Select Expense Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {expenseCategories.map(cat => {
              const isSelected = selectedCatId === cat.id;
              const hasActiveBudget = !!budgets[cat.id];
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && { borderColor: cat.color, backgroundColor: cat.color + '15' }
                  ]}
                  onPress={() => setSelectedCatId(cat.id)}
                >
                  <Ionicons name={cat.icon as any} size={16} color={isSelected ? cat.color : Colors.textMuted} />
                  <Text style={[styles.categoryText, isSelected && { color: cat.color, fontWeight: '700' }]}>
                    {cat.name}
                  </Text>
                  {hasActiveBudget && (
                    <View style={[styles.budgetDot, { backgroundColor: cat.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 2. Budget Details Form */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.formContainer}>
          <Text style={styles.fieldLabel}>2. Set Limit Details</Text>

          {/* Amount Card */}
          <Card style={styles.amountCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={limit}
              onChangeText={text => {
                const cleaned = text.replace(/[^0-9.]/g, '');
                setLimit(cleaned);
              }}
              keyboardType="decimal-pad"
              maxLength={8}
            />
          </Card>

          {/* Period Selector */}
          <View style={styles.periodRow}>
            {(['monthly', 'weekly'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodBtn,
                  period === p && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary }
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && { color: Colors.primary, fontWeight: '700' }]}>
                  {p === 'monthly' ? 'MONTHLY BUDGET' : 'WEEKLY BUDGET'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actions}>
          {activeBudget && (
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} disabled={loading}>
              <Ionicons name="trash-outline" size={20} color={Colors.expense} />
              <Text style={styles.removeText}>Remove Limit</Text>
            </TouchableOpacity>
          )}

          <AnimatedButton
            label={activeBudget ? 'Update Budget Limit' : 'Enable Budget Limit'}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSave}
          />
        </Animated.View>

        {/* Status display */}
        {activeBudget && (
          <Animated.View entering={FadeIn.delay(300).duration(300)}>
            <Card style={styles.statusCard}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.statusText}>
                Active budget limit for this category is set to{' '}
                <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
                  {formatINR(activeBudget.limit)}
                </Text>{' '}
                ({activeBudget.period}). You will receive alerts when spending exceeds this amount.
              </Text>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
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
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  categoryRow: { flexDirection: 'row', gap: Spacing.xs, paddingBottom: Spacing.md },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    gap: 6,
    position: 'relative',
  },
  categoryText: { ...Typography.bodySmall, color: Colors.textMuted },
  budgetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  formContainer: { marginTop: Spacing.md, gap: Spacing.md },
  amountCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  currencySymbol: { ...Typography.h1, color: Colors.textSecondary, marginRight: Spacing.sm },
  amountInput: { flex: 1, ...Typography.display, fontSize: 44, color: Colors.textPrimary, paddingVertical: 4 },
  periodRow: { flexDirection: 'row', gap: Spacing.sm },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  periodText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  actions: { marginTop: Spacing.xl, gap: Spacing.md },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.expense + '40',
  },
  removeText: { ...Typography.body, color: Colors.expense, fontWeight: '600' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
  },
  statusText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
