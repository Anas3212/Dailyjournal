import React from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * SessionExpiryWarning Component
 * Shows a warning when the user's session is about to expire
 */
const SessionExpiryWarning = ({ 
  open, 
  timeRemaining, 
  onExtend, 
  onDismiss,
  onClose 
}) => {
  const handleExtend = () => {
    if (onExtend) {
      onExtend();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      autoHideDuration={null} // Don't auto-hide
      onClose={onClose}
    >
      <Alert
        severity="warning"
        variant="filled"
        icon={<WarningIcon />}
        sx={{
          minWidth: '400px',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleExtend}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Extend Session
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Dismiss
            </Button>
            <IconButton
              size="small"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Session Expiring Soon
          </Typography>
          <Typography variant="body2">
            Your session will expire in {timeRemaining}. 
            Click "Extend Session" to continue working or you'll be automatically logged out.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default SessionExpiryWarning;
