import { supabase, TABLES } from './supabase';
import type { OfflineQueueItem, Transaction } from '../types';

const STORAGE_KEY = 'smart-inventory-offline-queue';

export function readQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineQueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueTransaction(payload: Omit<Transaction, 'id' | 'createdAt' | 'synced'>): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: 'transaction',
    payload,
    timestamp: new Date().toISOString(),
  };
  writeQueue([...readQueue(), item]);
  return item;
}

/** Sinkronkan antrean offline ke Supabase. Return jumlah yang berhasil dikirim. */
export async function flushQueue(): Promise<number> {
  if (!supabase) return 0;
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: OfflineQueueItem[] = [];
  let synced = 0;

  for (const q of queue) {
    const { error } = await supabase.from(TABLES.transactions).insert({
      item_id: q.payload.itemId,
      user_id: q.payload.userId,
      type: q.payload.type,
      quantity: q.payload.quantity,
      notes: q.payload.notes,
      created_at: q.timestamp,
    });
    if (error) remaining.push(q);
    else synced++;
  }

  writeQueue(remaining);
  return synced;
}
