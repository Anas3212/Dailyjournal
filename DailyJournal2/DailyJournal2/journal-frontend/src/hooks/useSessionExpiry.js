import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook for monitoring session expiry and handling automatic logout
 * Monitors response headers for session expiry indicators
 */
const useSessionExpiry = () => {
  const { logout } = useContext(AuthContext);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(null);

  // Monitor response headers for session information
  const monitorSessionHeaders = useCallback((response) => {
    if (!response || !response.headers) return;

    const sessionExpired = response.headers.get('X-Session-Expired');
    const sessionValid = response.headers.get('X-Session-Valid');
    const sessionExpiresStr = response.headers.get('X-Session-Expires');

    if (sessionExpired === 'true') {
      console.warn('Session expired detected from server');
      handleSessionExpired();
      return;
    }

    if (sessionValid === 'true' && sessionExpiresStr) {
      try {
        const expiryTime = new Date(sessionExpiresStr);
        setSessionExpiry(expiryTime);
        
        // Calculate time until expiry
        const now = new Date();
        const timeLeft = expiryTime.getTime() - now.getTime();
        setTimeUntilExpiry(timeLeft);

        // Show warning if less than 10 minutes remaining
        const tenMinutes = 10 * 60 * 1000;
        if (timeLeft > 0 && timeLeft <= tenMinutes) {
          setSessionWarning(true);
        } else {
          setSessionWarning(false);
        }
      } catch (error) {
        console.error('Error parsing session expiry time:', error);
      }
    }
  }, []);

  // Handle session expiry
  const handleSessionExpired = useCallback(() => {
    setSessionExpiry(null);
    setSessionWarning(false);
    setTimeUntilExpiry(null);
    
    // Show user-friendly message and logout
    console.log('Session expired - logging out user');
    logout();
  }, [logout]);

  // Timer to update time until expiry
  useEffect(() => {
    if (!sessionExpiry) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeLeft = sessionExpiry.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        handleSessionExpired();
        return;
      }
      
      setTimeUntilExpiry(timeLeft);
      
      // Show warning if less than 10 minutes remaining
      const tenMinutes = 10 * 60 * 1000;
      if (timeLeft <= tenMinutes) {
        setSessionWarning(true);
      } else {
        setSessionWarning(false);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sessionExpiry, handleSessionExpired]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return '0 minutes';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${minutes} minutes`;
    }
  }, []);

  // Extend session using API
  const extendSession = useCallback(async () => {
    try {
      const { extendCurrentSession } = await import('../services/api');
      console.log('Extending session...');
      
      const response = await extendCurrentSession(8); // Extend by 8 hours
      
      if (response.data.success) {
        console.log('Session extended successfully');
        // Clear warning and update expiry time
        setSessionWarning(false);
        
        // Update session expiry to new time (8 hours from now)
        const newExpiry = new Date(Date.now() + (8 * 60 * 60 * 1000));
        setSessionExpiry(newExpiry);
        setTimeUntilExpiry(8 * 60 * 60 * 1000);
        
        return true;
      } else {
        console.error('Failed to extend session:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }, []);

  return {
    sessionExpiry,
    sessionWarning,
    timeUntilExpiry,
    timeUntilExpiryFormatted: timeUntilExpiry ? formatTimeRemaining(timeUntilExpiry) : null,
    monitorSessionHeaders,
    extendSession,
    handleSessionExpired
  };
};

export default useSessionExpiry;
