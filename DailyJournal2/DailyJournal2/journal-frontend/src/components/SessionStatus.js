import React, { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import useSessionMonitor from '../hooks/useSessionMonitor';

/**
 * SessionStatus Component
 * Displays current session status in the UI with monitoring capabilities
 */
const SessionStatus = ({ 
  showInAppBar = false,
  showTimeRemaining = true,
  autoExtend = false,
  onSessionExpiring,
  onSessionExpired
}) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const {
    sessionInfo,
    loading,
    isExpiringSoon,
    isSessionValid,
    formattedTimeUntilExpiry,
    extendSession,
    refresh
  } = useSessionMonitor({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    autoExtend,
    extendThreshold: 3600000, // 1 hour
    onSessionExpiring: (session, timeLeft) => {
      if (onSessionExpiring) {
        onSessionExpiring(session, timeLeft);
      } else {
        showSnackbar('Your session will expire soon. Consider extending it.', 'warning');
      }
    },
    onSessionExpired: (session) => {
      if (onSessionExpired) {
        onSessionExpired(session);
      } else {
        showSnackbar('Your session has expired. Please log in again.', 'error');
      }
    },
    onSessionExtended: (session, hours) => {
      showSnackbar(`Session extended by ${hours} hours`, 'success');
    }
  });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleExtendSession = async () => {
    const success = await extendSession(8);
    if (!success) {
      showSnackbar('Failed to extend session', 'error');
    }
  };

  if (!sessionInfo || !isSessionValid) {
    return null;
  }

  // App bar version - compact display
  if (showInAppBar) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
        <Tooltip 
          title={`Session expires in ${formattedTimeUntilExpiry || 'unknown'}`}
          arrow
        >
          <Chip
            icon={isExpiringSoon ? <WarningIcon /> : <ActiveIcon />}
            label={showTimeRemaining ? formattedTimeUntilExpiry : 'Active'}
            size="small"
            color={isExpiringSoon ? 'warning' : 'success'}
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiChip-icon': {
                color: 'inherit'
              }
            }}
          />
        </Tooltip>
        
        <Tooltip title="Refresh session info">
          <IconButton
            size="small"
            onClick={refresh}
            disabled={loading}
            sx={{ 
              ml: 0.5, 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            action={
              snackbar.severity === 'warning' && isExpiringSoon ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleExtendSession}
                >
                  Extend
                </Button>
              ) : null
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Full version - detailed display
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: isExpiringSoon ? 'warning.main' : 'success.main' }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={isExpiringSoon ? <WarningIcon /> : <ActiveIcon />}
                label={isExpiringSoon ? 'Expiring Soon' : 'Active Session'}
                size="small"
                color={isExpiringSoon ? 'warning' : 'success'}
                variant="filled"
              />
              {showTimeRemaining && (
                <Chip
                  icon={<TimeIcon />}
                  label={`${formattedTimeUntilExpiry} remaining`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isExpiringSoon && (
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleExtendSession}
              disabled={loading}
            >
              Extend Session
            </Button>
          )}
          
          <IconButton
            onClick={refresh}
            disabled={loading}
            size="small"
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionStatus;
