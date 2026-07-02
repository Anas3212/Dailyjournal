import { useState, useEffect, useCallback } from 'react';
import { 
  initializeAuth, 
  getCurrentUserFromStorage, 
  clearUserFromStorage,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout
} from '../services/api';

/**
 * Authentication hook for cookie-based authentication
 * Replaces localStorage token management with secure HttpOnly cookies
 */
export const useAuth = () => {
  const [user, setUser] = useState(getCurrentUserFromStorage());
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize authentication on app startup
  useEffect(() => {
    const initialize = async () => {
      if (initialized) return;
      
      try {
        setLoading(true);
        
        // First check localStorage for existing user data
        const storedUser = getCurrentUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
        }
        
        // Then validate with server using cookies
        const authenticatedUser = await initializeAuth();
        setUser(authenticatedUser);
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
        clearUserFromStorage();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initialize();
  }, [initialized]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await apiLogin(email, password);
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (name, email, password) => {
    try {
      setLoading(true);
      const response = await apiRegister(name, email, password);
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      clearUserFromStorage();
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.isAdmin === true;
  }, [user]);

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  return {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    updateUser,
  };
};

export default useAuth;
