import { useState, useEffect, useCallback, useContext } from 'react';
import { getCurrentSession, extendSession } from '../services/api';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for session monitoring and management
 * Provides real-time session status and automatic extension capabilities
 */
const useSessionMonitor = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    autoExtend = false,
    extendThreshold = 3600000, // 1 hour in milliseconds
    onSessionExpiring,
    onSessionExpired,
    onSessionExtended
  } = options;

  const { user, logout } = useContext(AuthContext);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  /**
   * Fetch current session information
   */
  const fetchSessionInfo = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getCurrentSession();
      const sessionData = response.data;

      if (sessionData.isValid && sessionData.session) {
        setSessionInfo(sessionData.session);
        
        // Check if session is expiring soon
        const expiresAt = new Date(sessionData.session.expiresAt);
        const now = new Date();
        const timeUntilExpiry = expiresAt - now;
        
        const expiringSoon = timeUntilExpiry < extendThreshold;
        setIsExpiringSoon(expiringSoon);

        // Trigger callbacks
        if (expiringSoon && onSessionExpiring) {
          onSessionExpiring(sessionData.session, timeUntilExpiry);
        }

        // Auto-extend if enabled and session is expiring soon
        if (autoExtend && expiringSoon && timeUntilExpiry > 0) {
          await handleExtendSession();
        }

        // Check if session has expired
        if (timeUntilExpiry <= 0 && onSessionExpired) {
          onSessionExpired(sessionData.session);
        }
      } else {
        setSessionInfo(null);
        if (onSessionExpired) {
          onSessionExpired(null);
        }
      }
    } catch (err) {
      console.error('Error fetching session info:', err);
      setError(err.message || 'Failed to fetch session information');
      setSessionInfo(null);
    } finally {
      setLoading(false);
    }
  }, [user, extendThreshold, autoExtend, onSessionExpiring, onSessionExpired]);

  /**
   * Extend current session
   */
  const handleExtendSession = useCallback(async (hours = 8) => {
    if (!sessionInfo) return false;

    try {
      setLoading(true);
      const response = await extendSession(hours);
      
      if (response.data.success) {
        // Refresh session info to get updated expiration time
        await fetchSessionInfo();
        
        if (onSessionExtended) {
          onSessionExtended(sessionInfo, hours);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error extending session:', err);
      setError(err.message || 'Failed to extend session');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionInfo, fetchSessionInfo, onSessionExtended]);

  /**
   * Get time until session expires
   */
  const getTimeUntilExpiry = useCallback(() => {
    if (!sessionInfo?.expiresAt) return null;
    
    const expiresAt = new Date(sessionInfo.expiresAt);
    const now = new Date();
    return Math.max(0, expiresAt - now);
  }, [sessionInfo]);

  /**
   * Format time until expiry for display
   */
  const getFormattedTimeUntilExpiry = useCallback(() => {
    const timeUntilExpiry = getTimeUntilExpiry();
    if (timeUntilExpiry === null) return null;

    const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Less than 1m';
    }
  }, [getTimeUntilExpiry]);

  /**
   * Check if session is valid and active
   */
  const isSessionValid = useCallback(() => {
    if (!sessionInfo) return false;
    
    const timeUntilExpiry = getTimeUntilExpiry();
    return timeUntilExpiry !== null && timeUntilExpiry > 0;
  }, [sessionInfo, getTimeUntilExpiry]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !user) return;

    // Initial fetch
    fetchSessionInfo();

    // Set up interval
    const interval = setInterval(fetchSessionInfo, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchSessionInfo]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchSessionInfo();
  }, [fetchSessionInfo]);

  return {
    sessionInfo,
    loading,
    error,
    isExpiringSoon,
    isSessionValid: isSessionValid(),
    timeUntilExpiry: getTimeUntilExpiry(),
    formattedTimeUntilExpiry: getFormattedTimeUntilExpiry(),
    extendSession: handleExtendSession,
    refresh
  };
};

export default useSessionMonitor;
