// app/index.tsx
// Entry point — redirects based on auth + PIN state
// See BUILDPLAN.md for full context

import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { isAuthenticated, isPinVerified, hasPin } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!hasPin) {
    // New user — needs to set a PIN
    return <Redirect href="/(auth)/pin" />;
  }

  if (!isPinVerified) {
    // Returning user — needs to enter PIN
    return <Redirect href="/(auth)/pin" />;
  }

  // All good — go to dashboard
  return <Redirect href="/(tabs)/home" />;
}
