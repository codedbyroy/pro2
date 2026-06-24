# ExpenseOS — Master Build Context
> **ANY MODEL: Read this file first before touching any code.**
> This is the single source of truth. Update the STATUS section as you complete steps.

---

## Project Overview
**App Name**: ExpenseOS  
**Type**: Mobile app (iOS + Android) built with Expo + React Native  
**Purpose**: Personal expense manager with PIN auth, Firebase cloud sync, animated UI  
**Currency**: INR (₹)  
**User**: Single user per account, multi-device sync via Firebase  

---

## Tech Stack
| Layer | Package | Version |
|-------|---------|---------|
| Framework | Expo | SDK 51 |
| Language | TypeScript | latest |
| Navigation | expo-router | v3 (file-based) |
| Animations | react-native-reanimated + moti | latest |
| State | zustand | latest |
| Local Storage | @react-native-async-storage/async-storage | latest |
| Cloud | Firebase (Auth + Firestore) | latest |
| Charts | react-native-gifted-charts | latest |
| Icons | @expo/vector-icons (Ionicons) | latest |
| PIN Security | expo-secure-store | latest |
| Notifications | expo-notifications | latest |

---

## Design System (constants/theme.ts)
```
Background:  #0A0A0F  (near-black)
Surface:     #13131A  (card bg)
Primary:     #6C63FF  (purple accent)
Success:     #00D97E  (income green)
Danger:      #FF4D4D  (expense red)
Warning:     #FFB800  (savings amber)
Text:        #FFFFFF / #A0A0B0 (secondary)
Font:        System default (SF Pro / Roboto)
Border Radius: 16px cards, 12px buttons
Animations: 300ms spring, scale 0.96 on press
```

---

## Feature Requirements
### Functional
1. PIN login on every app open (4-digit PIN stored in SecureStore)
2. Individual User ID + Password (Firebase Auth)
3. Add Income / Pocket Money (positive transactions)
4. Add Expenses (negative transactions)
5. Track: Daily / Weekly / Monthly views
6. Quick-add expense (tap FAB → bottom sheet → 2 taps done)
7. Sections: Income | Saving | Expense
8. Customizable sub-categories per section (add/edit/delete)
9. Budget limits per category (alerts when near limit)
10. Recurring transactions (auto-add monthly)
11. Search & filter transactions
12. Edit / Delete transactions
13. Export data (CSV/PDF)
14. Push notifications (budget alerts, daily reminders)
15. Savings Goals tracker
16. Notes/Tags on transactions
17. Profile settings (PIN change, currency display, name)
18. Onboarding flow (first launch)
19. Forgot PIN flow (re-auth with password)

### Non-Functional
- Performance: <2s load, 60fps animations
- Offline-first: queue writes, sync on reconnect
- Security: SecureStore for PIN, Firebase Auth tokens
- Scalability: Firestore pagination for 1000s of transactions
- Accessibility: min 44px touch targets, WCAG AA contrast
- Responsive: works on all iOS/Android screen sizes

---

## File Structure
```
ExpenseOS/
├── BUILDPLAN.md                    ← YOU ARE HERE
├── app.json                        ← Expo config (update main to expo-router)
├── package.json
├── firebase.config.js              ← Firebase init (user fills API keys)
├── babel.config.js                 ← Add reanimated plugin
├── app/
│   ├── _layout.tsx                 ← Root layout + auth gate
│   ├── index.tsx                   ← Redirect to /home or /auth
│   ├── (auth)/
│   │   ├── _layout.tsx             ← Auth stack layout
│   │   ├── welcome.tsx             ← Onboarding / splash
│   │   ├── login.tsx               ← Email + password
│   │   ├── register.tsx            ← Sign up
│   │   └── pin.tsx                 ← PIN set / verify
│   ├── (tabs)/
│   │   ├── _layout.tsx             ← Bottom tab bar
│   │   ├── home.tsx                ← Dashboard (balance, recent)
│   │   ├── add.tsx                 ← Add transaction
│   │   ├── history.tsx             ← All transactions + search
│   │   ├── charts.tsx              ← Analytics + charts
│   │   └── settings.tsx            ← Profile + settings
│   └── (modals)/
│       ├── category-manager.tsx    ← Add/edit/delete categories
│       ├── budget-limit.tsx        ← Set budget per category
│       └── savings-goal.tsx        ← Create/edit savings goal
├── components/
│   ├── ui/
│   │   ├── AnimatedButton.tsx      ← Scale-press animated button
│   │   ├── Card.tsx                ← Glassmorphism card
│   │   ├── PinDot.tsx              ← PIN dot indicator with animation
│   │   ├── BalanceDisplay.tsx      ← Animated number counter
│   │   ├── TabBarIcon.tsx          ← Animated tab bar icon
│   │   └── EmptyState.tsx          ← Empty list illustration
│   ├── charts/
│   │   ├── SpendingBarChart.tsx    ← Bar chart (daily/weekly/monthly)
│   │   └── CategoryPieChart.tsx    ← Pie chart for category breakdown
│   └── transaction/
│       ├── TransactionCard.tsx     ← Individual transaction row
│       ├── TransactionList.tsx     ← FlatList of transactions
│       └── QuickAdd.tsx            ← FAB + bottom sheet
├── store/
│   ├── authStore.ts                ← User, isAuthenticated, isPinVerified
│   ├── transactionStore.ts         ← Transactions CRUD + totals
│   └── categoryStore.ts            ← Categories per section
├── services/
│   ├── firebase/
│   │   ├── auth.ts                 ← signIn, signUp, signOut
│   │   ├── transactions.ts         ← Firestore CRUD for transactions
│   │   └── categories.ts           ← Firestore CRUD for categories
│   └── pin.ts                      ← setPin, verifyPin (SecureStore)
├── hooks/
│   ├── useTransactions.ts          ← Filtered transactions by period
│   ├── useCategories.ts            ← Categories with custom ones
│   └── useBalance.ts               ← Real-time balance calc
├── constants/
│   ├── theme.ts                    ← Colors, spacing, typography
│   └── defaultCategories.ts        ← Default income/saving/expense cats
└── utils/
    ├── currency.ts                 ← formatINR(amount) → ₹1,00,000
    ├── date.ts                     ← startOfDay/Week/Month helpers
    └── calculations.ts             ← balance, savings rate math
```

