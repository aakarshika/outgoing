import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { authApi, User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = (shouldRemoveToken = true) => {
    if (shouldRemoveToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    }
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
        } catch (error) {
          console.error('Auth check failed', error);
          clearAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem('token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
