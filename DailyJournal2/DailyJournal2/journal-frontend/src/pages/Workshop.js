import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  LinearProgress,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
  Slideshow as PresentationIcon,
  DataObject as JsonIcon,
  GridOn as CsvIcon,
  Article as MarkdownIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  FileCopy as DuplicateIcon,
  Download as ExportIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Schedule as RecentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getWorkshopFiles, createWorkshopFile, deleteWorkshopFile, duplicateWorkshopFile, getWorkshopStats, getFileTypes } from '../services/api';
import FileEditor from '../components/FileEditor';
import CreateFileDialog from '../components/CreateFileDialog';

const Workshop = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [fileTypes, setFileTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuFile, setMenuFile] = useState(null);

  useEffect(() => {
    loadFiles();
    loadStats();
    loadFileTypes();
  }, [loadFiles, loadStats, loadFileTypes]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedFileType && { fileType: selectedFileType }),
        ...(selectedCategory && { category: selectedCategory })
      };
      
      const response = await getWorkshopFiles(params);
      setFiles(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to load workshop files');
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedFileType, selectedCategory]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getWorkshopStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadFileTypes = useCallback(async () => {
    try {
      const response = await getFileTypes();
      setFileTypes(response.data);
    } catch (error) {
      console.error('Error loading file types:', error);
    }
  }, []);

  const handleCreateFile = async (fileData) => {
    try {
      await createWorkshopFile(fileData);
      setSuccess('File created successfully!');
      setCreateDialogOpen(false);
      loadFiles();
      loadStats();
    } catch (error) {
      setError('Failed to create file');
      console.error('Error creating file:', error);
    }
  };

  const handleEditFile = (file) => {
    setSelectedFile(file);
    setEditorOpen(true);
    handleMenuClose();
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteWorkshopFile(fileId);
        setSuccess('File deleted successfully!');
        loadFiles();
        loadStats();
      } catch (error) {
        setError('Failed to delete file');
        console.error('Error deleting file:', error);
      }
    }
    handleMenuClose();
  };

  const handleDuplicateFile = async (fileId) => {
    try {
      await duplicateWorkshopFile(fileId);
      setSuccess('File duplicated successfully!');
      loadFiles();
      loadStats();
    } catch (error) {
      setError('Failed to duplicate file');
      console.error('Error duplicating file:', error);
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event, file) => {
    setAnchorEl(event.currentTarget);
    setMenuFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFile(null);
  };

  const getFileIcon = (fileType) => {
    const iconProps = { sx: { fontSize: 40, color: 'primary.main' } };
    
    switch (fileType) {
      case 'DOCUMENT':
        return <DocumentIcon {...iconProps} />;
      case 'SPREADSHEET':
        return <SpreadsheetIcon {...iconProps} />;
      case 'PRESENTATION':
        return <PresentationIcon {...iconProps} />;
      case 'CODE':
        return <CodeIcon {...iconProps} />;
      case 'JSON':
        return <JsonIcon {...iconProps} />;
      case 'CSV':
        return <CsvIcon {...iconProps} />;
      case 'MARKDOWN':
        return <MarkdownIcon {...iconProps} />;
      default:
        return <TextIcon {...iconProps} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Workshop
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create, edit, and manage your documents, spreadsheets, and other files
        </Typography>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.totalFiles}
                  </Typography>
                  <Typography variant="body2">Total Files</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.formattedTotalSize}
                  </Typography>
                  <Typography variant="body2">Total Size</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.recentFilesCount}
                  </Typography>
                  <Typography variant="body2">Recent Files</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {Object.keys(stats.fileTypeStats || {}).length}
                  </Typography>
                  <Typography variant="body2">File Types</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={selectedFileType}
                label="File Type"
                onChange={(e) => setSelectedFileType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {fileTypes.map((type) => (
                  <MenuItem key={type.name} value={type.name}>
                    {type.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Filter by category..."
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              InputProps={{
                startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Files Grid */}
      <Grid container spacing={3}>
        {files.map((file) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getFileIcon(file.fileType)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {file.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file.fileTypeDisplayName}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, file)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
                
                {file.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {file.description.length > 100 
                      ? `${file.description.substring(0, 100)}...` 
                      : file.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {file.category && (
                    <Chip 
                      label={file.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                  {file.isShared && (
                    <Chip 
                      label="Shared" 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.fileSize)} • {format(new Date(file.updatedAt), 'MMM dd, yyyy')}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleEditFile(file)}
                >
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!loading && files.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <DocumentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No files found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || selectedFileType || selectedCategory 
              ? 'Try adjusting your filters or search terms'
              : 'Create your first workshop file to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            Create New File
          </Button>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(e, newPage) => setPage(newPage - 1)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create file"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
          }
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditFile(menuFile)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDuplicateFile(menuFile?.id)}>
          <DuplicateIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ExportIcon sx={{ mr: 1 }} />
          Export
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteFile(menuFile?.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create File Dialog */}
      <CreateFileDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateFile}
        fileTypes={fileTypes}
      />

      {/* File Editor */}
      {selectedFile && (
        <FileEditor
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedFile(null);
            loadFiles();
          }}
          file={selectedFile}
        />
      )}
    </Container>
  );
};

export default Workshop;
