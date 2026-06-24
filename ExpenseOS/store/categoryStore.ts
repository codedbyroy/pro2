// store/categoryStore.ts
// Zustand store for categories (default + user-customized)
// See BUILDPLAN.md for full context

import { create } from 'zustand';
import {
  Category,
  CategoryType,
  DEFAULT_CATEGORIES,
} from '../constants/defaultCategories';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  // Actions
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoriesByType: (type: CategoryType) => Category[];
  resetToDefaults: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  isLoading: false,

  setCategories: (categories) => set({ categories }),

  addCategory: (cat) => set((state) => ({
    categories: [...state.categories, cat],
  })),

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),

  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id || c.isDefault),
  })),

  getCategoriesByType: (type) =>
    get().categories.filter(c => c.type === type),

  resetToDefaults: () => set({ categories: DEFAULT_CATEGORIES }),
}));
