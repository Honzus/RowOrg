import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getMe, logout as apiLogout } from '../api/auth';
import type { User } from '../types';
import { UserContext } from './userContext';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!localStorage.getItem('access_token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return <UserContext.Provider value={{ user, loading, reload, setUser, logout }}>{children}</UserContext.Provider>;
}
