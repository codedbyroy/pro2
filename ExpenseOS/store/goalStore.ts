// store/goalStore.ts
// Zustand store for savings goals

import { create } from 'zustand';
import { SavingsGoal, fetchGoals, saveGoal, deleteGoal } from '../services/firebase/goals';

interface GoalState {
  goals: SavingsGoal[];
  isLoading: boolean;

  // Actions
  loadGoals: (uid: string) => Promise<void>;
  addGoal: (uid: string, goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateGoal: (uid: string, id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  removeGoal: (uid: string, id: string) => Promise<void>;
  clearAll: () => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async (uid) => {
    set({ isLoading: true });
    try {
      const list = await fetchGoals(uid);
      set({ goals: list });
    } catch (e) {
      console.error('Failed to load goals', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: async (uid, goalData) => {
    const id = 'goal_' + Math.random().toString(36).substr(2, 9);
    const newGoal: SavingsGoal = { id, ...goalData };
    await saveGoal(uid, newGoal);
    set((state) => ({
      goals: [...state.goals, newGoal],
    }));
  },

  updateGoal: async (uid, id, updates) => {
    const existing = get().goals.find(g => g.id === id);
    if (!existing) return;
    const updated: SavingsGoal = { ...existing, ...updates };
    await saveGoal(uid, updated);
    set((state) => ({
      goals: state.goals.map(g => g.id === id ? updated : g),
    }));
  },

  removeGoal: async (uid, id) => {
    await deleteGoal(uid, id);
    set((state) => ({
      goals: state.goals.filter(g => g.id !== id),
    }));
  },

  clearAll: () => set({ goals: [] }),
}));