---

## BUILD STATUS — Update This As You Complete Steps

### Step 1: Project Setup + Navigation Skeleton ✅ COMPLETE
- [x] Expo project created (`create-expo-app --template blank-typescript`)
- [x] Dependencies installed (all packages including gesture-handler)
- [x] app.json updated (expo-router, dark mode, scheme, plugins)
- [x] package.json main → expo-router/entry
- [x] babel.config.js created (reanimated plugin last)
- [x] constants/theme.ts created (colors, spacing, typography, animation)
- [x] constants/defaultCategories.ts created (Income × 6, Saving × 5, Expense × 10)
- [x] utils/currency.ts created (formatINR, formatINRCompact, parseAmount)
- [x] utils/date.ts created (startOfDay/Week/Month, formatDate, getPeriodStart)
- [x] utils/calculations.ts created (balance, totals, savingsRate, groupByCategory)
- [x] firebase.config.js created (template — user fills keys)
- [x] store/authStore.ts created (user, isAuthenticated, isPinVerified)
- [x] store/transactionStore.ts created (transactions CRUD + state)
- [x] store/categoryStore.ts created (categories with custom support)
- [x] services/pin.ts created (setPin, verifyPin, hasPin, clearPin via SecureStore)
- [x] services/firebase/auth.ts created (signUp, signIn, signOut, resetPassword, onAuthChange)
- [x] services/firebase/transactions.ts created (CRUD + real-time listener)
- [x] app/_layout.tsx created (root layout + auth gate)
- [x] app/index.tsx created (redirect based on auth/PIN state)
- [x] app/(auth)/_layout.tsx created (auth stack)
- [x] app/(auth)/welcome.tsx created (animated onboarding screen)
- [x] app/(auth)/login.tsx created (email + password login)
- [x] app/(auth)/register.tsx created (sign up with name)
- [x] app/(auth)/pin.tsx created (set + verify PIN, shake animation, lockout)
- [x] app/(tabs)/_layout.tsx created (tab bar with glowing add button)
- [x] app/(tabs)/home.tsx created (balance placeholder)
- [x] app/(tabs)/add.tsx created (basic add transaction, functional)
- [x] app/(tabs)/history.tsx created (live transaction list)
- [x] app/(tabs)/charts.tsx created (placeholder)
- [x] app/(tabs)/settings.tsx created (profile + sign out functional)
- [x] components/ui/AnimatedButton.tsx created (spring scale-press, variants)
- [x] components/ui/Card.tsx created (glassmorphism, semantic variants)
- [x] TypeScript: 0 errors ✅

### Step 2: Firebase Auth (login/register/PIN) — ✅ COMPLETE (with local Offline fallback)
### Step 3: Dashboard / Home Screen — ✅ COMPLETE
### Step 4: Add Transaction Screen — ✅ COMPLETE
### Step 5: Category Management — ✅ COMPLETE
### Step 6: Transaction History + Search — ✅ COMPLETE
### Step 7: Charts + Analytics — ✅ COMPLETE
### Step 8: Budget Limits + Notifications — ✅ COMPLETE
### Step 9: Savings Goals — ✅ COMPLETE
### Step 10: Settings + Export — TODO

---

## Firebase Setup (User Action Required)
After receiving firebase.config.js:
1. Go to https://console.firebase.google.com
2. Create project → "ExpenseOS"
3. Enable Authentication → Email/Password
4. Create Firestore Database → Start in test mode
5. Add Android + iOS apps
6. Copy config object into firebase.config.js

### Firestore Collections Structure
```
users/{uid}/
  profile: { name, email, currency: "INR", createdAt }
  
users/{uid}/transactions/{txId}/
  { type: "income"|"expense"|"saving", 
    amount: number, category: string, 
    subcategory: string, note: string,
    date: Timestamp, isRecurring: boolean }

users/{uid}/categories/
  income: [{ id, name, icon, color }]
  expense: [{ id, name, icon, color }]
  saving: [{ id, name, icon, color }]

users/{uid}/budgets/{categoryId}/
  { limit: number, period: "monthly"|"weekly" }

users/{uid}/goals/{goalId}/
  { name, target: number, current: number, deadline: Timestamp, icon }
```

---

## How to Continue (New Session Instructions)
1. Read this entire file first
2. Check BUILD STATUS above — find first unchecked item
3. Continue from there — all design decisions are documented above
4. Update BUILD STATUS checkboxes as you complete items
5. Do NOT change the design system (theme.ts) unless user explicitly asks
