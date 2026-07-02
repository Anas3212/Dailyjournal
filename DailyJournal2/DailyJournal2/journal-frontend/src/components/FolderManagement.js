import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
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
  PhotoLibrary as PhotoIcon,
  FolderOpen as FolderOpenIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { getFolders, deleteFolder, searchFolders, getFolderStats } from '../services/api';
import FolderCreateDialog from './FolderCreateDialog';

const FolderManagement = ({ open, onClose, onSelectFolder, onViewFolder }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Icon mapping
  const iconMap = {
    folder: <FolderIcon />,
    work: <WorkIcon />,
    person: <PersonIcon />,
    lightbulb: <LightbulbIcon />,
    school: <SchoolIcon />,
    home: <HomeIcon />,
    favorite: <FavoriteIcon />,
    star: <StarIcon />,
    bookmark: <BookmarkIcon />,
    assignment: <AssignmentIcon />,
    event: <EventIcon />,
    photo: <PhotoIcon />
  };

  useEffect(() => {
    if (open) {
      fetchFolders();
      fetchStats();
    }
  }, [open]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchFolders();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFolders();
      setFolders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getFolderStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching folder stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await searchFolders(searchTerm);
      setFolders(response.data.data || []);
    } catch (error) {
      console.error('Error searching folders:', error);
      setError('Failed to search folders');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, folder) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    // Don't clear selectedFolder here - it's needed for edit/delete operations
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFolder) return;
    
    try {
      console.log('Attempting to delete folder:', selectedFolder);
      await deleteFolder(selectedFolder.id);
      setFolders(folders.filter(f => f.id !== selectedFolder.id));
      fetchStats(); // Refresh stats
      setDeleteConfirmOpen(false);
      setSelectedFolder(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to delete folder';
      if (error.response?.status === 404) {
        errorMessage = 'Folder not found. It may have already been deleted.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this folder.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedFolder(null);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedFolder(null);
  };

  const handleEditSubmit = () => {
    setEditDialogOpen(false);
    setSelectedFolder(null);
    fetchFolders();
    fetchStats();
  };

  const handleFolderSelect = (folder) => {
    onSelectFolder(folder);
    onClose();
  };

  const handleCreateFolder = () => {
    setCreateDialogOpen(true);
  };

  const handleFolderCreated = () => {
    setCreateDialogOpen(false);
    fetchFolders();
    fetchStats();
  };

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || <FolderIcon />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '70vh'
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
            <FolderOpenIcon />
            <Typography variant="h6">Manage Folders</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Stats Section */}
          {stats && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Folder Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={4}>
                  <Card sx={{ textAlign: 'center', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" color="primary">
                        {stats.totalFolders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Folders
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={4}>
                  <Card sx={{ textAlign: 'center', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {stats.foldersWithJournals}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        With Journals
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={4}>
                  <Card sx={{ textAlign: 'center', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.emptyFolders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Empty Folders
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Search and Create Section */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateFolder}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minWidth: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              New Folder
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Folders Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : folders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm ? 'No folders found' : 'No folders created yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first folder to organize your journals'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateFolder}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Create First Folder
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {folders.map((folder) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={folder.id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleFolderSelect(folder)}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: folder.color }}>
                            {getIconComponent(folder.icon)}
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {folder.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, folder)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      {folder.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {folder.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={`${folder.journalCount} journal${folder.journalCount !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            backgroundColor: `${folder.color}20`,
                            color: folder.color,
                            fontWeight: 'bold'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(folder.createdAt)}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewFolder?.(folder);
                        }}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFolderSelect(folder);
                        }}
                      >
                        Select
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Folder
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Folder
          </MenuItem>
        </Menu>
      </Dialog>

      {/* Create Folder Dialog */}
      <FolderCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleFolderCreated}
      />

      {/* Edit Folder Dialog */}
      <FolderCreateDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        editMode={true}
        initialData={selectedFolder}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Delete Folder
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the folder "{selectedFolder?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All journals in this folder will be moved to "No Folder".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete Folder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FolderManagement;
