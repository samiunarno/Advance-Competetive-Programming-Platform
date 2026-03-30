import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  is_banned: boolean;
  ban_reason?: string;
  bio?: string;
  avatar?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Poll for auth status every 10 seconds to catch bans in real-time
    const interval = setInterval(checkAuth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.auth.me();
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else if (res.status === 403) {
        // Handle banned user state
        const errorData = await res.json();
        if (errorData.is_banned) {
           // We need to fetch the user profile anyway to show the ban screen with details
           // But the /me endpoint failed. 
           // Actually, if the middleware blocks /me with 403, we can't get the user object easily.
           // Let's rely on the error data returning the ban reason.
           // We might need to keep the user object but mark it as banned.
           setUser(prev => prev ? { ...prev, is_banned: true, ban_reason: errorData.reason } : null);
        } else {
           setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error or server is down. Check if the backend is running on port 3000.');
      }
      // Don't clear user on network error to prevent flashing
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: any) => {
    const res = await api.auth.login(data);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }
    const { user } = await res.json();
    setUser(user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
