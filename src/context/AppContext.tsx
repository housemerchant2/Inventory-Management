import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Brand, Item, Transaction, Role } from '../types';
import { mockUsers, mockBrands, mockItems, mockTransactions } from '../data/mockData';
import { supabase, isSupabaseConfigured, TABLES } from '../lib/supabase';
import { readQueue, enqueueTransaction, flushQueue } from '../lib/offlineQueue';

interface AppState {
  currentUser: User;
  users: User[];
  brands: Brand[];
  items: Item[];
  transactions: Transaction[];
  isOnline: boolean;
  offlineQueueCount: number;
  switchRole: (role: Role) => void;
  approveBrand: (brandId: string) => void;
  requestBrand: (name: string) => void;
  assignStaffToBrand: (brandId: string, staffIds: string[]) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) => void;
  getItemsByBrand: (brandId: string) => Item[];
  getBrandsForUser: () => Brand[];
  getLowStockItems: (brandId?: string) => Item[];
}

const AppContext = createContext<AppState | null>(null);

// Mapping baris Supabase (snake_case) -> tipe aplikasi (camelCase)
function mapUser(r: any): User { return { id: r.id, fullName: r.full_name, role: r.role, avatar: r.avatar ?? undefined }; }
function mapBrand(r: any): Brand { return { id: r.id, name: r.name, status: r.status, createdBy: r.created_by, createdAt: r.created_at, assignedStaff: r.assigned_staff ?? [] }; }
function mapItem(r: any): Item { return { id: r.id, brandId: r.brand_id, sku: r.sku, name: r.name, currentStock: r.current_stock, minStockThreshold: r.min_stock_threshold, costPrice: r.cost_price, sellPrice: r.sell_price, createdAt: r.created_at }; }
function mapTx(r: any): Transaction { return { id: r.id, itemId: r.item_id, userId: r.user_id, type: r.type, quantity: r.quantity, notes: r.notes ?? '', createdAt: r.created_at, synced: true }; }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => readQueue().length);

  // Load data awal dari Supabase bila kredensial tersedia
  useEffect(() => {
    if (!supabase) return; // mode demo: tetap pakai mockData
    (async () => {
      const [u, b, i, t] = await Promise.all([
        supabase.from(TABLES.users).select('*'),
        supabase.from(TABLES.brands).select('*'),
        supabase.from(TABLES.items).select('*'),
        supabase.from(TABLES.transactions).select('*').order('created_at', { ascending: false }),
      ]);
      if (!u.error && u.data?.length) {
        const us = u.data.map(mapUser);
        setUsers(us);
        setCurrentUser(us.find(x => x.role === 'manager') ?? us[0]);
      }
      if (!b.error && b.data) setBrands(b.data.map(mapBrand));
      if (!i.error && i.data) setItems(i.data.map(mapItem));
      if (!t.error && t.data) setTransactions(t.data.map(mapTx));
    })();
  }, []);

  // Deteksi online/offline + auto-sync antrean saat kembali online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await flushQueue();
      setOfflineQueueCount(readQueue().length);
      if (synced > 0 && supabase) {
        // refresh transaksi & stok setelah sync
        const [t, i] = await Promise.all([
          supabase.from(TABLES.transactions).select('*').order('created_at', { ascending: false }),
          supabase.from(TABLES.items).select('*'),
        ]);
        if (!t.error && t.data) setTransactions(t.data.map(mapTx));
        if (!i.error && i.data) setItems(i.data.map(mapItem));
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchRole = useCallback((role: Role) => {
    const user = users.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, [users]);

  const approveBrand = useCallback((brandId: string) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, status: 'active' as const } : b));
    if (supabase) supabase.from(TABLES.brands).update({ status: 'active' }).eq('id', brandId);
  }, []);

  const requestBrand = useCallback((name: string) => {
    const newBrand: Brand = {
      id: crypto.randomUUID(),
      name,
      status: 'pending',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      assignedStaff: [],
    };
    setBrands(prev => [...prev, newBrand]);
    if (supabase && isSupabaseConfigured) {
      supabase.from(TABLES.brands).insert({
        id: newBrand.id, name: newBrand.name, status: newBrand.status,
        created_by: newBrand.createdBy, created_at: newBrand.createdAt, assigned_staff: [],
      });
    }
  }, [currentUser.id]);

  const assignStaffToBrand = useCallback((brandId: string, staffIds: string[]) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, assignedStaff: staffIds } : b));
    if (supabase) supabase.from(TABLES.brands).update({ assigned_staff: staffIds }).eq('id', brandId);
  }, []);

  const addItem = useCallback((item: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setItems(prev => [...prev, newItem]);
    if (supabase) {
      supabase.from(TABLES.items).insert({
        id: newItem.id, brand_id: newItem.brandId, sku: newItem.sku, name: newItem.name,
        current_stock: newItem.currentStock, min_stock_threshold: newItem.minStockThreshold,
        cost_price: newItem.costPrice, sell_price: newItem.sellPrice, created_at: newItem.createdAt,
      });
    }
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), createdAt: now, synced: isOnline && isSupabaseConfigured };
    setTransactions(prev => [newTx, ...prev]);
    setItems(prev => prev.map(item => {
      if (item.id === tx.itemId) {
        const qty = tx.type === 'IN' ? tx.quantity : tx.type === 'OUT' ? -tx.quantity : tx.quantity;
        return { ...item, currentStock: item.currentStock + qty };
      }
      return item;
    }));
    if (!isOnline || !isSupabaseConfigured) {
      if (!isOnline) {
        enqueueTransaction(tx); // offline -> simpan di antrean, sync saat online
        setOfflineQueueCount(readQueue().length);
      }
      return;
    }
    if (supabase) {
      supabase.from(TABLES.transactions).insert({
        item_id: tx.itemId, user_id: tx.userId, type: tx.type,
        quantity: tx.quantity, notes: tx.notes, created_at: now,
      });
      const target = items.find(i => i.id === tx.itemId);
      if (target) {
        const qty = tx.type === 'IN' ? tx.quantity : tx.type === 'OUT' ? -tx.quantity : tx.quantity;
        supabase.from(TABLES.items).update({ current_stock: target.currentStock + qty }).eq('id', tx.itemId);
      }
    }
  }, [isOnline, items]);

  const getItemsByBrand = useCallback((brandId: string) => {
    return items.filter(i => i.brandId === brandId);
  }, [items]);

  const getBrandsForUser = useCallback(() => {
    if (currentUser.role === 'manager') return brands;
    return brands.filter(b => b.status === 'active' && b.assignedStaff.includes(currentUser.id));
  }, [currentUser, brands]);

  const getLowStockItems = useCallback((brandId?: string) => {
    let filtered = items.filter(i => i.currentStock <= i.minStockThreshold);
    if (brandId) filtered = filtered.filter(i => i.brandId === brandId);
    if (currentUser.role === 'staff') {
      const userBrands = brands.filter(b => b.assignedStaff.includes(currentUser.id)).map(b => b.id);
      filtered = filtered.filter(i => userBrands.includes(i.brandId));
    }
    return filtered;
  }, [items, currentUser, brands]);

  return (
    <AppContext.Provider value={{
      currentUser, users, brands, items, transactions, isOnline, offlineQueueCount,
      switchRole, approveBrand, requestBrand, assignStaffToBrand,
      addItem, addTransaction, getItemsByBrand, getBrandsForUser, getLowStockItems,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
