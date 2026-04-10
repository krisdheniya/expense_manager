import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Group {
  id: string;
  name: string;
  balance: number;
  youOwe: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // user id or "You"
  date: string;
}

interface AppContextType {
  groups: Group[];
  /* Functions you will later replace with API calls */
  addGroup: (name: string) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  settleUp: (groupId: string, amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mock Data
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'Goa Trip 🏖️', balance: 1450, youOwe: false },
    { id: '2', name: 'Pune Flatmates 🏠', balance: -450, youOwe: true },
    { id: '3', name: 'Dinner & Drinks 🍕', balance: 0, youOwe: false },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'e1', groupId: '1', description: 'Flight Tickets', amount: 5000, paidBy: 'You', date: '2026-04-01' },
    { id: 'e2', groupId: '1', description: 'Hotel Booking', amount: 8000, paidBy: 'Rohan', date: '2026-04-02' }
  ]);

  const addGroup = (name: string) => {
    // In the future: const res = await API.post('/groups', { name })
    const newGroup: Group = {
      id: Math.random().toString(),
      name,
      balance: 0,
      youOwe: false
    };
    setGroups([...groups, newGroup]);
  };

  const addExpense = (expenseInfo: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseInfo,
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses([...expenses, newExpense]);
    
    // Update group balance natively as a mockup
    setGroups(groups.map(g => {
      if (g.id === expenseInfo.groupId) {
        // Just mock toggling balance for demo
        const balanceChange = expenseInfo.paidBy === 'You' ? expenseInfo.amount / 2 : -(expenseInfo.amount / 2);
        return { ...g, balance: g.balance + balanceChange, youOwe: (g.balance + balanceChange) < 0 };
      }
      return g;
    }));
  };

  const settleUp = (groupId: string, amount: number) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, balance: 0, youOwe: false };
      }
      return g;
    }));
  };

  return (
    <AppContext.Provider value={{ groups, addGroup, expenses, addExpense, settleUp }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
