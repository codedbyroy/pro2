// app/_layout.tsx
// Root layout — handles auth gating and navigation root
// Logic: 
//   Not authenticated → send to (auth)/welcome
//   Authenticated, no PIN set → send to (auth)/pin (set mode)
//   Authenticated, PIN not verified → send to (auth)/pin (verify mode)
//   Authenticated + PIN verified → show (tabs)
// See BUILDPLAN.md for full context

import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useBudgetStore } from '../store/budgetStore';
import { useGoalStore } from '../store/goalStore';
import { useSettingsStore } from '../store/settingsStore';
import { onAuthChange } from '../services/firebase/auth';
import { subscribeToTransactions } from '../services/firebase/transactions';
import { hasPin as checkHasPin } from '../services/pin';
import { Colors } from '../constants/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPinVerified, hasPin, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';

    if (!isAuthenticated) {
      // Redirect to welcome if they are not in the auth group
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else {
      // User is authenticated
      if (!hasPin) {
        // Must set a PIN - redirect to PIN screen if not already there
        if (segs[1] !== 'pin') {
          router.replace('/(auth)/pin');
        }
      } else if (!isPinVerified) {
        // Must verify PIN - redirect to PIN screen if not already there
        if (segs[1] !== 'pin') {
          router.replace('/(auth)/pin');
        }
      } else {
        // Fully authenticated and PIN verified - redirect to home if in auth group
        if (inAuthGroup || segs.length === 0 || segs[0] === 'index') {
          router.replace('/(tabs)/home');
        }
      }
    }
  }, [isAuthenticated, hasPin, isPinVerified, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { setUser, setLoading, setHasPin, isLoading, isAuthenticated, user } = useAuthStore();
  const { setTransactions, setLoading: setTxLoading } = useTransactionStore();
  const { loadBudgets, clearAll: clearBudgets } = useBudgetStore();
  const { loadGoals, clearAll: clearGoals } = useGoalStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setUser({ uid: user.uid, email: user.email!, displayName: user.displayName ?? undefined });
        const pinExists = await checkHasPin();
        setHasPin(pinExists);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTransactions([]);
      clearBudgets();
      clearGoals();
      return;
    }

    setTxLoading(true);
    const unsubscribe = subscribeToTransactions(user.uid, (txs) => {
      setTransactions(txs);
      setTxLoading(false);
    });

    // Load user budgets and goals
    loadBudgets(user.uid);
    loadGoals(user.uid);

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user?.uid]);

  if (isLoading) return null; // SplashScreen handles this

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(modals)/category-manager"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="(modals)/budget-limit"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="(modals)/savings-goal"
              options={{ presentation: 'modal' }}
            />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
