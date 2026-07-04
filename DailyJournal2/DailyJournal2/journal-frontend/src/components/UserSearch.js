import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, CardHeader,
  InputAdornment, Grid, Chip, Fade, Slide
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { searchUsers, sendFriendRequest, getFriendRequestStatus } from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState({});
  const [sendingRequest, setSendingRequest] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await searchUsers(searchTerm);
      setUsers(response.data);

      // Check friend request status for all users
      response.data.forEach(user => {
        checkFriendRequestStatus(user.id);
      });
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith('http')) return profilePicture;
    const filename = profilePicture.split('/').pop();
    return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  const handleCloseUserDetail = () => {
    setUserDetailOpen(false);
  };

  const handleViewUserJournals = (userId) => {
    navigate(`/user-journals/${userId}`);
  };

  const checkFriendRequestStatus = async (userId) => {
    try {
      const response = await getFriendRequestStatus(userId);
      setFriendRequestStatus(prev => ({
        ...prev,
        [userId]: response.data.status
      }));
    } catch (error) {
      console.error('Error checking friend request status:', error);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    setSendingRequest(true);
    try {
      const response = await sendFriendRequest(receiverId);
      if (response.data.success) {
        // Update the status to reflect the request was sent
        setFriendRequestStatus(prev => ({
          ...prev,
          [receiverId]: 'REQUEST_SENT'
        }));
        // You could add a success notification here
        console.log('Friend request sent successfully');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      // You could add an error notification here
    } finally {
      setSendingRequest(false);
    }
  };

  const renderFriendButton = (userId) => {
    const status = friendRequestStatus[userId];

    switch (status) {
      case 'FRIENDS':
        return (
          <Button
            variant="outlined"
            color="success"
            startIcon={<PersonIcon />}
            disabled
          >
            Already Friends
          </Button>
        );
      case 'REQUEST_SENT':
        return (
          <Button
            variant="outlined"
            color="info"
            disabled
          >
            Request Sent
          </Button>
        );
      case 'REQUEST_RECEIVED':
        return (
          <Button
            variant="outlined"
            color="warning"
            disabled
          >
            Request Received
          </Button>
        );
      case 'REJECTED':
        return (
          <Button
            variant="outlined"
            color="error"
            disabled
          >
            Request Rejected
          </Button>
        );
      case 'NONE':
      default:
        return (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PersonAddIcon />}
            onClick={() => handleSendFriendRequest(userId)}
            disabled={sendingRequest}
          >
            {sendingRequest ? 'Sending...' : 'Send Friend Request'}
          </Button>
        );
    }
  };

  return (
    <Box>
      {/* Search Header */}
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          User Search
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Find and connect with other journal writers
        </Typography>
      </Box>

      {/* Enhanced Search Bar */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#667eea' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                }
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(102, 126, 234, 0.6)'
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                color: 'white'
              }
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 6 }}>
          <CircularProgress
            size={60}
            sx={{
              color: '#667eea',
              mb: 2
            }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Searching for users...
          </Typography>
        </Box>
      )}

      {!loading && searched && users.length === 0 && (
        <Fade in timeout={400}>
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          >
            <SearchIcon
              sx={{
                fontSize: 64,
                color: 'rgba(102, 126, 234, 0.3)',
                mb: 2
              }}
            />
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              No users found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No users found matching '<strong>{searchTerm}</strong>'. Try a different search term.
            </Typography>
          </Box>
        </Fade>
      )}

      {!loading && users.length > 0 && (
        <Fade in timeout={600}>
          <Grid container spacing={3}>
            {users.map((user, index) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <Slide direction="up" in timeout={300 + index * 100}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%)'
                      }
                    }}
                    onClick={() => handleUserClick(user)}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar
                        src={getProfilePhotoUrl(user.profilePicture)}
                        sx={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        {getInitials(user.name)}
                      </Avatar>

                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: '#2d3748',
                          mb: 1
                        }}
                      >
                        {user.name}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <EmailIcon sx={{ fontSize: 16, color: '#667eea', mr: 1 }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.9rem' }}
                        >
                          {user.email}
                        </Typography>
                      </Box>

                      {user.roles && (
                        <Box sx={{ mb: 2 }}>
                          {user.roles.map(role => (
                            <Chip
                              key={role.name}
                              label={role.name.replace('ROLE_', '')}
                              size="small"
                              icon={role.name === 'ROLE_ADMIN' ? <AdminIcon /> : <PersonIcon />}
                              sx={{
                                mr: 0.5,
                                background: role.name === 'ROLE_ADMIN'
                                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  color: 'white'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexDirection: 'column' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${user.id}`);
                          }}
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: '#388e3c',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUserJournals(user.id);
                          }}
                          sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: '#5a67d8',
                              backgroundColor: 'rgba(102, 126, 234, 0.05)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          View Journals
                        </Button>
                        <Box onClick={(e) => e.stopPropagation()}>
                          {renderFriendButton(user.id)}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}

      {/* User Detail Dialog */}
      <Dialog
        open={userDetailOpen}
        onClose={handleCloseUserDetail}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }} src={getProfilePhotoUrl(selectedUser.profilePicture)}>
                      {getInitials(selectedUser.name)}
                    </Avatar>
                  }
                  title={selectedUser.name}
                  subheader={selectedUser.email}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>User ID:</strong> {selectedUser.id}
                  </Typography>
                  {selectedUser.roles && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Roles:</strong> {selectedUser.roles.map(role => role.name.replace('ROLE_', '')).join(', ')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Status:</strong> {selectedUser.enabled ? 'Active' : 'Blocked'}
                  </Typography>
                </CardContent>
              </Card>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewUserJournals(selectedUser.id)}
                >
                  View Journals
                </Button>
                {renderFriendButton(selectedUser.id)}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseUserDetail}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserSearch;