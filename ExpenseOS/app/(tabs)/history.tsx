// app/(tabs)/history.tsx
// Transaction History Screen — Production Ready
// Features: Search input, category/type filter chips, date-grouped listings, detail dialogs, and deletion support.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { DEFAULT_CATEGORIES } from '../../constants/defaultCategories';
import { formatINR } from '../../utils/currency';
import { formatDate, formatDateShort, formatTime, getDateLabel } from '../../utils/date';
import { deleteTransaction } from '../../services/firebase/transactions';

type FilterType = 'all' | 'income' | 'expense' | 'saving';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated Filter Chip Component
interface FilterChipProps {
  label: string;
  isActive: boolean;
  color: string;
  onPress: () => void;
}

function FilterChip({ label, isActive, color, onPress }: FilterChipProps) {
  const scale = useSharedValue(1);
  const chipScale = useSharedValue(1);

  React.useEffect(() => {
    chipScale.value = withSpring(isActive ? 1.06 : 1, { damping: 12, stiffness: 180 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * chipScale.value }],
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
        styles.filterChip,
        isActive && { backgroundColor: color + '15', borderColor: color },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          { color: isActive ? color : Colors.textMuted },
          isActive && { fontWeight: '700' },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </AnimatedPressable>
  );
}

// Animated Transaction Row Component
interface AnimatedTxRowProps {
  tx: Transaction;
  cat: any;
  onPress: () => void;
  onLongPress: () => void;
  isLast?: boolean;
}

function AnimatedTxRow({ tx, cat, onPress, onLongPress, isLast }: AnimatedTxRowProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      style={[
        styles.txRow,
        animatedStyle,
        !isLast && styles.txRowBorder
      ]}
    >
      <View style={[styles.txIconContainer, { backgroundColor: cat.color + '15' }]}>
        <Ionicons name={cat.icon as any} size={22} color={cat.color} />
      </View>
      <View style={styles.txDetails}>
        <Text style={styles.txCategoryName}>{cat.name}</Text>
        {tx.note ? (
          <Text style={styles.txNote} numberOfLines={1}>
            {tx.note}
          </Text>
        ) : (
          <Text style={styles.txNote} numberOfLines={1}>
            {cat.name} transaction
          </Text>
        )}
      </View>
      <View style={styles.txRight}>
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
        <Text style={styles.txTime}>{formatTime(tx.date)}</Text>
      </View>
    </AnimatedPressable>
  );
}

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { transactions, deleteTransaction: deleteLocal, isLoading } = useTransactionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Helper to fetch category details (name, icon, color)
  const getCategoryDetails = (catId: string, type: string) => {
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === catId);
    if (cat) return cat;

    if (catId === 'income') return { name: 'Income', icon: 'cash-outline', color: Colors.income };
    if (catId === 'expense') return { name: 'Expense', icon: 'card-outline', color: Colors.expense };
    if (catId === 'saving') return { name: 'Saving', icon: 'wallet-outline', color: Colors.saving };

    return {
      name: catId.charAt(0).toUpperCase() + catId.slice(1),
      icon: type === 'income' ? 'arrow-down-circle' : type === 'expense' ? 'arrow-up-circle' : 'wallet',
      color: type === 'income' ? Colors.income : type === 'expense' ? Colors.expense : Colors.saving,
    };
  };

  // Filtered transactions based on search query and category type filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const catDetails = getCategoryDetails(tx.category, tx.type);
      const matchesSearch =
        tx.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === 'all' || tx.type === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, activeFilter]);

  // Group transactions by date label
  const groupedTransactions = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    filteredTransactions.forEach((tx) => {
      const label = getDateLabel(tx.date);
      const existing = groups.find((g) => g.title === label);
      if (existing) {
        existing.data.push(tx);
      } else {
        groups.push({ title: label, data: [tx] });
      }
    });
    return groups;
  }, [filteredTransactions]);

  const handleDelete = (tx: Transaction) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Record',
      'Are you sure you want to permanently delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(user.uid, tx.id);
              deleteLocal(tx.id);
            } catch (err: any) {
              Alert.alert('Delete failed', err.message || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const showDetails = (tx: Transaction) => {
    const cat = getCategoryDetails(tx.category, tx.type);
    Alert.alert(
      `${cat.name} details`,
      `Type: ${tx.type.toUpperCase()}\n` +
      `Amount: ${formatINR(tx.amount)}\n` +
      `Date: ${formatDate(tx.date)} at ${formatTime(tx.date)}\n` +
      (tx.note ? `Notes: ${tx.note}\n` : '') +
      (tx.isRecurring ? `Recurring: Every ${tx.recurringInterval}` : 'Recurring: No'),
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(tx) }
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No matching transactions</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Try adjusting your search terms.' : 'Create records on the add tab to see them listed here.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>History</Text>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search note or category..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense', 'saving'] as FilterType[]).map((f) => {
          const color = f === 'income' ? Colors.income : f === 'expense' ? Colors.expense : f === 'saving' ? Colors.saving : Colors.primary;
          const isActive = activeFilter === f;
          return (
            <FilterChip
              key={f}
              label={f}
              isActive={isActive}
              color={color}
              onPress={() => setActiveFilter(f)}
            />
          );
        })}
      </View>

      {/* Date Grouped FlatList */}
      {isLoading ? (
        <Text style={styles.infoText}>Fetching records...</Text>
      ) : (
        <FlatList
          data={groupedTransactions}
          keyExtractor={(item) => item.title}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <Animated.View entering={FadeIn.duration(300)} layout={Layout.springify()} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Card variant="default" style={styles.groupCard}>
                {group.data.map((tx, idx) => {
                  const cat = getCategoryDetails(tx.category, tx.type);
                  return (
                    <Animated.View key={tx.id} layout={Layout.springify()}>
                      <AnimatedTxRow
                        tx={tx}
                        cat={cat}
                        onPress={() => showDetails(tx)}
                        onLongPress={() => handleDelete(tx)}
                        isLast={idx === group.data.length - 1}
                      />
                    </Animated.View>
                  );
                })}
              </Card>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h2, color: Colors.textPrimary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, marginBottom: Spacing.xs },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.sm,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, color: Colors.textPrimary, ...Typography.bodyLarge, paddingVertical: 4 },
  clearSearch: { padding: Spacing.xs },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  filterText: { ...Typography.caption, fontSize: 10, fontWeight: '500' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  infoText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  groupContainer: { marginBottom: Spacing.md },
  groupTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  groupCard: {
    padding: 0,
    paddingHorizontal: Spacing.sm,
  },
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
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { ...Typography.bodyLarge, fontWeight: '700' },
  txTime: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});
