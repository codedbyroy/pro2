// services/firebase/goals.ts
// Firebase and Offline Fallback CRUD for savings goals

import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, IS_DEMO } from '../../firebase.config';

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string; // ISO string
  icon: string;      // Ionicons name
}

const goalsCollection = (uid: string) =>
  collection(db!, 'users', uid, 'goals');

/**
 * Fetch all goals for a user
 */
export const fetchGoals = async (uid: string): Promise<SavingsGoal[]> => {
  if (IS_DEMO) {
    const goalsStr = await AsyncStorage.getItem(`demo_goals_${uid}`) || '{}';
    return Object.values(JSON.parse(goalsStr));
  }

  const snap = await getDocs(goalsCollection(uid));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  } as SavingsGoal));
};

/**
 * Save/Update a savings goal
 */
export const saveGoal = async (
  uid: string,
  goal: SavingsGoal
): Promise<void> => {
  if (IS_DEMO) {
    const goalsStr = await AsyncStorage.getItem(`demo_goals_${uid}`) || '{}';
    const goals = JSON.parse(goalsStr);
    goals[goal.id] = goal;
    await AsyncStorage.setItem(`demo_goals_${uid}`, JSON.stringify(goals));
    return;
  }

  const ref = doc(db!, 'users', uid, 'goals', goal.id);
  await setDoc(ref, {
    name: goal.name,
    target: goal.target,
    current: goal.current,
    deadline: goal.deadline || null,
    icon: goal.icon,
  });
};

/**
 * Delete a savings goal
 */
export const deleteGoal = async (uid: string, goalId: string): Promise<void> => {
  if (IS_DEMO) {
    const goalsStr = await AsyncStorage.getItem(`demo_goals_${uid}`) || '{}';
    const goals = JSON.parse(goalsStr);
    delete goals[goalId];
    await AsyncStorage.setItem(`demo_goals_${uid}`, JSON.stringify(goals));
    return;
  }

  const ref = doc(db!, 'users', uid, 'goals', goalId);
  await deleteDoc(ref);
};
