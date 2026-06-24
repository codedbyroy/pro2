// store/budgetStore.ts
// Zustand store for category budget limits

import { create } from 'zustand';
import { BudgetLimit, fetchBudgets, saveBudget, deleteBudget } from '../services/firebase/budgets';

interface BudgetState {
  budgets: Record<string, BudgetLimit>; // categoryId -> BudgetLimit
  isLoading: boolean;

  // Actions
  loadBudgets: (uid: string) => Promise<void>;
  setBudgetLimit: (uid: string, categoryId: string, limit: number, period: 'monthly' | 'weekly') => Promise<void>;
  removeBudgetLimit: (uid: string, categoryId: string) => Promise<void>;
  clearAll: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: {},
  isLoading: false,

  loadBudgets: async (uid) => {
    set({ isLoading: true });
    try {
      const list = await fetchBudgets(uid);
      const map: Record<string, BudgetLimit> = {};
      list.forEach(b => {
        map[b.categoryId] = b;
      });
      set({ budgets: map });
    } catch (e) {
      console.error('Failed to load budgets', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setBudgetLimit: async (uid, categoryId, limit, period) => {
    const budget = { limit, period };
    await saveBudget(uid, categoryId, budget);
    set((state) => ({
      budgets: {
        ...state.budgets,
        [categoryId]: { categoryId, ...budget },
      },
    }));
  },

  removeBudgetLimit: async (uid, categoryId) => {
    await deleteBudget(uid, categoryId);
    set((state) => {
      const copy = { ...state.budgets };
      delete copy[categoryId];
      return { budgets: copy };
    });
  },

  clearAll: () => set({ budgets: {} }),
}));
