import React, { createContext, useState, useEffect } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  initializeAuth,
  getCurrentUserFromStorage,
  clearUserFromStorage 
} from '../services/api';

export const AuthContext = createContext();

/**
 * Cookie-based Authentication Provider
 * Replaces localStorage token management with secure HttpOnly cookies
 */
export function AuthProvider({ children }) {
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

  const login = async (email, password) => {
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
  };

  const register = async (name, email, password) => {
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
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      clearUserFromStorage();
    }
  };

  // Helper functions
  const isAuthenticated = () => user !== null;
  const isAdmin = () => user?.isAdmin === true;
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      initialized,
      login, 
      register, 
      logout,
      isAuthenticated,
      isAdmin,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}