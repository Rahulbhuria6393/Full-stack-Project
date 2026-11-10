import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  authApi,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const existingToken = getStoredToken();
      if (!existingToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await authApi.getProfile();
        if (active) {
          setUser(res.user);
        }
      } catch {
        if (active) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isInstructor: user?.role === 'instructor',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
