import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

export interface User {
  name?: string;
  email?: string;
  userId?: string;
  admin?: boolean;
  tenantId?: string;
  external?: boolean;
  trialDaysLeft?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, loginType?: 'admin' | 'tenant', tenantId?: string) => Promise<boolean>;
  externalLogin: (token: string, secret?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const userData: User = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (
    email: string,
    password: string,
    loginType: 'admin' | 'tenant' = 'admin',
    tenantId?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType, tenantId }),
      });
      if (res.ok) {
        await res.json();
        // Refresh user data from the server
        const userRes = await fetch('/api/auth/user');
        if (userRes.ok) {
          const userData: User = await userRes.json();
          setUser(userData);
        }
        return true;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const externalLogin = async (token: string, secret?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/external-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
      });
      if (res.ok) {
        // Refresh user data from the server
        const userRes = await fetch('/api/auth/user');
        if (userRes.ok) {
          const userData: User = await userRes.json();
          setUser(userData);
        }
        return true;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'External login failed');
      }
    } catch (error) {
      console.error('External login failed', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('admin_tenant_context');
    // Clear the auth cookie by calling logout endpoint
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.push('/login');
    });
  };

  const value: AuthContextType = {
    user,
    login,
    externalLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
