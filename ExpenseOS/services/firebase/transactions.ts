// services/firebase/transactions.ts
// Firestore CRUD for transactions (with local Offline Demo mode fallback)
// See BUILDPLAN.md for full context

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, IS_DEMO } from '../../firebase.config';
import { Transaction } from '../../store/transactionStore';

// --- Demo Mode Listeners ---
const txListeners: { [uid: string]: Array<(txs: Transaction[]) => void> } = {};

const triggerTxListeners = (uid: string, txs: Transaction[]) => {
  // Sort descending by date, similar to Firestore query
  const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (txListeners[uid]) {
    txListeners[uid].forEach(cb => cb(sorted));
  }
};

const txCollection = (uid: string) =>
  collection(db!, 'users', uid, 'transactions');

/**
 * Add a new transaction
 */
export const addTransaction = async (
  uid: string,
  tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (IS_DEMO) {
    const txsStr = await AsyncStorage.getItem(`demo_transactions_${uid}`) || '[]';
    const txs = JSON.parse(txsStr);
    const id = 'demo_tx_' + Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = {
      ...tx,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Transaction;
    txs.push(newTx);
    await AsyncStorage.setItem(`demo_transactions_${uid}`, JSON.stringify(txs));
    triggerTxListeners(uid, txs);
    return id;
  }

  const ref = await addDoc(txCollection(uid), {
    ...tx,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  uid: string,
  txId: string,
  updates: Partial<Transaction>
): Promise<void> => {
  if (IS_DEMO) {
    const txsStr = await AsyncStorage.getItem(`demo_transactions_${uid}`) || '[]';
    let txs = JSON.parse(txsStr);
    txs = txs.map((t: Transaction) =>
      t.id === txId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    await AsyncStorage.setItem(`demo_transactions_${uid}`, JSON.stringify(txs));
    triggerTxListeners(uid, txs);
    return;
  }

  const ref = doc(db!, 'users', uid, 'transactions', txId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  uid: string,
  txId: string
): Promise<void> => {
  if (IS_DEMO) {
    const txsStr = await AsyncStorage.getItem(`demo_transactions_${uid}`) || '[]';
    let txs = JSON.parse(txsStr);
    txs = txs.filter((t: Transaction) => t.id !== txId);
    await AsyncStorage.setItem(`demo_transactions_${uid}`, JSON.stringify(txs));
    triggerTxListeners(uid, txs);
    return;
  }

  await deleteDoc(doc(db!, 'users', uid, 'transactions', txId));
};

/**
 * Fetch all transactions for a user
 */
export const fetchTransactions = async (uid: string): Promise<Transaction[]> => {
  if (IS_DEMO) {
    const txsStr = await AsyncStorage.getItem(`demo_transactions_${uid}`) || '[]';
    const txs = JSON.parse(txsStr);
    return [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const q = query(txCollection(uid), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: (d.data().date as Timestamp)?.toDate?.()?.toISOString() ?? d.data().date,
    createdAt: (d.data().createdAt as Timestamp)?.toDate?.()?.toISOString() ?? '',
    updatedAt: (d.data().updatedAt as Timestamp)?.toDate?.()?.toISOString() ?? '',
  } as Transaction));
};

/**
 * Real-time listener for transactions
 */
export const subscribeToTransactions = (
  uid: string,
  onData: (txs: Transaction[]) => void
) => {
  if (IS_DEMO) {
    if (!txListeners[uid]) txListeners[uid] = [];
    txListeners[uid].push(onData);

    AsyncStorage.getItem(`demo_transactions_${uid}`).then((txsStr) => {
      const txs = JSON.parse(txsStr || '[]');
      const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(sorted);
    });

    return () => {
      const idx = txListeners[uid].indexOf(onData);
      if (idx !== -1) txListeners[uid].splice(idx, 1);
    };
  }

  const q = query(txCollection(uid), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      date: (d.data().date as Timestamp)?.toDate?.()?.toISOString() ?? d.data().date,
      createdAt: (d.data().createdAt as Timestamp)?.toDate?.()?.toISOString() ?? '',
      updatedAt: (d.data().updatedAt as Timestamp)?.toDate?.()?.toISOString() ?? '',
    } as Transaction));
    onData(txs);
  });
};
