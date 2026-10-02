import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AUTH_EXPIRED_EVENT, tokenStore } from '../lib/api';
import { authApi } from '../lib/endpoints';
import type { RegisterPayload, Role, User } from '../lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (changes: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homePathFor(role?: Role | null) {
  if (role === 'COMPANY') return '/empresa';
  if (role === 'ADMIN') return '/admin';
  if (role === 'STUDENT') return '/aluno';
  return '/';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'anonymous'));
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStore.clear();
        setUser(null);
        setStatus('anonymous');
      });
  }, []);

  // Token expirado em qualquer requisição → sai da conta.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus('anonymous');
      setSessionExpired(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email.trim(), password);
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
    setSessionExpired(false);
    return result.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
    setSessionExpired(false);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
  }, []);

  const updateUser = useCallback((changes: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...changes } : current));
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionExpired, login, register, logout, refreshUser, updateUser }),
    [user, status, sessionExpired, login, register, logout, refreshUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
