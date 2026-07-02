import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box, 
  Chip, 
  Stack, 
  FormControlLabel, 
  Switch,
  Typography,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Public as PublicIcon, 
  Warning as WarningIcon,
  Timer as TimerIcon 
} from '@mui/icons-material';
import { acquireJournalLock, releaseJournalLock, extendJournalLock, checkJournalLockStatus } from '../services/teamApi';

function JournalEditor({ open, onClose, onSave, initialData, readOnly, isTeamJournal = false }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState(initialData?.mood || '');
  const [tags, setTags] = useState(initialData?.tags ? (Array.isArray(initialData.tags) ? initialData.tags : initialData.tags.split(',')) : []);
  const [tagInput, setTagInput] = useState('');
  const [date, setDate] = useState(initialData?.date ? initialData.date : new Date().toISOString().slice(0, 10));
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  
  // Locking state
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState('');
  const [lockLoading, setLockLoading] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const lockIntervalRef = useRef(null);
  const sessionId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    setTitle(initialData?.title || '');
    setContent(initialData?.content || '');
    setMood(initialData?.mood || '');
    setTags(initialData?.tags ? (Array.isArray(initialData.tags) ? initialData.tags : initialData.tags.split(',')) : []);
    setDate(initialData?.date ? initialData.date : new Date().toISOString().slice(0, 10));
    setIsPrivate(initialData?.isPrivate || false);
  }, [initialData, open]);


  // Lock management for editing existing journals (only for team journals)
  useEffect(() => {
    let isMounted = true;
    
    const manageLock = async () => {
      if (open && !readOnly && initialData?.id && !isLocked && isTeamJournal) {
        await acquireLock();
      }
    };

    if (isMounted && isTeamJournal) {
      manageLock().catch(console.error);
    }

    return () => {
      isMounted = false;
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
      }
      // Only release lock on unmount, not on every re-render
      if (initialData?.id && isTeamJournal) {
        releaseLock().catch(console.error);
      }
    };
  }, [open, readOnly, initialData?.id, isTeamJournal]); // Added isTeamJournal to dependencies

  const acquireLock = async () => {
    if (!initialData?.id) return;
    
    setLockLoading(true);
    setLockError('');
    
    try {
      await acquireJournalLock(initialData.id, sessionId.current);
      setIsLocked(true);
      setLockTimeRemaining(30 * 60); // 30 minutes in seconds
      
      // Start countdown timer
      lockIntervalRef.current = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 60) { // Less than 1 minute remaining
            extendLockAutomatically();
            return 30 * 60; // Reset to 30 minutes
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      let msg = 'Failed to acquire lock. Journal may be edited by another user.';
      if (typeof error?.response?.data === 'string') {
        msg = error.response.data;
      } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error?.message) {
        msg = error.message;
      }
      setLockError(msg);
    } finally {
      setLockLoading(false);
    }
  };

  const releaseLock = async () => {
    if (!initialData?.id || !isLocked) return;
    
    try {
      await releaseJournalLock(initialData.id);
      setIsLocked(false);
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
      }
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  };

  const extendLockAutomatically = async () => {
    if (!initialData?.id) return;
    
    try {
      await extendJournalLock(initialData.id, 30);
    } catch (error) {
      console.error('Failed to extend lock:', error);
      setLockError('Lock extension failed. Your changes may not be saved.');
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };
  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };
  const handleSave = async () => {
    try {
      // Convert mediaUrls back to mediaPaths (extract filenames from URLs)
      // Only include mediaPaths if we have media URLs to preserve
      const saveData = {
        title,
        content,
        mood,
        tags: tags.join(','),
        date,
        isPrivate,
        teamId: null
      };
      
      // Only add mediaPaths if we have media URLs to preserve
      if (initialData?.mediaUrls && initialData.mediaUrls.length > 0) {
        const mediaPaths = initialData.mediaUrls.map(url => {
          // Extract filename from URL like: ${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/filename.jpg
          const parts = url.split('/');
          return parts[parts.length - 1]; // Get the last part (filename)
        });
        saveData.mediaPaths = mediaPaths;
      }
      // If no mediaUrls, don't include mediaPaths in request to preserve existing files
      
      console.log('JournalEditor saving with data:', saveData);
      console.log('Original mediaUrls:', initialData?.mediaUrls);
      console.log('Converted mediaPaths:', saveData.mediaPaths);
      
      await onSave(saveData);
      
      // Release lock after successful save (only for team journals)
      if (isLocked && initialData?.id && isTeamJournal) {
        await releaseLock();
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleClose = async () => {
    if (isLocked && initialData?.id && isTeamJournal) {
      await releaseLock();
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ sx: { width: '90vw' } }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {readOnly ? 'View Entry' : (initialData && initialData.id ? 'Edit Entry' : 'New Entry')}
          </Typography>
          {!readOnly && initialData?.id && isTeamJournal && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {lockLoading && <CircularProgress size={16} />}
              {isLocked && (
                <Chip
                  icon={<TimerIcon />}
                  label={`Lock: ${formatTime(lockTimeRemaining)}`}
                  color="success"
                  size="small"
                />
              )}
              {lockError && (
                <Chip
                  icon={<WarningIcon />}
                  label="Lock Error"
                  color="error"
                  size="small"
                />
              )}
            </Stack>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ minHeight: '24vh' }}>
        {isTeamJournal && lockError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {lockError}
          </Alert>
        )}
        {isTeamJournal && !readOnly && initialData?.id && !isLocked && !lockLoading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Unable to acquire edit lock. Another user may be editing this journal.
          </Alert>
        )}
        <TextField label="Title" fullWidth margin="normal" value={title} onChange={e => setTitle(e.target.value)} required disabled={readOnly} />
        <TextField
          label="Content"
          fullWidth
          margin="normal"
          multiline
          minRows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          disabled={readOnly}
          sx={{ textarea: { minHeight: '13vh', fontSize: '1rem', lineHeight: 1.6 } }}
        />
        <TextField label="Mood" fullWidth margin="normal" value={mood} onChange={e => setMood(e.target.value)} disabled={readOnly} />
        <TextField label="Date" type="date" fullWidth margin="normal" value={date} onChange={e => setDate(e.target.value)} required InputLabelProps={{ shrink: true }} disabled={readOnly} />
        
        {!readOnly && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Tooltip title={isPrivate ? "Only you can see this journal" : "Anyone can see this journal"}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isPrivate ? <LockIcon sx={{ mr: 1 }} /> : <PublicIcon sx={{ mr: 1 }} />}
                    <Typography>{isPrivate ? 'Private' : 'Public'}</Typography>
                  </Box>
                }
                labelPlacement="start"
                sx={{ ml: 0, mr: 2 }}
              />
            </Tooltip>
          </Box>
        )}
        
        <Box sx={{ mt: 2 }}>
          <TextField label="Add Tag" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} disabled={readOnly} />
          {!readOnly && <Button onClick={handleAddTag} sx={{ ml: 1 }}>Add</Button>}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <Chip key={tag} label={tag} onDelete={readOnly ? undefined : () => handleDeleteTag(tag)} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && (
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={isTeamJournal && initialData?.id && !isLocked && !lockError}
          >
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default JournalEditor; 