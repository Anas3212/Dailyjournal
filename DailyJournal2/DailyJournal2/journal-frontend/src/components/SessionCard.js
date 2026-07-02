import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Tooltip,
  Button,
  useTheme
} from '@mui/material';
import {
  Computer as DesktopIcon,
  PhoneAndroid as MobileIcon,
  Tablet as TabletIcon,
  DeviceUnknown as UnknownIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * SessionCard Component
 * Displays individual session information with actions
 */
const SessionCard = ({ 
  session, 
  isCurrentSession = false, 
  onRevoke, 
  onExtend,
  loading = false 
}) => {
  const theme = useTheme();

  // Get device icon based on device type
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <MobileIcon />;
      case 'tablet':
        return <TabletIcon />;
      case 'desktop':
        return <DesktopIcon />;
      default:
        return <UnknownIcon />;
    }
  };

  // Get device color based on type
  const getDeviceColor = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return theme.palette.success.main;
      case 'tablet':
        return theme.palette.info.main;
      case 'desktop':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Check if session is expiring soon (within 1 hour)
  const isExpiringSoon = () => {
    if (!session.expiresAt) return false;
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    return (expiresAt - now) < oneHour;
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: isCurrentSession ? `2px solid ${theme.palette.primary.main}` : '1px solid',
        borderColor: isCurrentSession ? theme.palette.primary.main : theme.palette.divider,
        background: isCurrentSession 
          ? `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}08)`
          : 'inherit',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        }
      }}
    >
      {/* Current session indicator */}
      {isCurrentSession && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          <Tooltip title="Current Session">
            <Chip
              icon={<ActiveIcon />}
              label="Current"
              size="small"
              color="primary"
              variant="filled"
            />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ pb: 1 }}>
        {/* Device and Location Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              color: getDeviceColor(session.deviceType),
              mr: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {getDeviceIcon(session.deviceType)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
              {session.deviceType || 'Unknown Device'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {session.ipAddress} • {session.location || 'Unknown Location'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Session Times */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(session.createdAt)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2.5 }}>
            Last Active: {formatRelativeTime(session.lastAccessedAt)}
          </Typography>
          <Typography 
            variant="body2" 
            color={isExpiringSoon() ? "warning.main" : "text.secondary"}
            sx={{ ml: 2.5 }}
          >
            Expires: {formatDate(session.expiresAt)}
            {isExpiringSoon() && " (Soon)"}
          </Typography>
        </Box>

        {/* User Agent */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {session.userAgent || 'Unknown Browser'}
        </Typography>

        {/* Session ID */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            fontFamily: 'monospace',
            mt: 0.5
          }}
        >
          ID: {session.sessionId?.substring(0, 16)}...
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {isCurrentSession && onExtend && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => onExtend(session.sessionId)}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Extend
            </Button>
          )}
          {isExpiringSoon() && (
            <Chip
              label="Expiring Soon"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {!isCurrentSession && onRevoke && (
          <Tooltip title="Revoke Session">
            <IconButton
              color="error"
              onClick={() => onRevoke(session.sessionId)}
              disabled={loading}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default SessionCard;
