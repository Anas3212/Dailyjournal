import React, { useContext, useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Badge, Avatar, Chip, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BookIcon from '@mui/icons-material/Book';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SecurityIcon from '@mui/icons-material/Security';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getPendingRequestCount } from '../services/api';
import CommunityUsers from './CommunityUsers';
import TeamCommunities from './TeamCommunities';
import SessionManager from './SessionManager';

function MyAppBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [communityDialogOpen, setCommunityDialogOpen] = useState(false);
  const [teamCommunityDialogOpen, setTeamCommunityDialogOpen] = useState(false);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const isAdmin = user && user.roles && user.roles.some(role => role.name === 'ROLE_ADMIN');

  useEffect(() => {
    if (user) {
      fetchPendingRequestCount();
      // Set up interval to refresh count every 30 seconds
      const interval = setInterval(fetchPendingRequestCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingRequestCount = async () => {
    try {
      const response = await getPendingRequestCount();
      setPendingRequestCount(response.data.count);
    } catch (error) {
      console.error('Error fetching pending request count:', error);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCommunityClick = () => {
    setCommunityDialogOpen(true);
  };

  const handleTeamCommunityClick = () => {
    setTeamCommunityDialogOpen(true);
  };

  return (
    <AppBar 
      position="static" 
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: '70px !important' }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ 
            mr: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
          onClick={handleMenu}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem component={Link} to="/dashboard" onClick={handleClose}>Dashboard</MenuItem>
          {user && <MenuItem component={Link} to="/published" onClick={handleClose}>Published Journals</MenuItem>}
          {user && <MenuItem component={Link} to="/workshop" onClick={handleClose}>Workshop</MenuItem>}
          {user && <MenuItem component={Link} to="/profile" onClick={handleClose}>Profile</MenuItem>}
          {user && <MenuItem component={Link} to="/search-users" onClick={handleClose}>User Search</MenuItem>}
          {user && <MenuItem component={Link} to="/teams" onClick={handleClose}>Teams</MenuItem>}
          {user && (
            <MenuItem 
              onClick={() => {
                handleClose();
                handleCommunityClick();
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <BusinessIcon sx={{ fontSize: 20 }} />
              Community
            </MenuItem>
          )}
          {user && (
            <MenuItem 
              onClick={() => {
                handleClose();
                handleTeamCommunityClick();
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <GroupsIcon sx={{ fontSize: 20 }} />
              Team Communities
            </MenuItem>
          )}
          {user && (
            <MenuItem component={Link} to="/friend-requests" onClick={handleClose}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Friend Requests
                {pendingRequestCount > 0 && (
                  <Badge badgeContent={pendingRequestCount} color="error" variant="dot" />
                )}
              </Box>
            </MenuItem>
          )}
          {isAdmin && <MenuItem component={Link} to="/admin" onClick={handleClose}>Admin</MenuItem>}
        </Menu>
        <Box 
          component={Link} 
          to="/dashboard" 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box
            sx={{
              width: 45,
              height: 45,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <BookIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              fontSize: '1.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Daily Journal
          </Typography>
        </Box>
        {user && (
          <>
            {/* User Welcome Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box sx={{ mr: 2, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    lineHeight: 1
                  }}
                >
                  Welcome back,
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    lineHeight: 1
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
              </Box>
              
              {/* User Avatar */}
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: 600,
                  mr: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <AccountCircleIcon />}
              </Avatar>
            </Box>

            {/* Notifications */}
            <IconButton
              color="inherit"
              component={Link}
              to="/friend-requests"
              sx={{ 
                mr: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              <Badge 
                badgeContent={pendingRequestCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff4757',
                    color: 'white',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
                    animation: pendingRequestCount > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(1)',
                        opacity: 1
                      },
                      '50%': {
                        transform: 'scale(1.1)',
                        opacity: 0.8
                      },
                      '100%': {
                        transform: 'scale(1)',
                        opacity: 1
                      }
                    }
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Session Management */}
            <Tooltip title="Manage Sessions">
              <IconButton
                color="inherit"
                onClick={() => setSessionManagerOpen(true)}
                sx={{
                  mr: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <SecurityIcon />
              </IconButton>
            </Tooltip>

          </>
        )}
        {user ? (
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            Logout
          </Button>
        ) : (
          <>
            <Button 
              color="inherit" 
              component={Link} 
              to="/login"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                mr: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/register"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              Register
            </Button>
          </>
        )}
      </Toolbar>
      
      {/* Community Users Dialog */}
      <CommunityUsers
        open={communityDialogOpen}
        onClose={() => setCommunityDialogOpen(false)}
        currentUser={user}
      />
      
      {/* Team Communities Dialog */}
      <TeamCommunities
        open={teamCommunityDialogOpen}
        onClose={() => setTeamCommunityDialogOpen(false)}
        currentUser={user}
      />
      
      {/* Session Manager Dialog */}
      <SessionManager
        open={sessionManagerOpen}
        onClose={() => setSessionManagerOpen(false)}
      />
    </AppBar>
  );
}

export default MyAppBar;