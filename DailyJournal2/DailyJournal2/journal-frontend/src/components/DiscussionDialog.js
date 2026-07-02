import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const DiscussionDialog = ({ open, onClose, onDiscussionCreated, journalId, journalTitle, editMode = false, existingDiscussion = null }) => {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with existing discussion data when in edit mode
  useEffect(() => {
    if (editMode && existingDiscussion) {
      setTitle(existingDiscussion.title || '');
      setContent(existingDiscussion.content || '');
    } else {
      setTitle('');
      setContent('');
    }
    setError('');
  }, [editMode, existingDiscussion, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = editMode 
        ? `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${existingDiscussion.id}`
        : `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/journal/${journalId}`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      // ✅ Use cookies for authentication
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      });

      if (response.ok) {
        const discussionData = await response.json();
        onDiscussionCreated(discussionData);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${editMode ? 'update' : 'create'} discussion`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} discussion:`, error);
      setError(`Failed to ${editMode ? 'update' : 'create'} discussion. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        color: 'white',
        fontWeight: 600
      }}>
        {editMode ? 'Edit Discussion' : 'Start a Discussion'}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {editMode ? 'Editing discussion about:' : 'Starting a discussion about:'} <strong>{journalTitle}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label="Discussion Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to discuss about this journal?"
          sx={{ mb: 3 }}
          inputProps={{ maxLength: 500 }}
          helperText={`${title.length}/500 characters`}
        />

        <TextField
          label="Your Question or Topic"
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you'd like to discuss, ask questions, or share your thoughts about this journal..."
          inputProps={{ maxLength: 10000 }}
          helperText={`${content.length}/10000 characters`}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim() || !content.trim()}
          sx={{ 
            textTransform: 'none',
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            minWidth: 120
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (editMode ? 'Update Discussion' : 'Start Discussion')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscussionDialog;
