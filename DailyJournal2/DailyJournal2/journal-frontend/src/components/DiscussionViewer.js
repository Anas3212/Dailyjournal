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
  Collapse,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Reply as ReplyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as AcceptedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import DiscussionAnswerDialog from './DiscussionAnswerDialog';

const DiscussionViewer = ({ discussionId, onClose }) => {
  const { user } = useContext(AuthContext);
  const [discussion, setDiscussion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState(new Set());
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [editAnswerDialogOpen, setEditAnswerDialogOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [deleteAnswerDialogOpen, setDeleteAnswerDialogOpen] = useState(false);
  const [answerToDelete, setAnswerToDelete] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMenuAnswer, setSelectedMenuAnswer] = useState(null);

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion();
      fetchAnswers();
    }
  }, [discussionId, sortBy]);

  const fetchDiscussion = async () => {
    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussionId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussion(data);
      } else {
        throw new Error('Failed to fetch discussion');
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
      setSnackbar({ open: true, message: 'Failed to load discussion', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    setAnswersLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussionId}/answers?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnswers(data.answers || []);
      } else {
        throw new Error('Failed to fetch answers');
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
      setSnackbar({ open: true, message: 'Failed to load answers', severity: 'error' });
    } finally {
      setAnswersLoading(false);
    }
  };

  const handleVoteDiscussion = async (voteType) => {
    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        fetchDiscussion();
        setSnackbar({ open: true, message: 'Vote recorded!', severity: 'success' });
      } else {
        throw new Error('Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setSnackbar({ open: true, message: 'Failed to vote', severity: 'error' });
    }
  };

  const handleVoteAnswer = async (answerId, voteType) => {
    console.log('Answer vote attempt:', { answerId, voteType, user: user?.id });
    
    if (!user) {
      setSnackbar({ open: true, message: 'Please log in to vote', severity: 'warning' });
      return;
    }
    
    if (!user) {
      setSnackbar({ open: true, message: 'User information not available', severity: 'warning' });
      return;
    }

    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/answers/${answerId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        fetchAnswers();
        setSnackbar({ open: true, message: 'Vote recorded!', severity: 'success' });
      } else {
        const errorData = await response.json();
        console.error('Answer vote failed:', errorData);
        setSnackbar({ open: true, message: errorData.error || 'Failed to vote', severity: 'error' });
      }
    } catch (error) {
      console.error('Error voting on answer:', error);
      setSnackbar({ open: true, message: 'Failed to vote', severity: 'error' });
    }
  };

  const handleReplyToAnswer = (answer) => {
    setSelectedAnswer(answer);
    setReplyDialogOpen(true);
  };

  const handleAnswerDiscussion = () => {
    setAnswerDialogOpen(true);
  };

  const handleAnswerCreated = () => {
    fetchAnswers();
    fetchDiscussion(); // Refresh to update answer count
    setAnswerDialogOpen(false);
    setReplyDialogOpen(false);
    setEditAnswerDialogOpen(false);
    setEditingAnswer(null);
    setSnackbar({ open: true, message: 'Answer posted successfully!', severity: 'success' });
  };

  const handleEditAnswer = (answer) => {
    setEditingAnswer(answer);
    setEditAnswerDialogOpen(true);
  };

  const handleAnswerUpdated = (updatedAnswer) => {
    const updateAnswerInTree = (answers) => {
      return answers.map(answer => {
        if (answer.id === updatedAnswer.id) {
          // Update the answer while preserving its replies
          return { ...updatedAnswer, replies: answer.replies };
        } else if (answer.replies && answer.replies.length > 0) {
          // Recursively update replies
          return { ...answer, replies: updateAnswerInTree(answer.replies) };
        }
        return answer;
      });
    };

    setAnswers(prev => updateAnswerInTree(prev));
    setEditAnswerDialogOpen(false);
    setEditingAnswer(null);
    setSnackbar({ open: true, message: 'Answer updated successfully!', severity: 'success' });
  };

  const handleDeleteAnswer = (answer) => {
    setAnswerToDelete(answer);
    setDeleteAnswerDialogOpen(true);
  };

  const confirmDeleteAnswer = async () => {
    if (!answerToDelete) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/answers/${answerToDelete.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setAnswers(prev => prev.filter(answer => answer.id !== answerToDelete.id));
        fetchDiscussion(); // Refresh to update answer count
        setDeleteAnswerDialogOpen(false);
        setAnswerToDelete(null);
        setSnackbar({ open: true, message: 'Answer deleted successfully!', severity: 'success' });
      } else {
        throw new Error('Failed to delete answer');
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      setSnackbar({ open: true, message: 'Failed to delete answer', severity: 'error' });
    }
  };

  const handleMenuOpen = (event, answer) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMenuAnswer(answer);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMenuAnswer(null);
  };

  const handleMenuEdit = () => {
    if (selectedMenuAnswer) {
      handleEditAnswer(selectedMenuAnswer);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (selectedMenuAnswer) {
      handleDeleteAnswer(selectedMenuAnswer);
    }
    handleMenuClose();
  };

  const handleToggleExpandAnswer = (answerId) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
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
    const filename = profilePicture.includes('/') 
      ? profilePicture.split('/').pop() 
      : profilePicture;
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  const renderAnswer = (answer, isReply = false) => (
    <Card 
      key={answer.id}
      elevation={isReply ? 1 : 2}
      sx={{ 
        ml: isReply ? 4 : 0,
        mb: 2,
        border: answer.isAccepted ? '2px solid' : '1px solid',
        borderColor: answer.isAccepted ? 'success.main' : 'divider'
      }}
    >
      <CardContent>
        {/* Answer Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={getProfilePhotoUrl(answer.authorProfilePicture)}
            sx={{ 
              width: isReply ? 32 : 40, 
              height: isReply ? 32 : 40, 
              mr: 2,
              bgcolor: 'primary.main'
            }}
          >
            {getInitials(answer.authorName)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {answer.isAccepted && (
                <Tooltip title="Accepted Answer">
                  <AcceptedIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                </Tooltip>
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {answer.authorName}
              </Typography>
              {answer.isAccepted && (
                <Chip 
                  label="Accepted" 
                  size="small" 
                  color="success" 
                  sx={{ ml: 1, fontSize: '0.7rem' }} 
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {formatDate(answer.createdAt)}
              {answer.isEdited && (
                <Chip label="edited" size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
              )}
            </Typography>
          </Box>
          
          {/* Edit/Delete Menu for Answer Author */}
          {user?.id === answer.authorId && (
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, answer)}
              sx={{ alignSelf: 'flex-start' }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        {/* Answer Content */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: expandedAnswers.has(answer.id) ? 'none' : 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {answer.content}
        </Typography>

        {/* Expand/Collapse Button */}
        {answer.content.length > 300 && (
          <Button
            size="small"
            onClick={() => handleToggleExpandAnswer(answer.id)}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            {expandedAnswers.has(answer.id) ? (
              <>Show Less <ExpandLessIcon /></>
            ) : (
              <>Show More <ExpandMoreIcon /></>
            )}
          </Button>
        )}

        {/* Answer Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Vote Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => handleVoteAnswer(answer.id, 'UPVOTE')}
                disabled={!user || answer.authorId === user?.id}
                color={answer.userVoteType === 'UPVOTE' ? 'primary' : 'default'}
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
                {answer.voteScore || 0}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleVoteAnswer(answer.id, 'DOWNVOTE')}
                disabled={!user || answer.authorId === user?.id}
                color={answer.userVoteType === 'DOWNVOTE' ? 'error' : 'default'}
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

            {answer.replyCount > 0 && (
              <Chip 
                label={`${answer.replyCount} replies`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            {user && !discussion?.isLocked && !isReply && (
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => handleReplyToAnswer(answer)}
                sx={{ textTransform: 'none' }}
              >
                Reply
              </Button>
            )}
          </Stack>
        </Box>

        {/* Replies */}
        {answer.replies && answer.replies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {answer.replies.map(reply => renderAnswer(reply, true))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!discussion) {
    return (
      <Alert severity="error">
        Discussion not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Discussion Header */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              src={getProfilePhotoUrl(discussion.authorProfilePicture)}
              sx={{ 
                width: 48, 
                height: 48, 
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
                    <PinIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
                  </Tooltip>
                )}
                {discussion.isLocked && (
                  <Tooltip title="Locked Discussion">
                    <LockIcon sx={{ fontSize: 18, color: 'warning.main', mr: 1 }} />
                  </Tooltip>
                )}
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
          </Box>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {discussion.content}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Discussion Stats and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Vote Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => handleVoteDiscussion('UPVOTE')}
                  disabled={!user || discussion.authorId === user?.id}
                  color={discussion.userVoteType === 'UPVOTE' ? 'primary' : 'default'}
                >
                  <ThumbUpIcon />
                </IconButton>
                <Typography variant="h6" sx={{ mx: 1, minWidth: 30, textAlign: 'center' }}>
                  {discussion.voteScore || 0}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleVoteDiscussion('DOWNVOTE')}
                  disabled={!user || discussion.authorId === user?.id}
                  color={discussion.userVoteType === 'DOWNVOTE' ? 'error' : 'default'}
                >
                  <ThumbDownIcon />
                </IconButton>
              </Box>

              {/* Stats */}
              <Chip 
                label={`${discussion.answerCount || 0} answers`} 
                size="medium" 
                variant="outlined" 
              />
              <Chip 
                label={`${discussion.viewCount || 0} views`} 
                size="medium" 
                variant="outlined" 
              />
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSortBy(sortBy === 'votes' ? '' : 'votes')}
                sx={{ textTransform: 'none' }}
              >
                {sortBy === 'votes' ? 'Default Sort' : 'Sort by Votes'}
              </Button>
              
              {user && !discussion.isLocked && (
                <Button
                  variant="contained"
                  startIcon={<ReplyIcon />}
                  onClick={handleAnswerDiscussion}
                  sx={{ 
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                  }}
                >
                  Answer
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Answers ({answers.length})
      </Typography>

      {answersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : answers.length === 0 ? (
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No answers yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Be the first to answer this discussion!
            </Typography>
            {user && !discussion.isLocked && (
              <Button
                variant="contained"
                startIcon={<ReplyIcon />}
                onClick={handleAnswerDiscussion}
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                }}
              >
                Answer Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {answers.map(answer => renderAnswer(answer))}
        </Box>
      )}

      {/* Answer Dialog */}
      <DiscussionAnswerDialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        onAnswerCreated={handleAnswerCreated}
        discussion={discussion}
      />

      {/* Reply Dialog */}
      <DiscussionAnswerDialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        onAnswerCreated={handleAnswerCreated}
        discussion={discussion}
        parentAnswer={selectedAnswer}
      />

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

      {/* Edit Answer Dialog */}
      <DiscussionAnswerDialog
        open={editAnswerDialogOpen}
        onClose={() => {
          setEditAnswerDialogOpen(false);
          setEditingAnswer(null);
        }}
        onAnswerCreated={handleAnswerUpdated}
        discussion={discussion}
        editMode={true}
        existingAnswer={editingAnswer}
      />

      {/* Delete Answer Confirmation Dialog */}
      <Dialog
        open={deleteAnswerDialogOpen}
        onClose={() => setDeleteAnswerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Answer
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this answer? This action cannot be undone.
          </Typography>
          {answerToDelete && (
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {answerToDelete.content.substring(0, 100)}...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteAnswerDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAnswer}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete Answer
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

export default DiscussionViewer;
