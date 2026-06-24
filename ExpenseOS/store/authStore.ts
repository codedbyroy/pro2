// store/authStore.ts
// Zustand store for authentication state
// See BUILDPLAN.md for full context

import { create } from 'zustand';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isPinVerified: boolean;    // true once PIN is entered this session
  isLoading: boolean;
  hasPin: boolean;           // whether user has set a PIN

  // Actions
  setUser: (user: User | null) => void;
  setPinVerified: (verified: boolean) => void;
  setLoading: (loading: boolean) => void;
  setHasPin: (has: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isPinVerified: false,
  isLoading: true,
  hasPin: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setPinVerified: (isPinVerified) => set({ isPinVerified }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasPin: (hasPin) => set({ hasPin }),
  signOut: () => set({
    user: null,
    isAuthenticated: false,
    isPinVerified: false,
    hasPin: false,
  }),
}));
