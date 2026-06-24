// services/pin.ts
// PIN management via expo-secure-store
// PIN is stored ONLY on device — never sent to cloud
// See BUILDPLAN.md for full context

import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'expense_os_pin';

/**
 * Save a 4-digit PIN securely on device
 */
export const setPin = async (pin: string): Promise<void> => {
  await SecureStore.setItemAsync(PIN_KEY, pin);
};

/**
 * Verify entered PIN against stored PIN
 * Returns true if correct
 */
export const verifyPin = async (enteredPin: string): Promise<boolean> => {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === enteredPin;
};

/**
 * Check if a PIN has been set
 */
export const hasPin = async (): Promise<boolean> => {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null;
};

/**
 * Clear PIN (used during account reset / forgot PIN)
 */
export const clearPin = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PIN_KEY);
};
