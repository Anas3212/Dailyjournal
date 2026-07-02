import React, { useEffect, useState } from 'react';
import useSessionExpiry from '../hooks/useSessionExpiry';
import SessionExpiryWarning from './SessionExpiryWarning';
import { setSessionMonitorCallback } from '../services/api';

/**
 * SessionMonitor Component
 * Global session monitoring component that should be included in the main App
 * Monitors session expiry and shows warnings to users
 */
const SessionMonitor = () => {
  const {
    sessionWarning,
    timeUntilExpiryFormatted,
    monitorSessionHeaders,
    extendSession,
    handleSessionExpired
  } = useSessionExpiry();

  const [warningDismissed, setWarningDismissed] = useState(false);
  const [extending, setExtending] = useState(false);

  // Set up session monitoring callback on mount
  useEffect(() => {
    setSessionMonitorCallback(monitorSessionHeaders);
    
    // Cleanup on unmount
    return () => {
      setSessionMonitorCallback(null);
    };
  }, [monitorSessionHeaders]);

  // Reset dismissed state when warning appears
  useEffect(() => {
    if (sessionWarning) {
      setWarningDismissed(false);
    }
  }, [sessionWarning]);

  const handleExtendSession = async () => {
    setExtending(true);
    try {
      const success = await extendSession();
      if (success) {
        setWarningDismissed(true);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setExtending(false);
    }
  };

  const handleDismissWarning = () => {
    setWarningDismissed(true);
  };

  const handleCloseWarning = () => {
    setWarningDismissed(true);
  };

  // Show warning if session is expiring and not dismissed
  const showWarning = sessionWarning && !warningDismissed;

  return (
    <SessionExpiryWarning
      open={showWarning}
      timeRemaining={timeUntilExpiryFormatted}
      onExtend={handleExtendSession}
      onDismiss={handleDismissWarning}
      onClose={handleCloseWarning}
      extending={extending}
    />
  );
};

export default SessionMonitor;
