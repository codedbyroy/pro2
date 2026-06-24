// services/firebase/budgets.ts
// Firebase and Offline Fallback CRUD for category budget limits

import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, IS_DEMO } from '../../firebase.config';

export interface BudgetLimit {
  categoryId: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

const budgetCollection = (uid: string) =>
  collection(db!, 'users', uid, 'budgets');

/**
 * Fetch all budgets for a user
 */
export const fetchBudgets = async (uid: string): Promise<BudgetLimit[]> => {
  if (IS_DEMO) {
    const budgetsStr = await AsyncStorage.getItem(`demo_budgets_${uid}`) || '{}';
    return Object.values(JSON.parse(budgetsStr));
  }

  const snap = await getDocs(budgetCollection(uid));
  return snap.docs.map(d => ({
    categoryId: d.id,
    ...d.data(),
  } as BudgetLimit));
};

/**
 * Save/Update a category budget
 */
export const saveBudget = async (
  uid: string,
  categoryId: string,
  budget: Omit<BudgetLimit, 'categoryId'>
): Promise<void> => {
  if (IS_DEMO) {
    const budgetsStr = await AsyncStorage.getItem(`demo_budgets_${uid}`) || '{}';
    const budgets = JSON.parse(budgetsStr);
    budgets[categoryId] = { categoryId, ...budget };
    await AsyncStorage.setItem(`demo_budgets_${uid}`, JSON.stringify(budgets));
    return;
  }

  const ref = doc(db!, 'users', uid, 'budgets', categoryId);
  await setDoc(ref, budget);
};

/**
 * Delete a budget limit
 */
export const deleteBudget = async (uid: string, categoryId: string): Promise<void> => {
  if (IS_DEMO) {
    const budgetsStr = await AsyncStorage.getItem(`demo_budgets_${uid}`) || '{}';
    const budgets = JSON.parse(budgetsStr);
    delete budgets[categoryId];
    await AsyncStorage.setItem(`demo_budgets_${uid}`, JSON.stringify(budgets));
    return;
  }

  const ref = doc(db!, 'users', uid, 'budgets', categoryId);
  await deleteDoc(ref);
};
