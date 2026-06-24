// app/(tabs)/charts.tsx
// Analytics & Charts Screen — Production Ready
// Uses react-native-gifted-charts for single & grouped trends, and customized insights dashboards.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransactionStore } from '../../store/transactionStore';
import { DEFAULT_CATEGORIES } from '../../constants/defaultCategories';
import { formatINR, formatINRCompact } from '../../utils/currency';
import { getLastNDays, startOfDay } from '../../utils/date';
import { groupByCategory } from '../../utils/calculations';

const screenWidth = Dimensions.get('window').width;

type Horizon = 'daily' | 'weekly' | 'monthly';
type AnalysisType = 'expense' | 'income' | 'flow';

export default function ChartsScreen() {
  const { transactions } = useTransactionStore();
  const [timeHorizon, setTimeHorizon] = useState<Horizon>('daily');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('expense');

  // 1. Calculate Daily / Weekly / Monthly trend aggregates
  const trendData = useMemo(() => {
    if (timeHorizon === 'daily') {
      const days = getLastNDays(7);
      return days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const filterTxs = (type: 'income' | 'expense') =>
          transactions
            .filter((t) => {
              const d = new Date(t.date);
              return d >= dayStart && d < dayEnd && t.type === type;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        const inc = filterTxs('income');
        const exp = filterTxs('expense');
        const label = day.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);

        return { label, income: inc, expense: exp };
      });
    } else if (timeHorizon === 'weekly') {
      // Last 4 calendar weeks (0-7d ago, 7-14d ago, 14-21d ago, 21-28d ago)
      const now = new Date();
      return [3, 2, 1, 0].map((wkIndex) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (wkIndex + 1) * 7);
        const end = new Date(now);
        end.setDate(now.getDate() - wkIndex * 7);

        const filterTxs = (type: 'income' | 'expense') =>
          transactions
            .filter((t) => {
              const d = new Date(t.date);
              return d >= start && d < end && t.type === type;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        const inc = filterTxs('income');
        const exp = filterTxs('expense');
        const label = `Wk ${4 - wkIndex}`;

        return { label, income: inc, expense: exp };
      });
    } else {
      // Last 6 calendar months
      const now = new Date();
      return Array.from({ length: 6 }).map((_, idx) => {
        const mOffset = 5 - idx; // index 0 is 5 months ago, index 5 is current month
        const targetDate = new Date(now.getFullYear(), now.getMonth() - mOffset, 1);
        const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

        const filterTxs = (type: 'income' | 'expense') =>
          transactions
            .filter((t) => {
              const d = new Date(t.date);
              return d >= start && d < end && t.type === type;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        const inc = filterTxs('income');
        const exp = filterTxs('expense');
        const label = targetDate.toLocaleDateString('en-IN', { month: 'short' });

        return { label, income: inc, expense: exp };
      });
    }
  }, [transactions, timeHorizon]);

  // 2. Format bar chart data based on selected analysis type
  const chartData = useMemo(() => {
    if (analysisType === 'expense') {
      return trendData.map((d) => ({
        value: d.expense,
        label: d.label,
        frontColor: Colors.expense,
      }));
    } else if (analysisType === 'income') {
      return trendData.map((d) => ({
        value: d.income,
        label: d.label,
        frontColor: Colors.income,
      }));
    } else {
      // Grouped Cash Flow (side-by-side bars: Income & Expense)
      const data: any[] = [];
      trendData.forEach((d) => {
        data.push({
          value: d.income,
          spacing: 2,
          frontColor: Colors.income,
          label: d.label,
        });
        data.push({
          value: d.expense,
          frontColor: Colors.expense,
        });
      });
      return data;
    }
  }, [trendData, analysisType]);

  // Max value for bar chart y-axis scaling
  const maxBarValue = useMemo(() => {
    const vals = trendData.flatMap((d) => [d.income, d.expense]);
    const max = Math.max(...vals);
    return max > 0 ? max * 1.15 : 1000;
  }, [trendData]);

  // 3. Category Breakdown (Pie Chart) - maps to active analysis category (Expense/Income)
  const pieType = analysisType === 'income' ? 'income' : 'expense';
  
  const pieData = useMemo(() => {
    const filteredTxs = transactions.filter((tx) => tx.type === pieType);
    const grouped = groupByCategory(filteredTxs);
    const total = filteredTxs.reduce((acc, t) => acc + t.amount, 0);

    if (total === 0) return [];

    return Object.entries(grouped).map(([catId, amount]) => {
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === catId);
      const color = cat?.color ?? '#94A3B8';
      const name = cat?.name ?? (catId.charAt(0).toUpperCase() + catId.slice(1));
      const pct = Math.round((amount / total) * 100);

      return {
        value: amount,
        color,
        text: `${pct}%`,
        label: name,
        shiftTextX: -4,
        shiftTextY: -4,
      };
    });
  }, [transactions, pieType]);

  // 4. Period aggregations & insights
  const insights = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    trendData.forEach((d) => {
      totalIncome += d.income;
      totalExpense += d.expense;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const numDays = timeHorizon === 'daily' ? 7 : timeHorizon === 'weekly' ? 28 : 180;
    const dailyAverage = totalExpense / numDays;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      dailyAverage,
    };
  }, [trendData, timeHorizon]);

  // 5. Find top expense / income category
  const topCategory = useMemo(() => {
    const filteredTxs = transactions.filter((tx) => tx.type === pieType);
    const grouped = groupByCategory(filteredTxs);
    let maxAmount = 0;
    let maxCatId = '';

    Object.entries(grouped).forEach(([catId, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxCatId = catId;
      }
    });

    if (!maxCatId) return null;

    const cat = DEFAULT_CATEGORIES.find((c) => c.id === maxCatId);
    return {
      name: cat?.name ?? maxCatId,
      amount: maxAmount,
      color: cat?.color ?? Colors.primary,
      icon: cat?.icon ?? 'card',
    };
  }, [transactions, pieType]);

  const hasData = transactions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.title}>Analytics</Text>

          {/* Time Horizon Filter Chips */}
          <View style={styles.selectorWrapper}>
            {(['daily', 'weekly', 'monthly'] as Horizon[]).map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.selectorChip,
                  timeHorizon === h && styles.selectorChipActive,
                ]}
                onPress={() => setTimeHorizon(h)}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    timeHorizon === h && styles.selectorChipTextActive,
                  ]}
                >
                  {h === 'daily' ? 'Daily (7d)' : h === 'weekly' ? 'Weekly (4w)' : 'Monthly (6m)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Analysis Type Switchers */}
          <View style={styles.toggleRow}>
            {(['expense', 'income', 'flow'] as AnalysisType[]).map((type) => {
              const active = analysisType === type;
              const activeColor = type === 'expense' ? Colors.expense : type === 'income' ? Colors.income : Colors.primary;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.toggleBtn,
                    active && { backgroundColor: activeColor + '10', borderColor: activeColor },
                  ]}
                  onPress={() => setAnalysisType(type)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      active && { color: activeColor, fontWeight: '700' },
                    ]}
                  >
                    {type === 'expense' ? 'Spent' : type === 'income' ? 'Income' : 'Cash Flow'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {!hasData ? (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No financial activity yet</Text>
              <Text style={styles.emptyDesc}>
                Start logging your income, savings, and expenses on the add screen to unlock advanced charts and insights.
              </Text>
            </Card>
          </Animated.View>
        ) : (
          <View style={styles.chartsContent}>
            {/* 1. Bar Chart Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  {timeHorizon === 'daily'
                    ? '7-Day Trend'
                    : timeHorizon === 'weekly'
                    ? '4-Week Trend'
                    : '6-Month Trend'}
                </Text>
                <View style={styles.barChartWrapper}>
                  <BarChart
                    data={chartData}
                    barWidth={analysisType === 'flow' ? 10 : 22}
                    spacing={analysisType === 'flow' ? 10 : 14}
                    roundedTop
                    roundedBottom
                    noOfSections={4}
                    maxValue={maxBarValue}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={Colors.surfaceBorder}
                    yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10, fontWeight: '500' }}
                    hideRules
                    showReferenceLine1
                    referenceLine1Position={maxBarValue / 2}
                    referenceLine1Config={{
                      color: Colors.surfaceBorder,
                      dashWidth: 4,
                      dashGap: 4,
                    }}
                    renderTooltip={(item: any) => (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{formatINRCompact(item.value)}</Text>
                      </View>
                    )}
                  />
                </View>
              </Card>
            </Animated.View>

            {/* 2. Insights Panel */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <Card variant="glass" style={styles.insightsCard}>
                <Text style={styles.chartTitle}>Insights Summary</Text>
                
                {/* Cash Flow Insights Row */}
                <View style={styles.insightGroupRow}>
                  <View style={styles.insightDetailCol}>
                    <Text style={styles.insightLabel}>Total Inflow</Text>
                    <Text style={[styles.insightValue, { color: Colors.income }]}>
                      {formatINR(insights.totalIncome)}
                    </Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.insightDetailCol}>
                    <Text style={styles.insightLabel}>Total Outflow</Text>
                    <Text style={[styles.insightValue, { color: Colors.expense }]}>
                      {formatINR(insights.totalExpense)}
                    </Text>
                  </View>
                </View>

                <View style={styles.horizontalDivider} />

                {/* Savings Status Row */}
                <View style={styles.insightItemRow}>
                  <View style={[styles.insightIcon, { backgroundColor: Colors.primaryGlow }]}>
                    <Ionicons name="cash-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.insightTextWrap}>
                    <Text style={styles.insightItemTitle}>Net Savings</Text>
                    <Text
                      style={[
                        styles.insightItemValue,
                        { color: insights.netSavings >= 0 ? Colors.income : Colors.expense },
                      ]}
                    >
                      {insights.netSavings >= 0 ? '+' : ''}
                      {formatINR(insights.netSavings)}
                    </Text>
                  </View>
                  <View style={styles.insightBadge}>
                    <Text style={styles.insightBadgeText}>{insights.savingsRate}% Rate</Text>
                  </View>
                </View>

                {/* Velocity Row */}
                <View style={styles.insightItemRow}>
                  <View style={[styles.insightIcon, { backgroundColor: Colors.saving + '15' }]}>
                    <Ionicons name="speedometer-outline" size={18} color={Colors.saving} />
                  </View>
                  <View style={styles.insightTextWrap}>
                    <Text style={styles.insightItemTitle}>Average Outflow Rate</Text>
                    <Text style={[styles.insightItemValue, { color: Colors.textPrimary }]}>
                      {formatINR(Math.round(insights.dailyAverage))} / day
                    </Text>
                  </View>
                </View>

                {/* Top Category Row */}
                {topCategory && (
                  <View style={[styles.insightItemRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <View style={[styles.insightIcon, { backgroundColor: topCategory.color + '15' }]}>
                      <Ionicons name={topCategory.icon as any} size={18} color={topCategory.color} />
                    </View>
                    <View style={styles.insightTextWrap}>
                      <Text style={styles.insightItemTitle}>Top {pieType === 'income' ? 'Income Source' : 'Expense Category'}</Text>
                      <Text style={[styles.insightItemValue, { color: Colors.textPrimary }]}>
                        {topCategory.name}
                      </Text>
                    </View>
                    <Text style={styles.topCategoryAmount}>{formatINR(topCategory.amount)}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* 3. Pie Chart Card */}
            {pieData.length > 0 && analysisType !== 'flow' && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <Card style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Category Breakdown ({pieType === 'income' ? 'Income' : 'Spent'})</Text>
                  
                  <View style={styles.pieContainer}>
                    <PieChart
                      data={pieData}
                      donut
                      showText
                      textColor={Colors.background}
                      textSize={10}
                      radius={screenWidth * 0.20}
                      innerRadius={screenWidth * 0.10}
                      innerCircleColor={Colors.surface}
                    />

                    {/* Legend list */}
                    <View style={styles.legendContainer}>
                      {pieData.map((item, index) => (
                        <View key={index} style={styles.legendRow}>
                          <View style={[styles.legendIndicator, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText} numberOfLines={1}>
                            {item.label} ({item.text})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxl },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  selectorWrapper: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  selectorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  selectorChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  selectorChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  selectorChipTextActive: { color: Colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 2,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleBtnText: { ...Typography.body, color: Colors.textMuted, fontWeight: '500', fontSize: 13 },
  emptyCard: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    marginTop: 40,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptyDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  chartsContent: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: Spacing.md },
  chartCard: { padding: Spacing.md },
  chartTitle: { ...Typography.bodyLarge, color: Colors.textSecondary, fontWeight: '700', marginBottom: Spacing.lg },
  barChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10, // adjust y-axis text spacing
  },
  tooltip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tooltipText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '700' },
  insightsCard: {
    padding: Spacing.md,
  },
  insightGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  insightDetailCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  insightValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: Spacing.md,
  },
  insightItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextWrap: {
    flex: 1,
  },
  insightItemTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  insightItemValue: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  insightBadge: {
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  insightBadgeText: {
    ...Typography.caption,
    color: Colors.income,
    fontWeight: '700',
  },
  topCategoryAmount: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  legendContainer: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
