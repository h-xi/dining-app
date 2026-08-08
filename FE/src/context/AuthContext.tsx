import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, setTokens } from '../api/client';
import type { AuthUser } from '../api/types';

type AuthResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  clearError: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const body = e.body;
    if (body && typeof body === 'object') {
      const firstValue = Object.values(body as Record<string, unknown>)[0];
      if (Array.isArray(firstValue)) return String(firstValue[0]);
      if (typeof firstValue === 'string') return firstValue;
    }
    if (typeof body === 'string') return body;
  }
  return e instanceof Error ? e.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      async login(email, password) {
        setLoading(true);
        setError(null);
        try {
          const res = await api.post<AuthResponse>('/auth/login/', { email, password });
          setTokens({ access: res.access, refresh: res.refresh });
          setUser(res.user);
        } catch (e) {
          setTokens(null);
          setError(extractErrorMessage(e, 'Login failed'));
          throw e;
        } finally {
          setLoading(false);
        }
      },
      async register(email, password, firstName, lastName) {
        setLoading(true);
        setError(null);
        try {
          const res = await api.post<AuthResponse>('/auth/register/', {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
          });
          setTokens({ access: res.access, refresh: res.refresh });
          setUser(res.user);
        } catch (e) {
          setTokens(null);
          setError(extractErrorMessage(e, 'Registration failed'));
          throw e;
        } finally {
          setLoading(false);
        }
      },
      clearError() {
        setError(null);
      },
      logout() {
        setTokens(null);
        setUser(null);
      },
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
