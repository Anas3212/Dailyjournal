import React, { useState, useEffect } from 'react';
import { createFolder, updateFolder } from '../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  Folder as FolderIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon,
  BookmarkBorder as BookmarkIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  PhotoLibrary as PhotoIcon
} from '@mui/icons-material';

const FolderCreateDialog = ({ open, onClose, onSubmit, loading = false, editMode = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196F3',
    icon: 'folder'
  });
  const [errors, setErrors] = useState({});

  // Populate form data when in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        color: initialData.color || '#2196F3',
        icon: initialData.icon || 'folder'
      });
    } else if (!editMode) {
      // Reset form when creating new folder
      setFormData({
        name: '',
        description: '',
        color: '#2196F3',
        icon: 'folder'
      });
    }
  }, [editMode, initialData, open]);

  // Predefined color options
  const colorOptions = [
    { value: '#2196F3', name: 'Blue', color: '#2196F3' },
    { value: '#4CAF50', name: 'Green', color: '#4CAF50' },
    { value: '#FF9800', name: 'Orange', color: '#FF9800' },
    { value: '#9C27B0', name: 'Purple', color: '#9C27B0' },
    { value: '#F44336', name: 'Red', color: '#F44336' },
    { value: '#607D8B', name: 'Blue Grey', color: '#607D8B' },
    { value: '#795548', name: 'Brown', color: '#795548' },
    { value: '#E91E63', name: 'Pink', color: '#E91E63' },
    { value: '#00BCD4', name: 'Cyan', color: '#00BCD4' },
    { value: '#8BC34A', name: 'Light Green', color: '#8BC34A' },
    { value: '#FFC107', name: 'Amber', color: '#FFC107' },
    { value: '#673AB7', name: 'Deep Purple', color: '#673AB7' }
  ];

  // Predefined icon options
  const iconOptions = [
    { value: 'folder', name: 'Folder', icon: <FolderIcon /> },
    { value: 'work', name: 'Work', icon: <WorkIcon /> },
    { value: 'person', name: 'Personal', icon: <PersonIcon /> },
    { value: 'lightbulb', name: 'Ideas', icon: <LightbulbIcon /> },
    { value: 'school', name: 'Education', icon: <SchoolIcon /> },
    { value: 'home', name: 'Home', icon: <HomeIcon /> },
    { value: 'favorite', name: 'Favorites', icon: <FavoriteIcon /> },
    { value: 'star', name: 'Important', icon: <StarIcon /> },
    { value: 'bookmark', name: 'Bookmarks', icon: <BookmarkIcon /> },
    { value: 'assignment', name: 'Tasks', icon: <AssignmentIcon /> },
    { value: 'event', name: 'Events', icon: <EventIcon /> },
    { value: 'photo', name: 'Photos', icon: <PhotoIcon /> }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Folder name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Folder name must be 100 characters or less';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null
      };
      
      try {
        if (editMode && initialData) {
          await updateFolder(initialData.id, submitData);
        } else {
          await createFolder(submitData);
        }
        onSubmit(); // Call the success callback
        handleClose(); // Close the dialog
      } catch (error) {
        console.error(`Error ${editMode ? 'updating' : 'creating'} folder:`, error);
        // You can add error handling here if needed
      }
    }
  };

  const handleClose = () => {
    // Only reset form data if not in edit mode, or if we want to clear it
    if (!editMode) {
      setFormData({
        name: '',
        description: '',
        color: '#2196F3',
        icon: 'folder'
      });
    }
    setErrors({});
    onClose();
  };

  const getIconComponent = (iconValue) => {
    const iconOption = iconOptions.find(opt => opt.value === iconValue);
    return iconOption ? iconOption.icon : <FolderIcon />;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIconComponent(formData.icon)}
          <Typography variant="h6">
            {editMode ? 'Edit Folder' : 'Create New Folder'}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ color: 'white' }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Folder Name */}
          <TextField
            label="Folder Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
            placeholder="e.g., Personal, Work, Ideas..."
            InputProps={{
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: formData.color,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: formData.color,
                  },
                },
              },
            }}
          />

          {/* Description */}
          <TextField
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description || `${formData.description.length}/500 characters`}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
            placeholder="Brief description of what this folder contains..."
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />

          {/* Color Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Folder Color
            </Typography>
            <Grid container spacing={1}>
              {colorOptions.map((color) => (
                <Grid item key={color.value}>
                  <Chip
                    label={color.name}
                    onClick={() => handleInputChange('color', color.value)}
                    disabled={loading}
                    sx={{
                      backgroundColor: color.color,
                      color: 'white',
                      fontWeight: formData.color === color.value ? 'bold' : 'normal',
                      border: formData.color === color.value ? '3px solid #333' : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: color.color,
                        opacity: 0.8,
                      },
                      cursor: 'pointer'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Icon Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Folder Icon
            </Typography>
            <Grid container spacing={1}>
              {iconOptions.map((icon) => (
                <Grid item key={icon.value}>
                  <IconButton
                    onClick={() => handleInputChange('icon', icon.value)}
                    disabled={loading}
                    sx={{
                      border: formData.icon === icon.value ? `3px solid ${formData.color}` : '1px solid #ddd',
                      borderRadius: 2,
                      backgroundColor: formData.icon === icon.value ? `${formData.color}20` : 'transparent',
                      color: formData.icon === icon.value ? formData.color : 'text.secondary',
                      '&:hover': {
                        backgroundColor: `${formData.color}10`,
                        color: formData.color,
                      },
                    }}
                    title={icon.name}
                  >
                    {icon.icon}
                  </IconButton>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Preview */}
          <Box sx={{ 
            p: 2, 
            border: '2px dashed #ddd', 
            borderRadius: 2, 
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.5)'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Preview
            </Typography>
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 1, 
              p: 1.5, 
              borderRadius: 2,
              backgroundColor: formData.color,
              color: 'white',
              fontWeight: 'bold'
            }}>
              {getIconComponent(formData.icon)}
              <Typography variant="body1">
                {formData.name || 'Folder Name'}
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Please fix the errors above before {editMode ? 'updating' : 'creating'} the folder.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : getIconComponent(formData.icon)}
          sx={{
            borderRadius: 2,
            background: `linear-gradient(135deg, ${formData.color} 0%, ${formData.color}dd 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${formData.color}dd 0%, ${formData.color}bb 100%)`,
            },
            '&:disabled': {
              background: '#ccc',
            }
          }}
        >
          {loading 
            ? (editMode ? 'Updating...' : 'Creating...') 
            : (editMode ? 'Update Folder' : 'Create Folder')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderCreateDialog;
