// utils/date.ts
// Date helper utilities for ExpenseOS

/**
 * Get start of day (midnight)
 */
export const startOfDay = (date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get start of current week (Monday)
 */
export const startOfWeek = (date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get start of current month
 */
export const startOfMonth = (date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Format date for display
 * e.g. "24 Jun 2026"
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format date short (for transaction cards)
 * e.g. "24 Jun"
 */
export const formatDateShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/**
 * Format time
 * e.g. "8:30 PM"
 */
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Group transactions by date label for history list
 */
export const getDateLabel = (date: Date | string): string => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(d);
};

/**
 * Get last N days as array of Date objects
 */
export const getLastNDays = (n: number): Date[] => {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
};

export type Period = 'daily' | 'weekly' | 'monthly';

export const getPeriodStart = (period: Period): Date => {
  switch (period) {
    case 'daily':   return startOfDay();
    case 'weekly':  return startOfWeek();
    case 'monthly': return startOfMonth();
  }
};
