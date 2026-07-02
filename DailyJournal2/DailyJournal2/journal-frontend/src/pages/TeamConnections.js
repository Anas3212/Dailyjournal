import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Fade,
  Fab,
  Tooltip,
  LinearProgress,
  Skeleton
} from '@mui/material';
import { 
  getTeamConnections, 
  requestTeamConnection, 
  respondToConnection,
  removeConnection,
  getEligibleTeamsForConnection,
  listMembers,
  listTeamJournals,
  getTeamById
} from '../services/teamApi';
import { 
  Link as LinkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  ConnectWithoutContact as ConnectIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`connections-tabpanel-${index}`}
      aria-labelledby={`connections-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TeamConnections() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [eligibleTeams, setEligibleTeams] = useState([]);
  const [message, setMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({ connectedCount: 0, pendingCount: 0, rejectedCount: 0 });
  const [newRejections, setNewRejections] = useState(0);

  // Memoized computed values for filtered connections to prevent unnecessary re-renders
  const pendingRequests = useMemo(() => 
    connections.filter(conn => conn.status === 'PENDING'), 
    [connections]
  );
  const connectedTeams = useMemo(() => 
    connections.filter(conn => conn.status === 'ACCEPTED'), 
    [connections]
  );
  const rejectedRequests = useMemo(() => 
    connections.filter(conn => conn.status === 'REJECTED'), 
    [connections]
  );

  const enrichTeamData = async (team) => {
    try {
      const [membersRes, journalsRes] = await Promise.all([
        listMembers(team.id),
        listTeamJournals(team.id)
      ]);
      
      const membersData = membersRes?.data;
      const journalsData = journalsRes?.data;
      
      // Use the same logic as Teams.js for counting
      const memberCount = Array.isArray(membersData)
        ? membersData.length
        : (typeof membersData?.totalElements === 'number'
            ? membersData.totalElements
            : (Array.isArray(membersData?.content) ? membersData.content.length : 0));
            
      const journalCount = Array.isArray(journalsData)
        ? journalsData.length
        : (typeof journalsData?.totalElements === 'number'
            ? journalsData.totalElements
            : (Array.isArray(journalsData?.content) ? journalsData.content.length : 0));
      
      return {
        ...team,
        memberCount,
        journalCount,
        ownerName: team.ownerName || team.owner?.name || 'Unknown'
      };
    } catch (error) {
      console.error(`Failed to enrich data for team ${team.id}:`, error);
      return {
        ...team,
        memberCount: 0,
        journalCount: 0,
        ownerName: team.ownerName || team.owner?.name || 'Unknown'
      };
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data for teamId:', teamId);
      
      const [connectionsRes, eligibleTeamsRes] = await Promise.all([
        getTeamConnections(teamId),
        getEligibleTeamsForConnection()
      ]);
      
      console.log('Raw connections response:', connectionsRes);
      console.log('Raw eligible teams response:', eligibleTeamsRes);
      
      // Handle different response structures
      let connectionsData = [];
      if (connectionsRes.data) {
        if (connectionsRes.data.content) {
          connectionsData = connectionsRes.data.content; // Paginated response
        } else if (Array.isArray(connectionsRes.data)) {
          connectionsData = connectionsRes.data; // Direct array
        } else {
          console.warn('Unexpected connections response structure:', connectionsRes.data);
        }
      }
      
      const eligibleTeamsData = eligibleTeamsRes.data || [];
      
      // Enrich team data for all connections
      const enrichedConnections = await Promise.all(
        connectionsData.map(async (connection) => {
          const [enrichedRequesterTeam, enrichedTargetTeam] = await Promise.all([
            enrichTeamData(connection.requesterTeam),
            enrichTeamData(connection.targetTeam)
          ]);
          
          return {
            ...connection,
            requesterTeam: enrichedRequesterTeam,
            targetTeam: enrichedTargetTeam
          };
        })
      );
      
      setConnections(enrichedConnections);
      setEligibleTeams(eligibleTeamsData);
      
      // Calculate stats
      const connectedCount = enrichedConnections.filter(conn => conn.status === 'ACCEPTED').length;
      const pendingCount = enrichedConnections.filter(conn => conn.status === 'PENDING').length;
      const rejectedCount = enrichedConnections.filter(conn => conn.status === 'REJECTED').length;
      setStats({ connectedCount, pendingCount, rejectedCount });
      
      // Check for new rejections and show notification
      const userRejectedRequests = enrichedConnections.filter(conn => 
        conn.status === 'REJECTED' && 
        conn.requesterTeam.id === parseInt(teamId)
      );
      setNewRejections(userRejectedRequests.length);
      
      // Show notification for rejected requests
      if (userRejectedRequests.length > 0) {
        const rejectedTeamNames = userRejectedRequests.map(conn => conn.targetTeam.name).join(', ');
        showSnackbar(
          `⚠️ ${userRejectedRequests.length} connection request${userRejectedRequests.length > 1 ? 's' : ''} rejected by: ${rejectedTeamNames}`,
          'warning'
        );
      }
      
      console.log('Data loaded:', {
        connections: enrichedConnections.length,
        eligibleTeams: eligibleTeamsData.length,
        connectedCount,
        pendingCount,
        rejectedCount: enrichedConnections.filter(conn => conn.status === 'REJECTED').length,
        currentTeamId: teamId,
        rawConnectionsData: connectionsData,
        enrichedConnections: enrichedConnections.map(conn => ({
          id: conn.id,
          status: conn.status,
          requester: conn.requesterTeam?.name || 'Unknown',
          requesterId: conn.requesterTeam?.id,
          target: conn.targetTeam?.name || 'Unknown',
          targetId: conn.targetTeam?.id,
          createdBy: conn.createdBy?.name || 'Unknown',
          isRequester: conn.requesterTeam?.id === parseInt(teamId)
        })),
        connectionsResponse: connectionsRes
      });
      
      // Don't set default selected team - let user choose
      // if (eligibleTeamsRes.data && eligibleTeamsRes.data.length > 0) {
      //   setSelectedTeamId(eligibleTeamsRes.data[0].id);
      //   console.log('Default team selected:', eligibleTeamsRes.data[0].id);
      // }
    } catch (error) {
      console.error('Failed to load data:', error);
      showSnackbar('Failed to load connections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  // Handle navigation state for pre-filled target team
  useEffect(() => {
    const state = location.state;
    if (state?.targetTeamId && !requestDialogOpen) {
      setTargetTeamId(state.targetTeamId.toString());
      setRequestDialogOpen(true);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, requestDialogOpen]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestConnection = async (event) => {
    event?.preventDefault();
    
    // Validate required fields
    if (!selectedTeamId) {
      showSnackbar('Please select a team', 'error');
      return;
    }
    if (!targetTeamId || targetTeamId.trim() === '') {
      showSnackbar('Please enter target team ID', 'error');
      return;
    }
    
    const targetId = parseInt(targetTeamId);
    if (isNaN(targetId) || targetId <= 0) {
      showSnackbar('Please enter a valid team ID', 'error');
      return;
    }
    
    // Prevent connecting to self
    if (selectedTeamId === targetId) {
      showSnackbar('Cannot connect to the same team', 'error');
      return;
    }
    
    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      (conn.requesterTeam.id === selectedTeamId && conn.targetTeam.id === targetId) ||
      (conn.requesterTeam.id === targetId && conn.targetTeam.id === selectedTeamId)
    );
    
    if (existingConnection) {
      showSnackbar('Connection already exists with this team', 'error');
      return;
    }
    
    try {
      await requestTeamConnection(selectedTeamId, targetId, message);
      showSnackbar('Connection request sent successfully');
      setRequestDialogOpen(false);
      setTargetTeamId('');
      setMessage('');
      setSelectedTeamId('');
      await loadData(); // Refresh data after successful request
    } catch (error) {
      console.error('Connection request failed:', error);
      showSnackbar(error.response?.data?.message || 'Failed to send connection request', 'error');
    }
  };

  const handleRespondToConnection = async (connectionId, accept) => {
    try {
      await respondToConnection(teamId, connectionId, accept);
      showSnackbar(`Connection ${accept ? 'accepted' : 'rejected'} successfully`);
      await loadData(); // Refresh data after response
    } catch (error) {
      console.error('Failed to respond to connection:', error);
      showSnackbar(error.response?.data?.message || 'Failed to respond to connection', 'error');
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    
    try {
      await removeConnection(teamId, connectionId);
      showSnackbar('Connection removed successfully');
      await loadData(); // Refresh data after removal
    } catch (error) {
      console.error('Failed to remove connection:', error);
      showSnackbar(error.response?.data?.message || 'Failed to remove connection', 'error');
    }
  };

  const getTeamInitials = (name) => {
    return name?.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'T';
  };

  const renderRejectedConnectionCard = (connection) => {
    const isRequester = connection.requesterTeam.id === parseInt(teamId);
    const otherTeam = isRequester ? connection.targetTeam : connection.requesterTeam;
    
    return (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={connection.id}>
        <Fade in timeout={300}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              border: '2px solid #f44336',
              background: 'linear-gradient(145deg, #fff5f5 0%, #ffebee 100%)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(244, 67, 54, 0.2)',
                border: '2px solid #d32f2f'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #f44336, #ef5350)'
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              {/* Rejection Alert */}
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  '& .MuiAlert-message': {
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                  Request Rejected
                  {connection.updatedAt && (
                    <Chip 
                      size="small" 
                      icon={<TimeIcon />}
                      label={new Date(connection.updatedAt).toLocaleDateString()}
                      sx={{
                        ml: 1,
                        background: 'rgba(244, 67, 54, 0.1)',
                        color: '#d32f2f',
                        fontSize: '0.75rem',
                        '& .MuiChip-icon': { color: '#d32f2f' }
                      }}
                    />
                  )}
                </Box>
              </Alert>

              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'transparent',
                    background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                    width: 48,
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                  }}
                >
                  {getTeamInitials(otherTeam.name)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: '#d32f2f' }}>
                    {otherTeam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                    Owner: {otherTeam.ownerName}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  size="medium"
                  icon={<GroupIcon />}
                  label={`${otherTeam.memberCount || 0} Members`}
                  sx={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    color: '#d32f2f',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: '#d32f2f' }
                  }}
                />
                <Chip
                  size="medium"
                  icon={<ArticleIcon />}
                  label={`${otherTeam.journalCount || 0} Journals`}
                  sx={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    color: '#d32f2f',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: '#d32f2f' }
                  }}
                />
              </Stack>

              {connection.message && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    background: 'rgba(244, 67, 54, 0.05)',
                    border: '1px solid rgba(244, 67, 54, 0.1)',
                    borderRadius: 2,
                    borderLeft: '4px solid #f44336'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                    Original message: "{connection.message}"
                  </Typography>
                </Paper>
              )}
              
              {connection.createdAt && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(244, 67, 54, 0.2)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.7 }} />
                    Originally sent • {new Date(connection.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              {isRequester && (
                <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      background: 'rgba(244, 67, 54, 0.08)',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" color="#d32f2f" fontWeight={600}>
                      💔 This team declined your connection request
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Don't worry! You can try again or connect with other teams
                    </Typography>
                  </Paper>
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => {
                      setSelectedTeamId(connection.requesterTeam.id.toString());
                      setTargetTeamId(connection.targetTeam.id.toString());
                      setMessage(connection.message || '');
                      setRequestDialogOpen(true);
                    }}
                    sx={{ 
                      alignSelf: 'center',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </Stack>
              )}
            </CardActions>
          </Card>
        </Fade>
      </Grid>
    );
  };

  const renderConnectionCard = (connection, showActions = true) => {
    const isRequester = connection.requesterTeam.id === parseInt(teamId);
    const otherTeam = isRequester ? connection.targetTeam : connection.requesterTeam;
    
    console.log('Rendering connection card:', {
      connectionId: connection.id,
      status: connection.status,
      isRequester: isRequester,
      currentTeamId: teamId,
      requesterTeamId: connection.requesterTeam.id,
      targetTeamId: connection.targetTeam.id,
      otherTeamName: otherTeam.name
    });
    
    return (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={connection.id}>
        <Fade in timeout={300}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.15)',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: connection.status === 'ACCEPTED' 
                  ? 'linear-gradient(90deg, #4caf50, #81c784)'
                  : connection.status === 'PENDING'
                  ? 'linear-gradient(90deg, #ff9800, #ffb74d)'
                  : 'linear-gradient(90deg, #f44336, #ef5350)'
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'transparent',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: 48,
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  {getTeamInitials(otherTeam.name)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {otherTeam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                    Owner: {otherTeam.ownerName}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  size="medium"
                  icon={<GroupIcon />}
                  label={`${otherTeam.memberCount || 0} Members`}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    color: '#667eea',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: '#667eea' }
                  }}
                />
                <Chip
                  size="medium"
                  icon={<ArticleIcon />}
                  label={`${otherTeam.journalCount || 0} Journals`}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(233, 30, 99, 0.1))',
                    border: '1px solid rgba(156, 39, 176, 0.2)',
                    color: '#9c27b0',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: '#9c27b0' }
                  }}
                />
              </Stack>

              <Box sx={{ mb: 2 }}>
                <Chip
                  size="medium"
                  label={connection.status}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    px: 2,
                    ...(connection.status === 'ACCEPTED' && {
                      background: 'linear-gradient(135deg, #4caf50, #81c784)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    }),
                    ...(connection.status === 'PENDING' && {
                      background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    }),
                    ...(connection.status === 'REJECTED' && {
                      background: 'linear-gradient(135deg, #f44336, #ef5350)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    })
                  }}
                />
              </Box>

              {connection.message && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    borderRadius: 2,
                    borderLeft: '4px solid #667eea'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{connection.message}"
                  </Typography>
                </Paper>
              )}
              
              {connection.createdAt && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.7 }} />
                    {isRequester ? 'Sent' : 'Received'} • {new Date(connection.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>

            {showActions && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                {connection.status === 'PENDING' && !isRequester && (
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <Button
                      size="medium"
                      variant="contained"
                      startIcon={<CheckIcon />}
                      onClick={() => handleRespondToConnection(connection.id, true)}
                      sx={{ 
                        flex: 1,
                        background: 'linear-gradient(135deg, #4caf50, #81c784)',
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #388e3c, #66bb6a)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)'
                        }
                      }}
                    >
                      Accept Request
                    </Button>
                    <Button
                      size="medium"
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={() => handleRespondToConnection(connection.id, false)}
                      sx={{ 
                        flex: 1,
                        borderColor: '#f44336',
                        color: '#f44336',
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': {
                          borderColor: '#d32f2f',
                          backgroundColor: 'rgba(244, 67, 54, 0.04)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </Stack>
                )}

                {connection.status === 'PENDING' && isRequester && (
                  <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: 'rgba(255, 152, 0, 0.08)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" color="#f57c00" fontWeight={600}>
                        Request sent • Waiting for response
                      </Typography>
                    </Paper>
                    <Button
                      size="medium"
                      variant="outlined"
                      onClick={() => handleRemoveConnection(connection.id)}
                      sx={{ 
                        alignSelf: 'center',
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#f57c00',
                          backgroundColor: 'rgba(255, 152, 0, 0.04)'
                        }
                      }}
                    >
                      Cancel Request
                    </Button>
                  </Stack>
                )}

                {connection.status === 'REJECTED' && isRequester && (
                  <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: 'rgba(244, 67, 54, 0.08)',
                        border: '1px solid rgba(244, 67, 54, 0.2)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" color="#d32f2f" fontWeight={600}>
                        Request rejected
                      </Typography>
                    </Paper>
                    <Button
                      size="medium"
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={() => {
                        setSelectedTeamId(connection.requesterTeam.id.toString());
                        setTargetTeamId(connection.targetTeam.id.toString());
                        setMessage(connection.message || '');
                        setRequestDialogOpen(true);
                      }}
                      sx={{ 
                        alignSelf: 'center',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                        }
                      }}
                    >
                      Resend Request
                    </Button>
                  </Stack>
                )}
                
                {connection.status === 'ACCEPTED' && (
                  <Button
                    size="medium"
                    variant="outlined"
                    onClick={() => handleRemoveConnection(connection.id)}
                    sx={{
                      borderColor: '#f44336',
                      color: '#f44336',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: '#d32f2f',
                        backgroundColor: 'rgba(244, 67, 54, 0.04)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                )}
              </CardActions>
            )}
          </Card>
        </Fade>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Enhanced Header with Gradient Background */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <Box position="relative" zIndex={1}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <ConnectIcon sx={{ fontSize: 40, opacity: 0.9 }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>
                Team Connections
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Build bridges, share knowledge, grow together
              </Typography>
            </Box>
          </Stack>
          
          {/* Enhanced Stats Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: 1
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    background: 'rgba(76, 175, 80, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LinkIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.connectedCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Connected Teams
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: 1
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    background: 'rgba(255, 152, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ScheduleIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Pending Requests
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: 1
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    background: 'rgba(244, 67, 54, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CloseIcon sx={{ color: '#f44336', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.rejectedCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Rejected Requests
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: 1
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    background: 'rgba(33, 150, 243, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#2196f3', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {connections.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Connections
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Paper>

      {/* Main Content Paper */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >


        {/* Enhanced Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            px: 3,
            pt: 2,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 60,
              '&.Mui-selected': {
                color: '#667eea'
              }
            }
          }}
        >
          <Tab 
            label="All Connections" 
            icon={<ConnectIcon />} 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
          />
          <Tab 
            label="Pending Requests" 
            icon={<ScheduleIcon />} 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
          />
          <Tab 
            label="Connected Teams" 
            icon={<LinkIcon />} 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Rejected Requests
                {newRejections > 0 && (
                  <Chip 
                    size="small" 
                    label={newRejections} 
                    sx={{
                      background: 'linear-gradient(135deg, #f44336, #ef5350)',
                      color: 'white',
                      fontSize: '0.75rem',
                      height: 20,
                      minWidth: 20,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                )}
              </Box>
            }
            icon={<CloseIcon />} 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {connections.length === 0 ? (
            <Alert severity="info">No connections found</Alert>
          ) : (
            <Grid container spacing={2}>
              {connections.map(connection => renderConnectionCard(connection))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {pendingRequests.length === 0 ? (
            <Alert severity="info">No pending requests</Alert>
          ) : (
            <Grid container spacing={2}>
              {pendingRequests.map(connection => renderConnectionCard(connection))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {connectedTeams.length === 0 ? (
            <Alert severity="info">No connected teams</Alert>
          ) : (
            <Grid container spacing={2}>
              {connectedTeams.map(connection => renderConnectionCard(connection))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {rejectedRequests.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{
                borderRadius: 2,
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }
              }}
            >
              <NotificationIcon sx={{ fontSize: 20 }} />
              No rejected requests - All your connection requests are either pending or accepted!
            </Alert>
          ) : (
            <>
              {/* Rejection Notice */}
              <Alert 
                severity="warning" 
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '& .MuiAlert-message': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }
                }}
              >
                <WarningIcon sx={{ fontSize: 20 }} />
                These connection requests were rejected. You can resend requests or try connecting with different teams.
              </Alert>
              
              <Grid container spacing={2}>
                {rejectedRequests.map(connection => renderRejectedConnectionCard(connection))}
              </Grid>
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Floating Action Button */}
      <Tooltip title="Request New Connection" placement="left">
        <Fab
          color="primary"
          onClick={() => setRequestDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Enhanced Request Connection Dialog */}
      <Dialog 
        open={requestDialogOpen} 
        onClose={() => setRequestDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)'
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 3
          }}
        >
          <ConnectIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Request Team Connection
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Connect with another team to collaborate
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <FormControl 
            fullWidth 
            margin="dense" 
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2
                }
              }
            }}
          >
            <InputLabel id="team-select-label" sx={{ color: '#667eea', fontWeight: 600 }}>Select Your Team</InputLabel>
            <Select
              labelId="team-select-label"
              value={selectedTeamId || ''}
              onChange={(e) => {
                console.log('Team selected:', e.target.value);
                setSelectedTeamId(e.target.value);
              }}
              label="Select Your Team"
              disabled={loading || eligibleTeams.length === 0}
              sx={{
                '& .MuiSelect-select': {
                  py: 1.5
                }
              }}
            >
              {loading ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading teams...
                  </Box>
                </MenuItem>
              ) : eligibleTeams.length === 0 ? (
                <MenuItem disabled>No eligible teams found</MenuItem>
              ) : (
                eligibleTeams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name} ({team.role})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Target Team ID"
            type="number"
            fullWidth
            variant="outlined"
            value={targetTeamId}
            onChange={(e) => setTargetTeamId(e.target.value)}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: '#667eea',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: '#667eea'
                }
              }
            }}
          />
          <TextField
            margin="dense"
            label="Message"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why would you like to connect with this team?"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: '#667eea',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: '#667eea'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setRequestDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestConnection}
            variant="contained"
            disabled={!targetTeamId || !selectedTeamId}
            startIcon={<SendIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
