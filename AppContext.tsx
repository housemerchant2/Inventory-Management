import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Brand, Item, Transaction, Role } from '../types';
import { mockUsers, mockBrands, mockItems, mockTransactions } from '../data/mockData';

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [users] = useState<User[]>(mockUsers);
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineQueueCount(0);
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
    const user = mockUsers.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const approveBrand = useCallback((brandId: string) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, status: 'active' as const } : b));
  }, []);

  const requestBrand = useCallback((name: string) => {
    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      name,
      status: 'pending',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      assignedStaff: [],
    };
    setBrands(prev => [...prev, newBrand]);
  }, [currentUser.id]);

  const assignStaffToBrand = useCallback((brandId: string, staffIds: string[]) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, assignedStaff: staffIds } : b));
  }, []);

  const addItem = useCallback((item: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
      synced: isOnline,
    };
    setTransactions(prev => [...prev, newTx]);
    setItems(prev => prev.map(item => {
      if (item.id === tx.itemId) {
        const qty = tx.type === 'IN' ? tx.quantity : tx.type === 'OUT' ? -tx.quantity : tx.quantity;
        return { ...item, currentStock: item.currentStock + qty };
      }
      return item;
    }));
    if (!isOnline) {
      setOfflineQueueCount(prev => prev + 1);
    }
  }, [isOnline]);

  const getItemsByBrand = useCallback((brandId: string) => {
    return items.filter(i => i.brandId === brandId);
  }, [items]);

  const getBrandsForUser = useCallback(() => {
    if (currentUser.role === 'manager') {
      return brands;
    }
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
