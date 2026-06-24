// app/(tabs)/add.tsx
// Add Transaction Screen — Production Ready
// Features: type tabs (Income/Expense/Saving), responsive numeric input, dynamic category grid with icons, note field, and recurring toggles.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { CategoryType, DEFAULT_CATEGORIES } from '../../constants/defaultCategories';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useCategoryStore } from '../../store/categoryStore';
import { useBudgetStore } from '../../store/budgetStore';
import { addTransaction } from '../../services/firebase/transactions';
import { getPeriodStart } from '../../utils/date';
import { formatINR } from '../../utils/currency';

type Tab = CategoryType;

const TABS: { key: Tab; label: string; color: string; icon: string }[] = [
  { key: 'income',  label: 'Income',  color: Colors.income,  icon: 'arrow-down-circle' },
  { key: 'expense', label: 'Expense', color: Colors.expense, icon: 'arrow-up-circle' },
  { key: 'saving',  label: 'Saving',  color: Colors.saving,  icon: 'wallet' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated Tab Button
interface TabItemProps {
  tab: typeof TABS[0];
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.tab,
        isActive && {
          backgroundColor: tab.color + '15',
          borderColor: tab.color,
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name={tab.icon as any}
        size={18}
        color={isActive ? tab.color : Colors.textMuted}
      />
      <Text
        style={[
          styles.tabText,
          { color: isActive ? tab.color : Colors.textMuted },
        ]}
      >
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

// Animated Category Item
interface CategoryGridItemProps {
  cat: any;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryGridItem({ cat, isSelected, onPress }: CategoryGridItemProps) {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  React.useEffect(() => {
    iconScale.value = withSpring(isSelected ? 1.15 : 1, { damping: 10, stiffness: 150 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.categoryItem,
        isSelected && { borderColor: cat.color, backgroundColor: cat.color + '12' },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.categoryIconBg,
          { backgroundColor: isSelected ? cat.color : Colors.surfaceElevated },
          animatedIconStyle,
        ]}
      >
        <Ionicons
          name={cat.icon as any}
          size={20}
          color={isSelected ? Colors.background : cat.color}
        />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.categoryName,
          isSelected ? { color: Colors.textPrimary, fontWeight: '700' } : { color: Colors.textSecondary },
        ]}
      >
        {cat.name}
      </Text>
    </AnimatedPressable>
  );
}

export default function AddScreen() {
  const { user } = useAuthStore();
  const { transactions } = useTransactionStore();
  const { getCategoriesByType } = useCategoryStore();
  const { budgets } = useBudgetStore();

  const [activeTab, setActiveTab] = useState<Tab>('expense');
  const [amount, setAmount]       = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [note, setNote]           = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading]     = useState(false);

  const toggleAnim = useSharedValue(isRecurring ? 1 : 0);

  React.useEffect(() => {
    toggleAnim.value = withSpring(isRecurring ? 1 : 0, { damping: 15, stiffness: 180 });
  }, [isRecurring]);

  const switchStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      toggleAnim.value,
      [0, 1],
      [Colors.surfaceBorder, Colors.primary]
    );
    return { backgroundColor };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(toggleAnim.value, [0, 1], [0, 22]);
    const width = interpolate(
      toggleAnim.value,
      [0, 0.5, 1],
      [20, 24, 20]
    );
    return {
      transform: [{ translateX }],
      width,
    };
  });

  // Active color matching type
  const activeColor = useMemo(() => TABS.find((t) => t.key === activeTab)?.color ?? Colors.primary, [activeTab]);

  // Categories matching active tab type
  const categories = useMemo(() => {
    const cats = getCategoriesByType(activeTab);
    // Auto-select first category if none or invalid selected
    if (cats.length > 0 && (!selectedCatId || !cats.some((c) => c.id === selectedCatId))) {
      setSelectedCatId(cats[0].id);
    }
    return cats;
  }, [activeTab, getCategoriesByType]);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!selectedCatId) {
      Alert.alert('Category required', 'Please select a category.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication required', 'Please log in to add transactions.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const tx = {
        type: activeTab,
        amount: parseFloat(amount),
        category: selectedCatId,
        note: note.trim() || undefined,
        date: now,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      };

      const txAmount = parseFloat(amount);
      const budget = budgets[selectedCatId];
      let alertMsg: string | null = null;

      if (activeTab === 'expense' && budget) {
        const start = getPeriodStart(budget.period === 'weekly' ? 'weekly' : 'monthly');
        const periodSpend = transactions
          .filter((t) => t.category === selectedCatId && new Date(t.date) >= start)
          .reduce((acc, t) => acc + t.amount, 0);

        const newTotal = periodSpend + txAmount;
        if (newTotal > budget.limit) {
          alertMsg = `Budget exceeded! You have spent ${formatINR(newTotal)} out of your ${formatINR(budget.limit)} limit for this category.`;
        } else if (newTotal >= budget.limit * 0.8) {
          alertMsg = `Warning: You have reached ${Math.round((newTotal / budget.limit) * 100)}% of your budget limit for this category.`;
        }
      }

      await addTransaction(user.uid, tx);

      // Clear input fields on success
      setAmount('');
      setNote('');
      setIsRecurring(false);
      
      // Navigate to dashboard
      const successTitle = alertMsg ? 'Budget Alert ⚠️' : 'Success 🎉';
      const successBody = alertMsg 
        ? `Transaction recorded.\n\n${alertMsg}`
        : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} added successfully!`;

      Alert.alert(successTitle, successBody, [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
    } catch (err: any) {
      Alert.alert('Error adding transaction', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>New Record</Text>

          {/* Transaction Type Tabs */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabs}>
            {TABS.map((tab) => (
              <TabItem
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={() => setActiveTab(tab.key)}
              />
            ))}
          </Animated.View>

          {/* Amount Box */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card style={styles.amountCard}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: activeColor }]}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                value={amount}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setAmount(cleaned);
                }}
                keyboardType="decimal-pad"
                maxLength={10}
                autoFocus
              />
            </Card>
          </Animated.View>

          {/* Categories Grid Header */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Select Category</Text>
          </Animated.View>

          {/* Categories Scrollable Grid */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.categoryGrid}>
            {categories.map((cat) => (
              <CategoryGridItem
                key={cat.id}
                cat={cat}
                isSelected={selectedCatId === cat.id}
                onPress={() => setSelectedCatId(cat.id)}
              />
            ))}
          </Animated.View>

          {/* Note Input */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={styles.fieldCard}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Add notes / description"
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </Card>
          </Animated.View>

          {/* Recurring Option */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Card style={styles.recurringCard}>
              <View style={styles.recurringRow}>
                <View style={styles.recurringLeft}>
                  <Ionicons name="repeat-outline" size={22} color={Colors.textSecondary} />
                  <View style={{ marginLeft: Spacing.sm }}>
                    <Text style={styles.recurringTitle}>Recurring Transaction</Text>
                    <Text style={styles.recurringSub}>Process transaction periodically</Text>
                  </View>
                </View>
                <Pressable onPress={() => setIsRecurring(!isRecurring)}>
                  <Animated.View style={[styles.toggleSwitch, switchStyle]}>
                    <Animated.View style={[styles.toggleThumb, thumbStyle]} />
                  </Animated.View>
                </Pressable>
              </View>

              {isRecurring && (
                <View style={styles.intervalSelector}>
                  {(['daily', 'weekly', 'monthly'] as const).map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.intervalBtn,
                        recurringInterval === interval && {
                          backgroundColor: Colors.primary + '20',
                          borderColor: Colors.primary,
                        },
                      ]}
                      onPress={() => setRecurringInterval(interval)}
                    >
                      <Text
                        style={[
                          styles.intervalText,
                          recurringInterval === interval && { color: Colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {interval.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Add Button */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <AnimatedButton
              label={`Save ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleAdd}
              style={{ marginTop: Spacing.md }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  tabText: { ...Typography.body, fontWeight: '600' },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  currencySymbol: { ...Typography.display, color: Colors.textSecondary, marginRight: Spacing.sm, fontSize: 44 },
  amountInput: { flex: 1, ...Typography.display, fontSize: 48, paddingVertical: 4 },
  sectionHeader: { marginBottom: Spacing.sm },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    width: '23%', // approx 4 columns
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  categoryIconBg: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: { ...Typography.caption, fontSize: 11, textAlign: 'center' },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  fieldInput: { flex: 1, ...Typography.bodyLarge, color: Colors.textPrimary, paddingVertical: 4 },
  recurringCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recurringLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  recurringTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  recurringSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    position: 'absolute',
    left: 4,
  },
  intervalSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.md,
  },
  intervalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  intervalText: { ...Typography.caption, color: Colors.textSecondary },
});
