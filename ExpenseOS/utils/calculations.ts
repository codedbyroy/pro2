// utils/calculations.ts
// Financial calculation utilities for ExpenseOS

import type { Transaction } from '../store/transactionStore';

/**
 * Calculate total balance = income - expense (saving is separate)
 */
export const calculateBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((acc, tx) => {
    if (tx.type === 'income')  return acc + tx.amount;
    if (tx.type === 'expense') return acc - tx.amount;
    return acc; // savings don't affect spendable balance
  }, 0);
};

/**
 * Calculate total by type
 */
export const calculateTotalByType = (
  transactions: Transaction[],
  type: 'income' | 'expense' | 'saving'
): number => transactions
  .filter(tx => tx.type === type)
  .reduce((acc, tx) => acc + tx.amount, 0);

/**
 * Calculate savings rate = savings / income * 100
 */
export const calculateSavingsRate = (transactions: Transaction[]): number => {
  const income  = calculateTotalByType(transactions, 'income');
  const savings = calculateTotalByType(transactions, 'saving');
  if (income === 0) return 0;
  return Math.round((savings / income) * 100);
};

/**
 * Group transactions by category and sum amounts
 */
export const groupByCategory = (
  transactions: Transaction[]
): Record<string, number> => {
  return transactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
};

/**
 * Filter transactions by date range
 */
export const filterByDateRange = (
  transactions: Transaction[],
  from: Date,
  to: Date = new Date()
): Transaction[] => {
  return transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= from && d <= to;
  });
};
