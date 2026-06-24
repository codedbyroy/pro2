// constants/defaultCategories.ts
// Default categories for Income, Saving, Expense sections
// Users can add/edit/delete — these are just starting points

export type CategoryType = 'income' | 'saving' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;       // Ionicons name
  color: string;      // Hex color
  type: CategoryType;
  isDefault: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // ─── INCOME ───────────────────────────────────────────
  { id: 'inc-salary',     name: 'Salary',        icon: 'briefcase',       color: '#00D97E', type: 'income',  isDefault: true },
  { id: 'inc-freelance',  name: 'Freelance',     icon: 'laptop',          color: '#4DA6FF', type: 'income',  isDefault: true },
  { id: 'inc-pocket',     name: 'Pocket Money',  icon: 'cash',            color: '#00D97E', type: 'income',  isDefault: true },
  { id: 'inc-gift',       name: 'Gift',          icon: 'gift',            color: '#FF6FB8', type: 'income',  isDefault: true },
  { id: 'inc-investment', name: 'Investment',    icon: 'trending-up',     color: '#6C63FF', type: 'income',  isDefault: true },
  { id: 'inc-other',      name: 'Other Income',  icon: 'add-circle',      color: '#A0A0B0', type: 'income',  isDefault: true },

  // ─── SAVING ───────────────────────────────────────────
  { id: 'sav-emergency',  name: 'Emergency Fund', icon: 'shield-checkmark', color: '#FFB800', type: 'saving', isDefault: true },
  { id: 'sav-goal',       name: 'Goal Savings',   icon: 'trophy',           color: '#FFB800', type: 'saving', isDefault: true },
  { id: 'sav-investment', name: 'Investment',     icon: 'bar-chart',        color: '#6C63FF', type: 'saving', isDefault: true },
  { id: 'sav-fd',         name: 'Fixed Deposit',  icon: 'lock-closed',      color: '#4DA6FF', type: 'saving', isDefault: true },
  { id: 'sav-other',      name: 'Other Saving',   icon: 'wallet',           color: '#A0A0B0', type: 'saving', isDefault: true },

  // ─── EXPENSE ──────────────────────────────────────────
  { id: 'exp-food',       name: 'Food & Dining',  icon: 'restaurant',      color: '#FF4D4D', type: 'expense', isDefault: true },
  { id: 'exp-transport',  name: 'Transport',      icon: 'car',             color: '#FF8C00', type: 'expense', isDefault: true },
  { id: 'exp-shopping',   name: 'Shopping',       icon: 'bag',             color: '#FF6FB8', type: 'expense', isDefault: true },
  { id: 'exp-bills',      name: 'Bills & Utilities', icon: 'receipt',     color: '#FF4D4D', type: 'expense', isDefault: true },
  { id: 'exp-health',     name: 'Healthcare',     icon: 'medkit',         color: '#4DA6FF', type: 'expense', isDefault: true },
  { id: 'exp-entertainment', name: 'Entertainment', icon: 'game-controller', color: '#A855F7', type: 'expense', isDefault: true },
  { id: 'exp-education',  name: 'Education',      icon: 'school',          color: '#00D97E', type: 'expense', isDefault: true },
  { id: 'exp-rent',       name: 'Rent',           icon: 'home',            color: '#FF4D4D', type: 'expense', isDefault: true },
  { id: 'exp-subscriptions', name: 'Subscriptions', icon: 'repeat',       color: '#6C63FF', type: 'expense', isDefault: true },
  { id: 'exp-other',      name: 'Other Expense',  icon: 'ellipsis-horizontal', color: '#A0A0B0', type: 'expense', isDefault: true },
];

export const getCategoriesByType = (type: CategoryType): Category[] =>
  DEFAULT_CATEGORIES.filter(c => c.type === type);
