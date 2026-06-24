// utils/currency.ts
// INR formatting utilities for ExpenseOS

/**
 * Format a number as Indian Rupee string
 * e.g. 125000 → "₹1,25,000"
 */
export const formatINR = (amount: number, showSign = false): string => {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs);

  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
};

/**
 * Format compact for display in charts / small spaces
 * e.g. 125000 → "₹1.25L"
 */
export const formatINRCompact = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)  return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000)    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
};

/**
 * Parse user input string to number (handles commas)
 */
export const parseAmount = (input: string): number => {
  const cleaned = input.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};
