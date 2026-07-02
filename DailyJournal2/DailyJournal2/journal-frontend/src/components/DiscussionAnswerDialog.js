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

const DiscussionAnswerDialog = ({ open, onClose, onAnswerCreated, discussion, parentAnswer = null, editMode = false, existingAnswer = null }) => {
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReply = parentAnswer !== null;

  // Pre-populate form when editing
  useEffect(() => {
    if (editMode && existingAnswer) {
      setContent(existingAnswer.content);
    } else {
      setContent('');
    }
  }, [editMode, existingAnswer, open]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Answer content is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let url, method, requestBody;
      
      if (editMode) {
        // Edit existing answer
        url = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/answers/${existingAnswer.id}`;
        method = 'PUT';
        requestBody = {
          content: content.trim()
        };
      } else {
        // Create new answer or reply
        url = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/discussions/${discussion.id}/answers`;
        method = 'POST';
        requestBody = {
          content: content.trim()
        };
        
        if (parentAnswer) {
          requestBody.parentAnswerId = parentAnswer.id;
        }
      }

      // ✅ Use cookies for authentication
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const answerData = await response.json();
        onAnswerCreated(answerData);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${editMode ? 'update' : 'post'} answer`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'posting'} answer:`, error);
      setError(`Failed to ${editMode ? 'update' : 'post'} answer. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!discussion) return null;

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
        {editMode ? 'Edit Answer' : (isReply ? 'Reply to Answer' : 'Answer Discussion')}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {editMode ? 'Editing answer for:' : (isReply ? 'Replying to:' : 'Answering:')} <strong>{discussion.title}</strong>
        </Typography>

        {isReply && (
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'grey.100', 
            borderRadius: 2,
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {parentAnswer.authorName} wrote:
            </Typography>
            <Typography variant="body2">
              {parentAnswer.content.length > 200 
                ? `${parentAnswer.content.substring(0, 200)}...` 
                : parentAnswer.content}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label={editMode ? "Edit Answer" : (isReply ? "Your Reply" : "Your Answer")}
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={editMode 
            ? "Edit your answer..." 
            : (isReply 
              ? "Write your reply to this answer..." 
              : "Share your thoughts, provide an answer, or contribute to the discussion...")}
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
          disabled={loading || !content.trim()}
          sx={{ 
            textTransform: 'none',
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            minWidth: 120
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (editMode ? 'Update Answer' : (isReply ? 'Post Reply' : 'Post Answer'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscussionAnswerDialog;
