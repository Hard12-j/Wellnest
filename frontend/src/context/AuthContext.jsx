import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/authApi';
import { clearAccessToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true while checking session

  // Attempt to restore session on mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        // Try to refresh using the HTTP-only cookie
        const authData = await authApi.refreshToken();
        if (mounted && authData?.user) {
          setUser(authData.user);
          setIsAuthenticated(true);
        }
      } catch {
        // No valid session — that's fine
        if (mounted) {
          clearAccessToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const loginUser = useCallback(async ({ username, password }) => {
    const data = await authApi.login({ username, password });
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      clearAccessToken();
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const userData = await authApi.getCurrentUser();
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginUser,
    logoutUser,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
