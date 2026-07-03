import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Box, TextField, TableSortLabel, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Typography, Grid, ImageList, ImageListItem,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  IconButton, Stack
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon,
  ZoomIn as ZoomInIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Photo as PhotoIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import api from '../services/api';
import { uploadJournalFiles, deleteJournalFile } from '../services/api';
import JournalEditor from './JournalEditor';
import MediaViewer from './MediaViewer';
import { extractFilename } from '../utils/fileUtils';
import { downloadFile as downloadFileUtil } from '../utils/fileDownload';

const JournalsTable = () => {
  const [journals, setJournals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [fileDialog, setFileDialog] = useState({ open: false, journalId: null });
  const [mediaPreview, setMediaPreview] = useState({ open: false, url: '', urls: [], index: 0 });
  const [filterConfig, setFilterConfig] = useState({
    mood: '',
    tags: '',
    startDate: '',
    endDate: ''
  });

  const fetchJournals = async () => {
    try {
      const response = await api.get('/admin/journals/all');
      // Ensure each journal has a valid user object
      const processedJournals = response.data.map(journal => ({
        ...journal,
        user: journal.user || { name: 'Unknown User', id: null },
        mediaUrls: journal.mediaUrls || [],
        mood: journal.mood || 'Unspecified',
        tags: journal.tags || '',
        title: journal.title || 'Untitled',
        content: journal.content || 'No content',
        date: journal.date || new Date().toISOString()
      }));
      setJournals(processedJournals);
    } catch (error) {
      console.error('Error fetching journals:', error);
      setJournals([]);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/journals/${id}`);
      fetchJournals();
    } catch (error) {
      console.error('Error deleting journal:', error);
    }
  };

  const handleView = (journal) => {
    setSelectedJournal(journal);
    setOpenViewDialog(true);
  };

  const handleEdit = (journal) => {
    setSelectedJournal(journal);
    setOpenEditDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedJournal(null);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedJournal(null);
    fetchJournals();
  };

  const handleSaveEdit = async (editedJournal) => {
    try {
      await api.put(`/journals/${selectedJournal.id}`, editedJournal);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating journal:', error);
    }
  };

  const getSortedJournals = () => {
    let filteredJournals = journals;

    // Search filter
    if (searchTerm) {
      filteredJournals = filteredJournals.filter(journal => 
        (journal.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (journal.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (journal.user?.name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mood filter
    if (filterConfig.mood) {
      filteredJournals = filteredJournals.filter(journal => 
        (journal.mood || '').toLowerCase() === filterConfig.mood.toLowerCase()
      );
    }

    // Tags filter
    if (filterConfig.tags) {
      filteredJournals = filteredJournals.filter(journal => 
        (journal.tags || '').toLowerCase().includes(filterConfig.tags.toLowerCase())
      );
    }

    // Date range filter
    if (filterConfig.startDate) {
      filteredJournals = filteredJournals.filter(journal => 
        new Date(journal.date || new Date()) >= new Date(filterConfig.startDate)
      );
    }

    if (filterConfig.endDate) {
      filteredJournals = filteredJournals.filter(journal => 
        new Date(journal.date || new Date()) <= new Date(filterConfig.endDate)
      );
    }

    // Sorting
    return filteredJournals.sort((a, b) => {
      const key = sortConfig.key;
      if (a[key] == null || b[key] == null) return 0;
      if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedJournals = getSortedJournals();

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          label="Search Journals"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          label="Mood Filter"
          variant="outlined"
          value={filterConfig.mood}
          onChange={(e) => setFilterConfig(prev => ({ ...prev, mood: e.target.value }))}
        />
        <TextField
          label="Tags Filter"
          variant="outlined"
          value={filterConfig.tags}
          onChange={(e) => setFilterConfig(prev => ({ ...prev, tags: e.target.value }))}
        />
        <TextField
          label="Start Date"
          type="date"
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          value={filterConfig.startDate}
          onChange={(e) => setFilterConfig(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <TextField
          label="End Date"
          type="date"
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          value={filterConfig.endDate}
          onChange={(e) => setFilterConfig(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'id'}
                  direction={sortConfig.key === 'id' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'title'}
                  direction={sortConfig.key === 'title' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>User</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Mood</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedJournals.map((journal) => (
              <TableRow key={journal.id}>
                <TableCell>{journal.id || 'N/A'}</TableCell>
                <TableCell>{journal.title || 'Untitled'}</TableCell>
                <TableCell>{journal.user?.name || 'Unknown User'}</TableCell>
                <TableCell>{journal.date ? new Date(journal.date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={journal.mood || 'Unspecified'} size="small" color="primary" />
                </TableCell>
                <TableCell>{journal.tags || 'No Tags'}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => handleView(journal)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => handleEdit(journal)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    color="info" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => setFileDialog({ open: true, journalId: journal.id })}
                  >
                    Media
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small" 
                    onClick={() => handleDelete(journal.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Journal Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        {selectedJournal && (
          <>
            <DialogTitle>{selectedJournal.title || 'Untitled'}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6">Content</Typography>
                  <Typography>{selectedJournal.content || 'No content available'}</Typography>
                  
                  <Typography variant="h6" sx={{ mt: 2 }}>Details</Typography>
                  <Typography>Date: {selectedJournal.date ? new Date(selectedJournal.date).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography>Mood: {selectedJournal.mood || 'Unspecified'}</Typography>
                  <Typography>Tags: {selectedJournal.tags || 'No Tags'}</Typography>
                  <Typography>User: {selectedJournal.user?.name || 'Unknown User'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  {selectedJournal.mediaUrls && selectedJournal.mediaUrls.length > 0 ? (
                    <>
                      <Typography variant="h6">Media</Typography>
                      <ImageList cols={2} gap={8}>
                        {selectedJournal.mediaUrls.map((url, index) => (
                          <ImageListItem key={index}>
                            <img 
                              src={url} 
                              alt={`Media ${index + 1}`} 
                              loading="lazy" 
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    </>
                  ) : (
                    <Typography variant="body2">No media available</Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Journal Dialog */}
      {selectedJournal && (
        <Dialog 
          open={openEditDialog} 
          onClose={handleCloseEditDialog} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Edit Journal Entry</DialogTitle>
          <DialogContent>
            <JournalEditor 
              open={openEditDialog}
              onClose={handleCloseEditDialog}
              onSave={handleSaveEdit}
              initialData={selectedJournal}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* File Management Dialog */}
      <Dialog open={fileDialog.open} onClose={() => setFileDialog({ open: false, journalId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Media Files</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<AttachFileIcon />}
              fullWidth
              sx={{ mb: 2 }}
              onClick={(e) => {
                // Prevent default button behavior
                e.preventDefault();
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.accept = 'image/*,application/pdf,video/*,audio/*';
                // Add event listener for file selection
                fileInput.addEventListener('change', (event) => {
                  handleAddFile(fileDialog.journalId, event);
                });
                // Trigger click on the file input
                fileInput.click();
              }}
            >
              Add New Files
            </Button>
            
            {fileDialog.journalId && (() => {
              const entry = journals.find(e => e.id === fileDialog.journalId);
              return entry?.mediaUrls && entry.mediaUrls.length > 0 ? (
                <List>
                  {entry.mediaUrls.map((url, idx) => (
                    <ListItem key={url}>
                      <ListItemIcon>
                        {getFileIcon(url)}
                      </ListItemIcon>
                      <ListItemText
                        primary={url.split('/').pop()}
                        secondary="Journal attachment"
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewMedia(entry.mediaUrls, idx)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => downloadFile(url)}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteFile(entry.id, url)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No files attached to this journal
                </Typography>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog({ open: false, journalId: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Media Preview */}
      <MediaViewer
        open={mediaPreview.open}
        onClose={() => setMediaPreview({ ...mediaPreview, open: false })}
        mediaUrl={mediaPreview.url}
        mediaUrls={mediaPreview.urls}
        onNext={() => handleNavigateMedia(1)}
        onPrev={() => handleNavigateMedia(-1)}
      />
    </Box>
  );

  // Function to handle media preview
  function handlePreviewMedia(urls, index) {
    if (!urls || urls.length === 0) return;
    setMediaPreview({
      open: true,
      url: urls[index],
      urls: urls,
      index: index
    });
  }

  // Function to navigate between media files
  function handleNavigateMedia(direction) {
    const newIndex = mediaPreview.index + direction;
    if (newIndex >= 0 && newIndex < mediaPreview.urls.length) {
      setMediaPreview({
        ...mediaPreview,
        url: mediaPreview.urls[newIndex],
        index: newIndex
      });
    }
  }

  // Helper functions for file handling
  function getFileIcon(url) {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <PhotoIcon />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return <VideoIcon />;
    if (['mp3', 'wav', 'ogg'].includes(extension)) return <AudioIcon />;
    if (['pdf'].includes(extension)) return <DocumentIcon />;
    return <DocumentIcon />;
  }

  function getFullFileUrl(url) {
    // If the URL already starts with http, return as is
    if (url.startsWith('http')) {
      return url;
    }
    // If it starts with /api/journals/media/, add the backend base URL
    if (url.startsWith('/api/journals/media/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
    }
    // If it's just a filename, construct the full URL
    if (!url.startsWith('/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}`;
    }
    // For other cases, add the backend base URL
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
  }
  
  // Helper function to download files as blobs
  async function downloadFile(url) {
    try {
      const fullUrl = getFullFileUrl(url);
      const fileName = extractFilename(url);
      await downloadFileUtil(fullUrl, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  }

  async function handleAddFile(journalId, e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Show some feedback that upload is in progress
      console.log('Uploading files...', files);
      
      // Make sure journalId is valid
      if (!journalId) {
        console.error('Journal ID is missing');
        return;
      }
      
      // Call the API to upload files
      const response = await uploadJournalFiles(journalId, files);
      console.log('Upload response:', response);
      
      // Refresh the journal data
      await fetchJournals();
      
      // Reset the file input
      e.target.value = '';
      
      // Keep the dialog open to show the newly uploaded files
      // Instead of closing it immediately
    } catch (error) {
      console.error('Error uploading files:', error);
      // Handle error (show message to user)
      alert('Error uploading files: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  }

  async function handleDeleteFile(journalId, url) {
    try {
      // Pass raw URL, only stripping cache buster
      const fileIdentifier = url.split('?')[0];
      await deleteJournalFile(journalId, fileIdentifier);
      // Refresh the journal data
      fetchJournals();
    } catch (error) {
      console.error('Error deleting file:', error);
      // Handle error (show message to user)
    }
  }
};

export default JournalsTable;