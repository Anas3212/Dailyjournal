import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
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
  Grid,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Groups as TeamsIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { getTeamCommunities, searchTeamCommunities, getTeamsByCommunity } from '../services/api';
import { useNavigate } from 'react-router-dom';

function TeamCommunities({ open, onClose, currentUser }) {
  const [teamCommunities, setTeamCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCommunityTeams, setSelectedCommunityTeams] = useState([]);
  const [selectedCommunityName, setSelectedCommunityName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchTeamCommunities();
    }
  }, [open]);

  const fetchTeamCommunities = async () => {
    setLoading(true);
    try {
      const response = await getTeamCommunities();
      setTeamCommunities(response.data || []);
    } catch (error) {
      console.error('Error fetching team communities:', error);
      setTeamCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const searchTeamCommunitiesAPI = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await searchTeamCommunities(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching team communities:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchTeamCommunitiesAPI(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleCommunityAction = async (community) => {
    setSearchLoading(true);
    try {
      const response = await getTeamsByCommunity(community.name);
      setSelectedCommunityTeams(response.data || []);
      setSelectedCommunityName(community.name);
      // Ensure teams are shown by switching to the Explore tab where the list is rendered
      setTabValue(1);
    } catch (error) {
      console.error('Error fetching community teams:', error);
      setSelectedCommunityTeams([]);
      setSelectedCommunityName('');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/teams/${teamId}`);
    onClose();
  };

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
          <TeamsIcon />
          <Typography variant="h6">Team Communities</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab 
            icon={<GroupIcon />} 
            label="My Team Communities" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<SearchIcon />} 
            label="Explore Communities" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 0 }}>
        {/* My Team Communities Tab */}
        {tabValue === 0 && (
          <>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                Communities from teams you're part of
              </Typography>
            </Box>
            
            <Divider />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : teamCommunities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TeamsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Team Communities Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join teams with community associations to see them here
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2, maxHeight: 500, overflow: 'auto' }}>
                {teamCommunities.map((community, index) => (
                  <Card 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      '&:hover': { boxShadow: 3 },
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {community.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {community.description}
                          </Typography>
                          <Chip
                            icon={<TeamsIcon />}
                            label={`${community.teamCount} teams`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCommunityAction(community)}
                          sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            ml: 2,
                            '&:hover': {
                              borderColor: '#764ba2',
                              backgroundColor: 'rgba(102, 126, 234, 0.1)'
                            }
                          }}
                        >
                          View Teams
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Explore Communities Tab */}
        {tabValue === 1 && (
          <>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                placeholder="Search for team communities..."
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
            ) : selectedCommunityName && selectedCommunityTeams.length > 0 ? (
              <>
                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Chip
                    icon={<TeamsIcon />}
                    label={`Teams in ${selectedCommunityName}`}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Teams from this community
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box sx={{ p: 3, maxHeight: 500, overflow: 'auto' }}>
                  <Grid container spacing={3}>
                    {selectedCommunityTeams.map((team) => (
                      <Grid item xs={12} sm={6} md={4} key={team.teamId}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
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
                            sx={{
                              width: 60,
                              height: 60,
                              mb: 2,
                              mx: 'auto',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}
                          >
                            {team.teamName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {team.teamName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Owner: {team.ownerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {team.memberCount} members
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewTeam(team.teamId)}
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
                            View Team
                          </Button>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
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
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {community.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {community.description}
                          </Typography>
                          <Chip
                            icon={<TeamsIcon />}
                            label={`${community.teamCount} teams`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCommunityAction(community)}
                          sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            ml: 2,
                            '&:hover': {
                              borderColor: '#764ba2',
                              backgroundColor: 'rgba(102, 126, 234, 0.1)'
                            }
                          }}
                        >
                          Explore
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TeamsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Discover Team Communities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search for team communities by name, organization, or type
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TeamCommunities;
