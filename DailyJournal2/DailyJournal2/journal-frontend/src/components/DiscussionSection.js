import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Reply as ReplyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Forum as ForumIcon,
  Add as AddIcon,
  Sort as SortIcon,
  PushPin as PinIcon,
  Lock as LockIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import DiscussionDialog from './DiscussionDialog';
import DiscussionAnswerDialog from './DiscussionAnswerDialog';
import DiscussionViewer from './DiscussionViewer';

const DiscussionSection = ({ journalId, journalTitle, journalAuthorId }) => {
  const { user } = useContext(AuthContext);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set());
  const [sortBy, setSortBy] = useState('');
  const [discussionStats, setDiscussionStats] = useState({
    discussionCount: 0,
    totalAnswers: 0,
    totalVotes: 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discussionToDelete, setDiscussionToDelete] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMenuDiscussion, setSelectedMenuDiscussion] = useState(null);

  useEffect(() => {
    if (journalId) {
      fetchDiscussions();
      fetchDiscussionStats();
    }
  }, [journalId, sortBy]);

  const fetchDiscussions = async () => {
    try {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/journal/${journalId}?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions || []);
      } else {
        throw new Error('Failed to fetch discussions');
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setSnackbar({ open: true, message: 'Failed to load discussions', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussionStats = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/journal/${journalId}/stats`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiscussionStats(data);
      }
    } catch (error) {
      console.error('Error fetching discussion stats:', error);
    }
  };

  const handleCreateDiscussion = () => {
    // Check if user has reached the limit of 3 discussions for this journal
    const userDiscussions = discussions.filter(d => d.authorId === user?.id);
    if (userDiscussions.length >= 3) {
      setSnackbar({ 
        open: true, 
        message: 'You can only create up to 3 discussions per journal', 
        severity: 'warning' 
      });
      return;
    }
    setCreateDialogOpen(true);
  };

  const handleDiscussionCreated = (newDiscussion) => {
    setDiscussions(prev => [newDiscussion, ...prev]);
    setDiscussionStats(prev => ({ ...prev, discussionCount: prev.discussionCount + 1 }));
    setCreateDialogOpen(false);
    setSnackbar({ open: true, message: 'Discussion created successfully!', severity: 'success' });
  };

  const handleAnswerDiscussion = (discussion) => {
    setSelectedDiscussion(discussion);
    setAnswerDialogOpen(true);
  };

  const handleViewDiscussion = (discussionId) => {
    setSelectedDiscussionId(discussionId);
    setViewerDialogOpen(true);
  };

  const handleAnswerCreated = (answer) => {
    // Update the discussion's answer count
    setDiscussions(prev => prev.map(disc => 
      disc.id === answer.discussionId 
        ? { ...disc, answerCount: (disc.answerCount || 0) + 1 }
        : disc
    ));
    setAnswerDialogOpen(false);
    setSnackbar({ open: true, message: 'Answer posted successfully!', severity: 'success' });
  };

  const handleEditDiscussion = (discussion) => {
    setEditingDiscussion(discussion);
    setEditDialogOpen(true);
  };

  const handleDiscussionUpdated = (updatedDiscussion) => {
    setDiscussions(prev => prev.map(disc => 
      disc.id === updatedDiscussion.id ? updatedDiscussion : disc
    ));
    setEditDialogOpen(false);
    setEditingDiscussion(null);
    setSnackbar({ open: true, message: 'Discussion updated successfully!', severity: 'success' });
  };

  const handleDeleteDiscussion = (discussion) => {
    setDiscussionToDelete(discussion);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDiscussion = async () => {
    if (!discussionToDelete) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussionToDelete.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setDiscussions(prev => prev.filter(disc => disc.id !== discussionToDelete.id));
        setDiscussionStats(prev => ({ ...prev, discussionCount: prev.discussionCount - 1 }));
        setDeleteDialogOpen(false);
        setDiscussionToDelete(null);
        setSnackbar({ open: true, message: 'Discussion deleted successfully!', severity: 'success' });
      } else {
        throw new Error('Failed to delete discussion');
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
      setSnackbar({ open: true, message: 'Failed to delete discussion', severity: 'error' });
    }
  };

  const handleMenuOpen = (event, discussion) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMenuDiscussion(discussion);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMenuDiscussion(null);
  };

  const handleMenuEdit = () => {
    if (selectedMenuDiscussion) {
      handleEditDiscussion(selectedMenuDiscussion);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (selectedMenuDiscussion) {
      handleDeleteDiscussion(selectedMenuDiscussion);
    }
    handleMenuClose();
  };

  const handleVote = async (discussionId, voteType) => {
    console.log('Vote attempt:', { discussionId, voteType, user: user?.id });
    
    if (!user) {
      setSnackbar({ open: true, message: 'Please log in to vote', severity: 'warning' });
      return;
    }
    
    if (!user) {
      setSnackbar({ open: true, message: 'User information not available', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussionId}/vote`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ voteType })
        }
      );

      if (response.ok) {
        // Refresh discussions to get updated vote scores
        fetchDiscussions();
        setSnackbar({ open: true, message: 'Vote recorded!', severity: 'success' });
      } else {
        const errorData = await response.json();
        console.error('Vote failed:', errorData);
        setSnackbar({ open: true, message: errorData.error || 'Failed to vote', severity: 'error' });
      }
    } catch (error) {
      console.error('Error voting:', error);
      setSnackbar({ open: true, message: 'Failed to vote', severity: 'error' });
    }
  };

  const handleToggleExpanded = (discussionId) => {
    setExpandedDiscussions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    const filename = profilePicture.includes('/') 
      ? profilePicture.split('/').pop() 
      : profilePicture;
    return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ForumIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Discussions
          </Typography>
          <Chip 
            label={discussionStats.discussionCount || 0} 
            size="small" 
            sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }} 
          />
          {user && (
            <Chip 
              label={`${discussions.filter(d => d.authorId === user?.id).length}/3 your discussions`}
              size="small" 
              variant="outlined"
              sx={{ ml: 1 }} 
            />
          )}
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SortIcon />}
            onClick={() => setSortBy(sortBy === 'votes' ? '' : 'votes')}
            sx={{ textTransform: 'none' }}
          >
            {sortBy === 'votes' ? 'Default' : 'By Votes'}
          </Button>
          
          {user && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDiscussion}
              sx={{ 
                textTransform: 'none',
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              }}
            >
              Start Discussion
            </Button>
          )}
        </Stack>
      </Box>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No discussions yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Be the first to start a discussion about this journal!
            </Typography>
            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateDiscussion}
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                }}
              >
                Start Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {discussions.map((discussion) => (
            <Card 
              key={discussion.id} 
              elevation={2}
              sx={{ 
                position: 'relative',
                '&:hover': { boxShadow: 4 },
                border: discussion.isPinned ? '2px solid' : '1px solid',
                borderColor: discussion.isPinned ? 'primary.main' : 'divider'
              }}
            >
              <CardContent>
                {/* Discussion Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    src={getProfilePhotoUrl(discussion.authorProfilePicture)}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 2,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {getInitials(discussion.authorName)}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {discussion.isPinned && (
                        <Tooltip title="Pinned Discussion">
                          <PinIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                        </Tooltip>
                      )}
                      {discussion.isLocked && (
                        <Tooltip title="Locked Discussion">
                          <LockIcon sx={{ fontSize: 16, color: 'warning.main', mr: 1 }} />
                        </Tooltip>
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {discussion.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {discussion.authorName} • {formatDate(discussion.createdAt)}
                      {discussion.isEdited && (
                        <Chip label="edited" size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
                      )}
                    </Typography>
                  </Box>
                  
                  {/* Edit/Delete Menu for Discussion Author */}
                  {user?.id === discussion.authorId && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, discussion)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Box>

                {/* Discussion Content */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: expandedDiscussions.has(discussion.id) ? 'none' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {discussion.content}
                </Typography>

                {/* Expand/Collapse Button */}
                {discussion.content.length > 200 && (
                  <Button
                    size="small"
                    onClick={() => handleToggleExpanded(discussion.id)}
                    sx={{ mb: 2, textTransform: 'none' }}
                  >
                    {expandedDiscussions.has(discussion.id) ? (
                      <>Show Less <ExpandLessIcon /></>
                    ) : (
                      <>Show More <ExpandMoreIcon /></>
                    )}
                  </Button>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Discussion Stats and Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {/* Vote Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleVote(discussion.id, 'UPVOTE')}
                        disabled={!user || discussion.authorId === user?.id}
                        color={discussion.userVoteType === 'UPVOTE' ? 'primary' : 'default'}
                        sx={{ 
                          '&:disabled': { 
                            opacity: 0.5,
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                        {discussion.voteScore || 0}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleVote(discussion.id, 'DOWNVOTE')}
                        disabled={!user || discussion.authorId === user?.id}
                        color={discussion.userVoteType === 'DOWNVOTE' ? 'error' : 'default'}
                        sx={{ 
                          '&:disabled': { 
                            opacity: 0.5,
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Stats */}
                    <Chip 
                      label={`${discussion.answerCount || 0} answers`} 
                      size="small" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${discussion.viewCount || 0} views`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Stack>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDiscussion(discussion.id)}
                      sx={{ textTransform: 'none' }}
                      variant="outlined"
                    >
                      View Discussion
                    </Button>
                    {user && !discussion.isLocked && (
                      <Button
                        size="small"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleAnswerDiscussion(discussion)}
                        sx={{ textTransform: 'none' }}
                      >
                        Answer
                      </Button>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Create Discussion Dialog */}
      <DiscussionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onDiscussionCreated={handleDiscussionCreated}
        journalId={journalId}
        journalTitle={journalTitle}
      />

      {/* Answer Discussion Dialog */}
      <DiscussionAnswerDialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        onAnswerCreated={handleAnswerCreated}
        discussion={selectedDiscussion}
      />

      {/* Discussion Viewer Dialog */}
      <Dialog
        open={viewerDialogOpen}
        onClose={() => setViewerDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Discussion & Answers
          </Typography>
          <IconButton
            onClick={() => setViewerDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {selectedDiscussionId && (
            <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
              <DiscussionViewer 
                discussionId={selectedDiscussionId}
                onClose={() => setViewerDialogOpen(false)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Delete Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Discussion Dialog */}
      <DiscussionDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingDiscussion(null);
        }}
        onDiscussionCreated={handleDiscussionUpdated}
        journalId={journalId}
        journalTitle={journalTitle}
        editMode={true}
        existingDiscussion={editingDiscussion}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Discussion
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this discussion? This action cannot be undone.
          </Typography>
          {discussionToDelete && (
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {discussionToDelete.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {discussionToDelete.content.substring(0, 100)}...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDiscussion}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete Discussion
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DiscussionSection;
