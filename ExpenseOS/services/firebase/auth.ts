// services/firebase/auth.ts
// Firebase Auth service functions for ExpenseOS (with local Offline Demo mode fallback)
// See BUILDPLAN.md for full context

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, IS_DEMO } from '../../firebase.config';

// --- Demo Mode State ---
const listeners: Array<(user: any) => void> = [];
let currentDemoUser: any = null;

const triggerListeners = (user: any) => {
  currentDemoUser = user;
  listeners.forEach(cb => cb(user));
};

/**
 * Register a new user with email + password
 * Also creates their Firestore profile document
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<any> => {
  if (IS_DEMO) {
    const usersStr = await AsyncStorage.getItem('demo_users') || '{}';
    const users = JSON.parse(usersStr);
    const normalizedEmail = email.toLowerCase().trim();
    if (users[normalizedEmail]) {
      throw new Error('Email already exists');
    }
    const uid = 'demo_user_' + Math.random().toString(36).substr(2, 9);
    const newUser = { uid, email: normalizedEmail, displayName };
    users[normalizedEmail] = { ...newUser, password };
    await AsyncStorage.setItem('demo_users', JSON.stringify(users));

    const profile = {
      uid,
      email: normalizedEmail,
      displayName,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(`demo_profile_${uid}`, JSON.stringify(profile));
    await AsyncStorage.setItem('demo_current_user', JSON.stringify(newUser));
    triggerListeners(newUser);
    return newUser;
  }

  const cred = await createUserWithEmailAndPassword(auth!, email, password);

  // Update display name
  await updateProfile(cred.user, { displayName });

  // Create Firestore profile
  await setDoc(doc(db!, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    currency: 'INR',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred.user;
};

/**
 * Sign in with email + password
 */
export const signIn = async (email: string, password: string): Promise<any> => {
  if (IS_DEMO) {
    const usersStr = await AsyncStorage.getItem('demo_users') || '{}';
    const users = JSON.parse(usersStr);
    const normalizedEmail = email.toLowerCase().trim();
    const user = users[normalizedEmail];
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    const userWithoutPwd = { uid: user.uid, email: user.email, displayName: user.displayName };
    await AsyncStorage.setItem('demo_current_user', JSON.stringify(userWithoutPwd));
    triggerListeners(userWithoutPwd);
    return userWithoutPwd;
  }

  const cred = await signInWithEmailAndPassword(auth!, email, password);
  return cred.user;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  if (IS_DEMO) {
    await AsyncStorage.removeItem('demo_current_user');
    triggerListeners(null);
    return;
  }
  await fbSignOut(auth!);
};

/**
 * Send password reset email (also used for forgot PIN → re-auth)
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (IS_DEMO) {
    return;
  }
  await sendPasswordResetEmail(auth!, email);
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string) => {
  if (IS_DEMO) {
    const profileStr = await AsyncStorage.getItem(`demo_profile_${uid}`);
    return profileStr ? JSON.parse(profileStr) : null;
  }
  const snap = await getDoc(doc(db!, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

const prefillDemoUsers = async () => {
  const usersStr = await AsyncStorage.getItem('demo_users');
  if (!usersStr) {
    const defaultUsers = {
      'ankushroy.dev@gmail.com': {
        uid: 'demo_user_default',
        email: 'ankushroy.dev@gmail.com',
        displayName: 'Ankush Roy',
        password: 'password'
      }
    };
    await AsyncStorage.setItem('demo_users', JSON.stringify(defaultUsers));

    const profile = {
      uid: 'demo_user_default',
      email: 'ankushroy.dev@gmail.com',
      displayName: 'Ankush Roy',
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('demo_profile_demo_user_default', JSON.stringify(profile));
  }
};

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export const onAuthChange = (callback: (user: any | null) => void) => {
  if (IS_DEMO) {
    listeners.push(callback);
    prefillDemoUsers().then(() => {
      AsyncStorage.getItem('demo_current_user').then((userStr) => {
        if (userStr) {
          const u = JSON.parse(userStr);
          currentDemoUser = u;
          callback(u);
        } else {
          callback(null);
        }
      });
    });
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }
  return onAuthStateChanged(auth!, callback);
};
