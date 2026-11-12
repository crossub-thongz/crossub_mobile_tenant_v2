import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadStoredUser } from '@/src/auth/session';
import { loginWithPassword, logoutRequest } from '@/src/api/auth';
import type { AuthUser } from '@/src/auth/types';

type Status = 'loading' | 'authed' | 'guest';

type AuthApi = {
  status: Status;
  email: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    loadStoredUser()
      .then((stored) => {
        setUser(stored);
        setStatus(stored ? 'authed' : 'guest');
      })
      .catch(() => setStatus('guest'));
  }, []);

  const login = useCallback(async (nextEmail: string, password: string) => {
    if (!nextEmail.trim().includes('@')) throw new Error('Enter a valid email.');
    if (!password) throw new Error('Enter your password.');
    const signedIn = await loginWithPassword(nextEmail, password);
    setUser(signedIn);
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ status, email: user?.email ?? null, user, login, logout }),
    [login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
