'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const data = await api.post<{ accessToken?: string; user?: User; status?: string; message?: string }>('/auth/login', { email, password });
    if (data.status === 'error') return data.message || 'Ошибка входа';
    if (!data.accessToken || !data.user) return 'Ошибка сервера';
    setToken(data.accessToken);
    setUser(data.user as User);
    localStorage.setItem('user', JSON.stringify(data.user));
    return null;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);