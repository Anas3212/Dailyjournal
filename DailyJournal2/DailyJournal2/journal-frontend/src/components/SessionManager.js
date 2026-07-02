import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  DeleteSweep as DeleteAllIcon,
  History as HistoryIcon,
  Dashboard as StatsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import SessionCard from './SessionCard';
import {
  getUserSessions,
  getUserSessionHistory,
  getCurrentSession,
  revokeSession,
  revokeAllSessions,
  extendSession,
  getSessionStats
} from '../services/api';

/**
 * SessionManager Component
 * Comprehensive session management interface
 */
const SessionManager = ({ open, onClose }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState(30);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const isAdmin = user?.roles?.some(role => role.name === 'ROLE_ADMIN');

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      if (activeTab === 0) {
        fetchActiveSessions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [open, activeTab]);

  // Fetch data when dialog opens or tab changes
  useEffect(() => {
    if (!open) return;

    switch (activeTab) {
      case 0:
        fetchActiveSessions();
        break;
      case 1:
        fetchSessionHistory();
        break;
      case 2:
        if (isAdmin) fetchSessionStats();
        break;
      default:
        break;
    }
  }, [open, activeTab, historyDays, isAdmin]);

  const fetchActiveSessions = async () => {
    setLoading(true);
    try {
      const [sessionsRes, currentRes] = await Promise.all([
        getUserSessions(),
        getCurrentSession()
      ]);
      
      setSessions(sessionsRes.data || []);
      setCurrentSession(currentRes.data?.session || null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showSnackbar('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionHistory = async () => {
    setLoading(true);
    try {
      const response = await getUserSessionHistory(historyDays);
      setSessionHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching session history:', error);
      showSnackbar('Failed to load session history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStats = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await getSessionStats();
      setSessionStats(response.data || {});
    } catch (error) {
      console.error('Error fetching session stats:', error);
      showSnackbar('Failed to load session statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setActionLoading(true);
    try {
      await revokeSession(sessionId);
      showSnackbar('Session revoked successfully', 'success');
      fetchActiveSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      showSnackbar('Failed to revoke session', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setActionLoading(true);
    try {
      const response = await revokeAllSessions();
      const count = response.data?.revokedCount || 0;
      showSnackbar(`Revoked ${count} other sessions successfully`, 'success');
      fetchActiveSessions();
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      showSnackbar('Failed to revoke sessions', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendSession = async (sessionId) => {
    setActionLoading(true);
    try {
      await extendSession(8); // Extend by 8 hours
      showSnackbar('Session extended successfully', 'success');
      fetchActiveSessions();
    } catch (error) {
      console.error('Error extending session:', error);
      showSnackbar('Failed to extend session', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderActiveSessions = () => (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Active Sessions ({sessions.length})
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchActiveSessions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {sessions.length > 1 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteAllIcon />}
            onClick={handleRevokeAllSessions}
            disabled={actionLoading}
            size="small"
          >
            Revoke All Others
          </Button>
        )}
      </Box>

      {/* Sessions list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <Alert severity="info">No active sessions found</Alert>
      ) : (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              isCurrentSession={currentSession?.sessionId === session.sessionId}
              onRevoke={handleRevokeSession}
              onExtend={handleExtendSession}
              loading={actionLoading}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderSessionHistory = () => (
    <Box>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Session History ({sessionHistory.length})
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Days</InputLabel>
            <Select
              value={historyDays}
              label="Days"
              onChange={(e) => setHistoryDays(e.target.value)}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh">
            <IconButton onClick={fetchSessionHistory} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* History list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionHistory.length === 0 ? (
        <Alert severity="info">No session history found for the selected period</Alert>
      ) : (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {sessionHistory.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              isCurrentSession={false}
              loading={false}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderSessionStats = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Session Statistics
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionStats ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Sessions
              </Typography>
              <Typography variant="h4" color="primary">
                {sessionStats.activeSessions || 0}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4" color="secondary">
                {sessionStats.totalSessions || 0}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inactive Sessions
              </Typography>
              <Typography variant="h4" color="textSecondary">
                {sessionStats.inactiveSessions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Alert severity="error">Failed to load session statistics</Alert>
      )}
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '600px',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">Session Management</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<SecurityIcon />} 
              label="Active Sessions" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="History" 
              iconPosition="start"
            />
            {isAdmin && (
              <Tab 
                icon={<StatsIcon />} 
                label="Statistics" 
                iconPosition="start"
              />
            )}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && renderActiveSessions()}
            {activeTab === 1 && renderSessionHistory()}
            {activeTab === 2 && isAdmin && renderSessionStats()}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </>
  );
};

export default SessionManager;
