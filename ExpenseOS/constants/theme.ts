// constants/theme.ts
// Design system for ExpenseOS — DO NOT CHANGE without user approval
// See BUILDPLAN.md for full context

export const Colors = {
  // Backgrounds - Soothing midnight slate
  background: '#08090C',
  surface: '#11131A',
  surfaceElevated: '#191B26',
  surfaceBorder: '#232738',

  // Brand (Soothing Amethyst / Orchid - oklch(75% 0.18 300))
  primary: '#C084FC',
  primaryLight: '#E9D5FF',
  primaryDark: '#A855F7',
  primaryGlow: 'rgba(192, 132, 252, 0.12)',

  // Semantic - Softened Slate-Tones
  income: '#10B981',       // Emerald
  incomeLight: 'rgba(16, 185, 129, 0.12)',
  expense: '#F43F5E',      // Coral Rose
  expenseLight: 'rgba(244, 63, 94, 0.12)',
  saving: '#F59E0B',       // Warm Amber
  savingLight: 'rgba(245, 158, 11, 0.12)',

  // Text
  textPrimary: '#F8FAFC',  // Slate 50
  textSecondary: '#94A3B8',// Slate 400
  textMuted: '#64748B',    // Slate 500

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  info: '#3B82F6',

  // Utility
  transparent: 'transparent',
  overlay: 'rgba(5, 5, 8, 0.8)',
  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Typography = {
  // Display
  display: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  // Body
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, fontWeight: '400' as const },
  // Label
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.3 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const Animation = {
  // Durations (ms)
  fast: 150,
  normal: 250,
  slow: 400,
  // Spring config for Reanimated
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
};

export default {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
  Animation,
};
