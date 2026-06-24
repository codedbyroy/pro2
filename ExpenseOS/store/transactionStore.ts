// store/transactionStore.ts
// Zustand store for transactions
// See BUILDPLAN.md for full context

import { create } from 'zustand';
import { CategoryType } from '../constants/defaultCategories';

export interface Transaction {
  id: string;
  type: CategoryType;           // 'income' | 'saving' | 'expense'
  amount: number;               // always positive, type determines +/-
  category: string;             // category id
  subcategory?: string;
  note?: string;
  date: string;                 // ISO string
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  lastSync: string | null;

  // Actions
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setLastSync: (date: string) => void;
  clearAll: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  lastSync: null,

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (tx) => set((state) => ({
    transactions: [tx, ...state.transactions],
  })),

  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map(tx =>
      tx.id === id ? { ...tx, ...updates, updatedAt: new Date().toISOString() } : tx
    ),
  })),

  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(tx => tx.id !== id),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setLastSync: (lastSync) => set({ lastSync }),
  clearAll: () => set({ transactions: [], lastSync: null }),
}));
