// firebase.config.js
// Firebase configuration for ExpenseOS
// ─────────────────────────────────────────────────────────────────
// USER ACTION REQUIRED:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project named "ExpenseOS"
// 3. Enable Authentication → Email/Password sign-in method
// 4. Create a Firestore Database → Start in test mode
// 5. Go to Project Settings → General → Add Web App
// 6. Copy the firebaseConfig object and paste below
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';

// 👇 REPLACE THIS WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

export const IS_DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_');

let app, auth, db;
if (!IS_DEMO) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn("Firebase initialization failed, falling back to demo mode:", e);
  }
}

export { auth, db };
export default app;
