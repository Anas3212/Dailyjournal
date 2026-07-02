import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { 
  cookieLogin, 
  cookieRegister, 
  cookieLogout, 
  initializeAuth, 
  getCurrentUserFromStorage,
  clearUserFromStorage 
} from '../services/cookieApi';

// Create Auth Context
const CookieAuthContext = createContext();

/**
 * Cookie Authentication Provider Component
 * Provides authentication state and methods to the entire app
 */
export const CookieAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize authentication on app startup
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // First check localStorage for existing user data
        const storedUser = getCurrentUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
        }
        
        // Then validate with server
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

    if (!initialized) {
      initialize();
    }
  }, [initialized]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await cookieLogin(email, password);
      
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
      const response = await cookieRegister(name, email, password);
      
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
      await cookieLogout();
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

  const value = {
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

  return (
    <CookieAuthContext.Provider value={value}>
      {children}
    </CookieAuthContext.Provider>
  );
};

/**
 * Hook to use cookie-based authentication
 */
export const useCookieAuth = () => {
  const context = useContext(CookieAuthContext);
  
  if (!context) {
    throw new Error('useCookieAuth must be used within a CookieAuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for protecting routes
 */
export const withCookieAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useCookieAuth();
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      );
    }
    
    if (!isAuthenticated()) {
      // Redirect to login or show login component
      window.location.href = '/login';
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
};

/**
 * Hook for managing authentication state in components
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState({
    user: getCurrentUserFromStorage(),
    loading: false,
    error: null,
  });

  const login = async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await cookieLogin(email, password);
      
      if (response.data.success) {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthState({
          user: userData,
          loading: false,
          error: null,
        });
        return { success: true, user: userData };
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Login failed' 
      }));
      return { success: false, error: 'Login failed' };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await cookieRegister(name, email, password);
      
      if (response.data.success) {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthState({
          user: userData,
          loading: false,
          error: null,
        });
        return { success: true, user: userData };
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Registration failed' 
      }));
      return { success: false, error: 'Registration failed' };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await cookieLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearUserFromStorage();
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    isAuthenticated: () => authState.user !== null,
    isAdmin: () => authState.user?.isAdmin === true,
  };
};

export default useCookieAuth;
