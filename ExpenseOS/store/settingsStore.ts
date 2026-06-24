// store/settingsStore.ts
// Zustand store for local app settings and user preferences

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  showCelebrations: boolean;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  setShowCelebrations: (show: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  showCelebrations: true,
  isLoading: true,

  loadSettings: async () => {
    try {
      const val = await AsyncStorage.getItem('settings_show_celebrations');
      if (val !== null) {
        set({ showCelebrations: val === 'true', isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      set({ isLoading: false });
    }
  },

  setShowCelebrations: async (show) => {
    try {
      await AsyncStorage.setItem('settings_show_celebrations', show ? 'true' : 'false');
      set({ showCelebrations: show });
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },
}));
