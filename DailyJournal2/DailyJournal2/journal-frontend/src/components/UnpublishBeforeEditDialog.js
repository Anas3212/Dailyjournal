import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

function UnpublishBeforeEditDialog({ 
  open, 
  onClose, 
  onConfirm, 
  journalTitle,
  loading = false 
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <EditIcon />
        Edit Published Journal
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Stack spacing={3}>
          {/* Warning Alert */}
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              This journal is currently published and visible to other users.
            </Typography>
          </Alert>

          {/* Journal Title */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Journal Title:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {journalTitle}
            </Typography>
          </Box>

          {/* Explanation */}
          <Box>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              To edit this journal, it needs to be unpublished first.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This prevents conflicts and ensures a smooth editing experience. Here's what will happen:
            </Typography>

            <Stack spacing={1.5} sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityOffIcon sx={{ fontSize: '1.1rem', color: 'warning.main' }} />
                <Typography variant="body2">
                  The journal will be <strong>temporarily unpublished</strong>
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                <Typography variant="body2">
                  You'll be able to <strong>edit the content safely</strong>
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ fontSize: '1.1rem', color: 'success.main' }} />
                <Typography variant="body2">
                  You can <strong>republish it</strong> after making your changes
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> While unpublished, the journal will only be visible to you and won't appear in public listings.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
            }
          }}
          disabled={loading}
        >
          {loading ? 'Unpublishing...' : 'Unpublish & Edit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UnpublishBeforeEditDialog;
