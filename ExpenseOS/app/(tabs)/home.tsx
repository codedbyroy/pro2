// app/(tabs)/home.tsx
// Dashboard / Home Screen — Production Ready
// Handles balance counter, period-based summaries, savings rate, and recent transactions with smooth transitions.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { DEFAULT_CATEGORIES } from '../../constants/defaultCategories';
import { formatINR } from '../../utils/currency';
import { formatDateShort, getPeriodStart } from '../../utils/date';
import {
  calculateBalance,
  calculateTotalByType,
  calculateSavingsRate,
} from '../../utils/calculations';

type Period = 'daily' | 'weekly' | 'monthly';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated Period Selector Button
interface PeriodBtnProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function PeriodBtn({ label, isActive, onPress }: PeriodBtnProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.periodBtn,
        isActive && styles.periodBtnActive,
        animatedStyle,
      ]}
    >
      <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// Animated Transaction Row Component for Home
interface AnimatedTxRowHomeProps {
  tx: Transaction;
  cat: any;
  isLast?: boolean;
}

function AnimatedTxRowHome({ tx, cat, isLast }: AnimatedTxRowHomeProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.txRow,
        animatedStyle,
        !isLast && styles.txRowBorder
      ]}
    >
      <View style={[styles.txIconContainer, { backgroundColor: cat.color + '12' }]}>
        <Ionicons name={cat.icon as any} size={20} color={cat.color} />
      </View>
      <View style={styles.txDetails}>
        <Text style={styles.txCategoryName}>{cat.name}</Text>
        {tx.note ? (
          <Text style={styles.txNote} numberOfLines={1}>
            {tx.note}
          </Text>
        ) : (
          <Text style={styles.txDate}>{formatDateShort(tx.date)}</Text>
        )}
      </View>
      <View style={styles.txAmountContainer}>
        <Text
          style={[
            styles.txAmount,
            {
              color:
                tx.type === 'income'
                  ? Colors.income
                  : tx.type === 'expense'
                  ? Colors.expense
                  : Colors.saving,
            },
          ]}
        >
          {tx.type === 'expense' ? '-' : '+'}
          {formatINR(tx.amount)}
        </Text>
        {tx.note && <Text style={styles.txDateBelow}>{formatDateShort(tx.date)}</Text>}
      </View>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { transactions, isLoading } = useTransactionStore();
  const [period, setPeriod] = useState<Period>('monthly');

  // Lifetime overall balance (all-time net worth)
  const lifetimeBalance = useMemo(() => calculateBalance(transactions), [transactions]);

  // Filter transactions for the selected period
  const periodTransactions = useMemo(() => {
    const start = getPeriodStart(period);
    return transactions.filter((tx) => new Date(tx.date) >= start);
  }, [transactions, period]);

  // Calculate totals for the selected period
  const periodIncome = useMemo(() => calculateTotalByType(periodTransactions, 'income'), [periodTransactions]);
  const periodExpense = useMemo(() => calculateTotalByType(periodTransactions, 'expense'), [periodTransactions]);
  const periodSaving = useMemo(() => calculateTotalByType(periodTransactions, 'saving'), [periodTransactions]);

  // Calculate savings rate for the period
  const savingsRate = useMemo(() => calculateSavingsRate(periodTransactions), [periodTransactions]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Helper to fetch category details (name, icon, color)
  const getCategoryDetails = (catId: string, type: string) => {
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === catId);
    if (cat) return cat;

    // Fallback for default categories if matched by type
    if (catId === 'income') return { name: 'Income', icon: 'cash-outline', color: Colors.income };
    if (catId === 'expense') return { name: 'Expense', icon: 'card-outline', color: Colors.expense };
    if (catId === 'saving') return { name: 'Saving', icon: 'wallet-outline', color: Colors.saving };

    return {
      name: catId.charAt(0).toUpperCase() + catId.slice(1),
      icon: type === 'income' ? 'arrow-down-circle' : type === 'expense' ? 'arrow-up-circle' : 'wallet',
      color: type === 'income' ? Colors.income : type === 'expense' ? Colors.expense : Colors.saving,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{user?.displayName ?? 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="person-circle-outline" size={32} color={Colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card variant="elevated" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Lifetime Net Balance</Text>
            <Text style={styles.balanceAmount}>{formatINR(lifetimeBalance)}</Text>
            
            <View style={styles.periodSelector}>
              {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                <PeriodBtn
                  key={p}
                  label={p === 'daily' ? 'Today' : p === 'weekly' ? 'Week' : 'Month'}
                  isActive={period === p}
                  onPress={() => setPeriod(p)}
                />
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Stats Row - Unified Column Component */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Card variant="glass" style={styles.statsUnifiedCard}>
            <View style={styles.statCol}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.income + '10' }]}>
                <Ionicons name="arrow-down" size={15} color={Colors.income} />
              </View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statAmount, { color: Colors.income }]}>
                {formatINR(periodIncome)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.expense + '10' }]}>
                <Ionicons name="arrow-up" size={15} color={Colors.expense} />
              </View>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={[styles.statAmount, { color: Colors.expense }]}>
                {formatINR(periodExpense)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.saving + '10' }]}>
                <Ionicons name="wallet" size={15} color={Colors.saving} />
              </View>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statAmount, { color: Colors.saving }]}>
                {formatINR(periodSaving)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Savings Rate Card */}
        {periodIncome > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <Card style={styles.savingsRateCard}>
              <View style={styles.savingsRateHeader}>
                <Text style={styles.savingsRateTitle}>Savings Rate</Text>
                <Text style={styles.savingsRateVal}>{savingsRate}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={savingsRate >= 30 ? ['#10B981', '#34D399'] : ['#F59E0B', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(savingsRate, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.savingsRateNote}>
                {savingsRate >= 30
                  ? 'Healthy savings rate! Keep it up. 🚀'
                  : 'Try to save 30% or more of your income.'}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Recent Transactions Header */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Transactions List - Unified glass card container */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.listContainer}>
          {isLoading ? (
            <Text style={styles.infoText}>Syncing transactions...</Text>
          ) : recentTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No activity recorded yet.</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={() => router.push('/add')}>
                <Text style={styles.addFirstText}>Add first transaction</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card variant="default" style={styles.recentActivityCard}>
              {recentTransactions.map((tx, idx) => {
                const cat = getCategoryDetails(tx.category, tx.type);
                return (
                  <Animated.View key={tx.id} layout={Layout.springify()}>
                    <AnimatedTxRowHome 
                      tx={tx} 
                      cat={cat} 
                      isLast={idx === recentTransactions.length - 1} 
                    />
                  </Animated.View>
                );
              })}
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: { ...Typography.h2, color: Colors.textPrimary },
  profileBtn: { padding: Spacing.xs },
  balanceCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  balanceLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  balanceAmount: { ...Typography.display, color: Colors.textPrimary, marginBottom: Spacing.lg },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  periodBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  periodBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  periodText: { ...Typography.bodySmall, color: Colors.textMuted, fontWeight: '500' },
  periodTextActive: { color: Colors.textPrimary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statsUnifiedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  statAmount: { ...Typography.bodyLarge, fontWeight: '700' },
  savingsRateCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  savingsRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  savingsRateTitle: { ...Typography.label, color: Colors.textSecondary },
  savingsRateVal: { ...Typography.h3, color: Colors.textPrimary },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: { height: '100%', borderRadius: Radius.full },
  savingsRateNote: { ...Typography.caption, color: Colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  seeAllLink: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  listContainer: { gap: Spacing.xs },
  recentActivityCard: {
    padding: 0,
    paddingHorizontal: Spacing.sm,
  },
  infoText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginVertical: Spacing.lg },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  addFirstBtn: { marginTop: Spacing.xs },
  addFirstText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  txDetails: { flex: 1, justifyContent: 'center' },
  txCategoryName: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  txNote: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  txDate: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  txAmountContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { ...Typography.bodyLarge, fontWeight: '700' },
  txDateBelow: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});
