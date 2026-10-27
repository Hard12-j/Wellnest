import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/authApi';
import { clearAccessToken, setAuthUserId, setAuthUserRole } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wellnest_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('wellnest_user') || localStorage.getItem('wellnest_user_id'));
  });

  const [isLoading, setIsLoading] = useState(true); // true while checking session

  // Attempt to restore session on mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const storedId = localStorage.getItem('wellnest_user_id');
      const storedUser = localStorage.getItem('wellnest_user');

      // If user is completely logged out (no stored credentials), skip refresh
      if (!storedId && !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Safe deduplicated refresh call
        const authData = await authApi.refreshToken();
        if (authData?.user) {
          if (mounted) {
            setUser(authData.user);
            setIsAuthenticated(true);
          }
          setAuthUserId(authData.user.id);
          setAuthUserRole(authData.user.role);
          localStorage.setItem('wellnest_user', JSON.stringify(authData.user));
        }
      } catch {
        // If refresh fails with 401, session is truly expired
        if (mounted) {
          clearAccessToken();
          setAuthUserId(null);
          setAuthUserRole(null);
          localStorage.removeItem('wellnest_user');
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
    setAuthUserId(data.user?.id);
    setAuthUserRole(data.user?.role);
    if (data.user) {
      localStorage.setItem('wellnest_user', JSON.stringify(data.user));
    }
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
      setAuthUserId(null);
      setAuthUserRole(null);
      localStorage.removeItem('wellnest_user');
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const userData = await authApi.getCurrentUser();
    setUser(userData);
    setAuthUserId(userData?.id);
    setAuthUserRole(userData?.role);
    if (userData) {
      localStorage.setItem('wellnest_user', JSON.stringify(userData));
    }
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
