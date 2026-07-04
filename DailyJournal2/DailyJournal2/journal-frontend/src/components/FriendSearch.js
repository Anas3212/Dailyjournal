import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, CircularProgress, Chip, Card, CardContent,
  InputAdornment, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { getMyFriends } from '../services/api';

const FriendSearch = ({ onUserSelect, excludeUserIds = [] }) => {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    // Filter friends based on search term and exclude already invited/member users
    const filtered = friends.filter(friend => {
      const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           friend.email.toLowerCase().includes(searchTerm.toLowerCase());
      const notExcluded = !excludeUserIds.includes(friend.id);
      return matchesSearch && notExcluded;
    });
    setFilteredFriends(filtered);
  }, [friends, searchTerm, excludeUserIds]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyFriends();
      setFriends(response.data || []);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
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

  const handleSelectFriend = (friend) => {
    onUserSelect(friend);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (friends.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Friends Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You need to add friends before you can invite them to your team.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select friends from your friends list to invite to the team.
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search friends by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {filteredFriends.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? `No friends found matching "${searchTerm}"` 
                : 'All friends are already team members or have pending invites'
              }
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredFriends.map((friend) => (
              <ListItem
                key={friend.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleSelectFriend(friend)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }} src={getProfilePhotoUrl(friend.profilePicture)}>
                    {getInitials(friend.name)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={friend.name}
                  secondary={friend.email}
                />
                <Chip 
                  label="Friend" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFriend(friend);
                  }}
                >
                  Invite
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default FriendSearch;
