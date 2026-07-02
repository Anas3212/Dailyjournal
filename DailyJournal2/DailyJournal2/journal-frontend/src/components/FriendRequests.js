import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  Container,
  Fade,
  Slide
} from '@mui/material';
import {
  Person as PersonIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Pending as PendingIcon,
  PeopleAlt as FriendsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequestCount
} from '../services/api';

const FriendRequests = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    fetchRequests();
    fetchRequestCount();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [pendingResponse, sentResponse] = await Promise.all([
        getPendingFriendRequests(),
        getSentFriendRequests()
      ]);
      
      setPendingRequests(pendingResponse.data);
      setSentRequests(sentResponse.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      showSnackbar('Error loading friend requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestCount = async () => {
    try {
      const response = await getPendingRequestCount();
      setRequestCount(response.data.count);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequest(requestId);
    try {
      const response = await acceptFriendRequest(requestId);
      if (response.data.success) {
        // Remove the accepted request from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setRequestCount(prev => prev - 1);
        showSnackbar('Friend request accepted!', 'success');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showSnackbar('Error accepting friend request', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingRequest(requestId);
    try {
      const response = await rejectFriendRequest(requestId);
      if (response.data.success) {
        // Remove the rejected request from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setRequestCount(prev => prev - 1);
        showSnackbar('Friend request rejected', 'info');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      showSnackbar('Error rejecting friend request', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPendingRequests = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (pendingRequests.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <PendingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pending friend requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When someone sends you a friend request, it will appear here.
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {pendingRequests.map((request, index) => (
          <Slide direction="up" in timeout={600 + index * 100} key={request.id}>
            <Card 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)'
                }
              }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {getInitials(request.sender.name)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {request.sender.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.sender.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sent: {formatDate(request.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  startIcon={<CloseIcon />}
                  onClick={() => handleRejectRequest(request.id)}
                  disabled={processingRequest === request.id}
                  size="small"
                  sx={{ 
                    mr: 1,
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(255, 107, 107, 0.3)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={processingRequest === request.id}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(102, 126, 234, 0.3)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  {processingRequest === request.id ? 'Processing...' : 'Accept'}
                </Button>
              </CardActions>
            </Card>
          </Slide>
        ))}
      </List>
    );
  };

  const renderSentRequests = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (sentRequests.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <SendIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No sent friend requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Friend requests you send will appear here until they are accepted or rejected.
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {sentRequests.map((request, index) => (
          <Slide direction="up" in timeout={600 + index * 100} key={request.id}>
            <Card 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)'
                }
              }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      {getInitials(request.receiver.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {request.receiver.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.receiver.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sent: {formatDate(request.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Pending"
                    color="warning"
                    size="small"
                    icon={<PendingIcon />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Slide>
        ))}
      </List>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Modern Header Section */}
            <Box mb={4}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    mr: 2
                  }}
                >
                  <FriendsIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography 
                  variant="h3" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  Friend Requests
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  maxWidth: 600,
                  margin: '0 auto',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                Manage your friend connections and build your network
              </Typography>
            </Box>

            {/* Main Content Container */}
            <Paper 
              elevation={24} 
              sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            >
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Received
                {requestCount > 0 && (
                  <Chip 
                    label={requestCount} 
                    size="small" 
                    color="primary" 
                    sx={{ minWidth: 20, height: 20 }}
                  />
                )}
              </Box>
            }
          />
                  <Tab label="Sent" />
                </Tabs>
              </Box>

              <Box sx={{ p: 3 }}>
                {tabValue === 0 && (
                  <>
                    <Typography variant="h5" gutterBottom>
                      Friend Requests Received
                    </Typography>
                    {renderPendingRequests()}
                  </>
                )}
                
                {tabValue === 1 && (
                  <>
                    <Typography variant="h5" gutterBottom>
                      Friend Requests Sent
                    </Typography>
                    {renderSentRequests()}
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FriendRequests;
