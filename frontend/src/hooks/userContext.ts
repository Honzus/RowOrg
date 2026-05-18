import { createContext, useContext } from 'react';
import type { User } from '../types';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  reload: () => Promise<void>;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
