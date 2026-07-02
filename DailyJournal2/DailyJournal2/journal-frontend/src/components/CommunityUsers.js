import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Button,
  Divider,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { getCommunityMembers, getCommunityMembersByName, searchCommunities } from '../services/api';
import { useNavigate } from 'react-router-dom';

function CommunityUsers({ open, onClose, currentUser }) {
  const [communityMembers, setCommunityMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentViewedCommunity, setCurrentViewedCommunity] = useState('');
  const [searchedCommunityMembers, setSearchedCommunityMembers] = useState([]);
  const [searchedCommunityName, setSearchedCommunityName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (open && currentUser?.community) {
      fetchCommunityMembers();
    }
  }, [open, currentUser]);

  const fetchCommunityMembers = async () => {
    setLoading(true);
    try {
      const response = await getCommunityMembers();
      setCommunityMembers(response.data || []);
      setCurrentViewedCommunity(currentUser?.community || '');
    } catch (error) {
      console.error('Error fetching community members:', error);
      setCommunityMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/users/${userId}`);
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const searchCommunitiesAPI = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchedCommunityMembers([]);
      setSearchedCommunityName('');
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await searchCommunities(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching communities:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSearchedCommunityMembers([]);
    setSearchedCommunityName('');
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchCommunitiesAPI(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return undefined;
    // Handle both full URLs and relative paths
    if (profilePicture.startsWith('http')) {
      return `${profilePicture}?t=${Date.now()}`;
    }
    const filename = profilePicture.split('/').pop();
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  const handleCommunityAction = async (community) => {
    if (community.isOwnCommunity) {
      // View members of user's own community
      setTabValue(0); // Switch to "My Community" tab
      await fetchCommunityMembers();
    } else {
      // View members of the selected community in search tab
      setSearchLoading(true);
      try {
        const response = await getCommunityMembersByName(community.name);
        setSearchedCommunityMembers(response.data || []);
        setSearchedCommunityName(community.name);
        // Stay in search tab - don't switch tabs
      } catch (error) {
        console.error('Error fetching community members:', error);
        setSearchedCommunityMembers([]);
        setSearchedCommunityName('');
      } finally {
        setSearchLoading(false);
      }
    }
  };

  if (!currentUser?.community) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            <Typography variant="h6">Community Members</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Community Set
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a community to your profile to connect with others from the same area, institution, or organization.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
          width: '95vw',
          maxWidth: '1200px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          <Typography variant="h6">Community Hub</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab 
            icon={<GroupIcon />} 
            label="My Community" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<SearchIcon />} 
            label="Search Communities" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 0 }}>
        {/* My Community Tab */}
        {tabValue === 0 && (
          <>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Chip
                icon={<BusinessIcon />}
                label={currentUser.community}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Members from your community
              </Typography>
            </Box>
            
            <Divider />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : communityMembers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Community Members Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You're the first one from "{currentUser.community}" to join!
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3, maxHeight: 500, overflow: 'auto' }}>
                <Grid container spacing={3}>
                  {communityMembers.map((member) => (
                    <Grid item xs={12} sm={6} md={4} key={member.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          p: 2,
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <Avatar
                          src={getProfilePhotoUrl(member.profilePicture)}
                          sx={{
                            width: 80,
                            height: 80,
                            mb: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.5rem'
                          }}
                        >
                          {getInitials(member.name)}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {member.id === currentUser?.id ? `${member.name} (You)` : member.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {member.email}
                        </Typography>
                        {member.id === currentUser?.id ? (
                          <Button
                            variant="contained"
                            size="small"
                            disabled
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              mt: 'auto',
                              '&.Mui-disabled': {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                opacity: 0.8
                              }
                            }}
                          >
                            You
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewProfile(member.id)}
                            sx={{
                              borderColor: '#667eea',
                              color: '#667eea',
                              mt: 'auto',
                              '&:hover': {
                                borderColor: '#764ba2',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)'
                              }
                            }}
                          >
                            View Profile
                          </Button>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {communityMembers.length} member{communityMembers.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          </>
        )}

        {/* Search Communities Tab */}
        {tabValue === 1 && (
          <>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                placeholder="Search for communities..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
              />
            </Box>
            
            <Divider />
            
            {searchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : searchedCommunityName && searchedCommunityMembers.length > 0 ? (
              <>
                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Chip
                    icon={<BusinessIcon />}
                    label={`Members of ${searchedCommunityName}`}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Viewing members from this community
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box sx={{ p: 3, maxHeight: 500, overflow: 'auto' }}>
                  <Grid container spacing={3}>
                    {searchedCommunityMembers.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            p: 2,
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            '&:hover': { 
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                              cursor: 'pointer'
                            }
                          }}
                        >
                          <Avatar
                            src={getProfilePhotoUrl(member.profilePicture)}
                            sx={{
                              width: 80,
                              height: 80,
                              mb: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.5rem'
                            }}
                          >
                            {getInitials(member.name)}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {member.id === currentUser?.id ? `${member.name} (You)` : member.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {member.email}
                          </Typography>
                          {member.id === currentUser?.id ? (
                            <Button
                              variant="contained"
                              size="small"
                              disabled
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                mt: 'auto',
                                '&.Mui-disabled': {
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  opacity: 0.8
                                }
                              }}
                            >
                              You
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => handleViewProfile(member.id)}
                              sx={{
                                borderColor: '#667eea',
                                color: '#667eea',
                                mt: 'auto',
                                '&:hover': {
                                  borderColor: '#764ba2',
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                }
                              }}
                            >
                              View Profile
                            </Button>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {searchedCommunityMembers.length} member{searchedCommunityMembers.length !== 1 ? 's' : ''} found in {searchedCommunityName}
                  </Typography>
                </Box>
              </>
            ) : searchQuery && searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Communities Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try searching with different keywords
                </Typography>
              </Box>
            ) : searchResults.length > 0 ? (
              <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                {searchResults.map((community, index) => (
                  <Card 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      '&:hover': { boxShadow: 3 },
                      border: community.isOwnCommunity ? '2px solid #667eea' : '1px solid #e0e0e0',
                      background: community.isOwnCommunity ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' : 
                        'white'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {community.name}
                            </Typography>
                            {community.isOwnCommunity && (
                              <Chip
                                label="Your Community"
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {community.description}
                          </Typography>
                          <Chip
                            icon={<GroupIcon />}
                            label={`${community.memberCount} members`}
                            size="small"
                            sx={{
                              backgroundColor: community.isOwnCommunity ? 
                                'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: community.isOwnCommunity ? 600 : 400
                            }}
                          />
                        </Box>
                        <Button
                          variant={community.isOwnCommunity ? "contained" : "outlined"}
                          size="small"
                          onClick={() => handleCommunityAction(community)}
                          sx={{
                            borderColor: '#667eea',
                            color: community.isOwnCommunity ? 'white' : '#667eea',
                            background: community.isOwnCommunity ? 
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            ml: 2,
                            '&:hover': {
                              borderColor: '#764ba2',
                              backgroundColor: community.isOwnCommunity ? 
                                'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' : 
                                'rgba(102, 126, 234, 0.1)'
                            }
                          }}
                        >
                          {community.isOwnCommunity ? 'View Members' : 'Explore'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Discover Communities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search for communities by name, organization, or location
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CommunityUsers;
