// app/(auth)/_layout.tsx
// Auth stack layout (welcome, login, register, pin)
// See BUILDPLAN.md for full context

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="pin" />
    </Stack>
  );
}
