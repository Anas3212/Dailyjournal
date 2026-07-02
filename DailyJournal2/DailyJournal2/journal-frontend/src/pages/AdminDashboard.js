import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, Typography, Tabs, Tab, 
  Modal, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  Paper, IconButton, Button, Grid, Card, CardContent,
  CardActions, TextField, InputAdornment, Chip, Stack,
  Alert, Snackbar, CircularProgress, Avatar, Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  LocalOffer as TagIcon,
  InsertEmoticon as MoodIcon,
  Public as PublicIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import UsersTable from '../components/UsersTable';
import JournalsTable from '../components/JournalsTable';
import JournalViewer from '../components/JournalViewer';
import { 
  getAllEverPublishedJournalsForAdmin, 
  searchAllEverPublishedJournalsForAdmin, 
  hideJournalByAdmin, 
  deleteJournal,
  restoreJournal 
} from '../services/api';
import api from '../services/api';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  overflow: 'auto'
};

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedUserJournals, setSelectedUserJournals] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [openModal, setOpenModal] = useState(false);
  
  // Published Journals state
  const [publishedJournals, setPublishedJournals] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(false);
  const [publishedSearch, setPublishedSearch] = useState('');
  const [publishedSearchLoading, setPublishedSearchLoading] = useState(false);
  const [viewingJournal, setViewingJournal] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleViewJournals = async (userId) => {
    try {
      const response = await api.get(`/journals/user/${userId}`);
      setSelectedUserJournals(response.data);
      // Try to get the user's name from the first journal entry, fallback to userId
      setSelectedUserName(response.data[0]?.userName || `User ${userId}`);
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching user journals:', error);
      setSelectedUserJournals([]);
      setSelectedUserName(`User ${userId}`);
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUserJournals([]);
    setSelectedUserName('');
  };

  // Published Journals functions
  useEffect(() => {
    if (tabIndex === 2 && user) {
      fetchPublishedJournals();
    }
  }, [tabIndex, user]);

  const fetchPublishedJournals = async () => {
    setPublishedLoading(true);
    try {
      const response = await getAllEverPublishedJournalsForAdmin();
      setPublishedJournals(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load published journals', severity: 'error' });
    } finally {
      setPublishedLoading(false);
    }
  };

  const handlePublishedSearch = async (e) => {
    e.preventDefault();
    setPublishedSearchLoading(true);
    try {
      const params = {};
      if (publishedSearch.trim()) params.search = publishedSearch.trim();
      
      const response = await searchAllEverPublishedJournalsForAdmin(params);
      setPublishedJournals(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to search published journals', severity: 'error' });
    } finally {
      setPublishedSearchLoading(false);
    }
  };

  const handleClearPublishedSearch = () => {
    setPublishedSearch('');
    fetchPublishedJournals();
  };

  const handleViewPublishedJournal = (journal) => {
    setViewingJournal(journal);
  };

  const handleCloseJournalViewer = () => {
    setViewingJournal(null);
  };

  const handleUnpublishJournal = async (journalId) => {
    try {
      await hideJournalByAdmin(journalId);
      setSnackbar({ open: true, message: 'Journal hidden successfully!', severity: 'success' });
      fetchPublishedJournals(); // Refresh the list
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to hide journal', severity: 'error' });
    }
  };

  const handleRestoreJournal = async (journalId) => {
    try {
      await restoreJournal(journalId);
      setSnackbar({ open: true, message: 'Journal restored successfully!', severity: 'success' });
      fetchPublishedJournals();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to restore journal', severity: 'error' });
    }
  };

  const handleDeletePublishedJournal = async (journalId) => {
    if (window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      try {
        await deleteJournal(journalId);
        setSnackbar({ open: true, message: 'Journal deleted successfully!', severity: 'success' });
        fetchPublishedJournals(); // Refresh the list
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete journal', severity: 'error' });
      }
    }
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#4caf50',
      sad: '#2196f3',
      excited: '#ff9800',
      calm: '#9c27b0',
      anxious: '#f44336',
      grateful: '#8bc34a',
      frustrated: '#ff5722',
      inspired: '#e91e63'
    };
    return colors[mood] || '#757575';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Users" />
          <Tab label="Journals" />
          <Tab label="Published Journals" />
        </Tabs>
      </Box>
      <Box sx={{ pt: 3 }}>
        {tabIndex === 0 && <UsersTable onViewJournals={handleViewJournals} />}
        {tabIndex === 1 && <JournalsTable />}
        {tabIndex === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              📚 Published Journals Management
            </Typography>
            
            {/* Search Bar */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <form onSubmit={handlePublishedSearch}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Search published journals by title, content, author, or tags..."
                    value={publishedSearch}
                    onChange={(e) => setPublishedSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={publishedSearchLoading}
                    sx={{ minWidth: 100 }}
                  >
                    {publishedSearchLoading ? <CircularProgress size={20} /> : 'Search'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearPublishedSearch}
                    startIcon={<ClearIcon />}
                  >
                    Clear
                  </Button>
                </Stack>
              </form>
            </Paper>

            {/* Published Journals Grid */}
            {publishedLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : publishedJournals.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Typography variant="h6" color="text.secondary">
                  No published journals found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {publishedSearch ? 'Try adjusting your search criteria' : 'No journals have been published yet'}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {publishedJournals.map((journal) => {
                  const tags = journal.tags ? (Array.isArray(journal.tags) ? journal.tags : journal.tags.split(',')) : [];
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={journal.id}>
                      <Fade in timeout={600}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            },
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 3
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            {/* Header with author info */}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: getMoodColor(journal.mood),
                                  width: 40,
                                  height: 40
                                }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {journal.userName || 'Anonymous'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Journal ID: {journal.id}
                                </Typography>
                              </Box>
                              <Chip
                                icon={<PublicIcon />}
                                label="Published"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Stack>

                            {/* Title */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.3
                              }}
                            >
                              {journal.title}
                            </Typography>

                            {/* Content preview */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.5
                              }}
                            >
                              {journal.content}
                            </Typography>

                            {/* Metadata */}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(journal.date)}
                                </Typography>
                              </Stack>
                              {journal.mood && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <MoodIcon sx={{ fontSize: 16, color: getMoodColor(journal.mood) }} />
                                  <Typography variant="caption" sx={{ color: getMoodColor(journal.mood), textTransform: 'capitalize' }}>
                                    {journal.mood}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>

                            {/* Tags */}
                            {tags.length > 0 && (
                              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                <TagIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                                {tags.slice(0, 3).map(tag => (
                                  <Chip
                                    key={tag}
                                    label={`#${tag}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                ))}
                                {tags.length > 3 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    +{tags.length - 3} more
                                  </Typography>
                                )}
                              </Stack>
                            )}
                          </CardContent>

                          <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewPublishedJournal(journal)}
                              sx={{ color: 'primary.main' }}
                            >
                              View
                            </Button>
                            <Stack direction="row" spacing={1}>
                              {journal.isPublished ? (
                                <Button
                                  size="small"
                                  startIcon={<BlockIcon />}
                                  onClick={() => handleUnpublishJournal(journal.id)}
                                  sx={{ color: 'warning.main' }}
                                >
                                  Hide
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  startIcon={<PublicIcon />}
                                  onClick={() => handleRestoreJournal(journal.id)}
                                  sx={{ color: 'success.main' }}
                                >
                                  Restore
                                </Button>
                              )}
                              <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeletePublishedJournal(journal.id)}
                                sx={{ color: 'error.main' }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Journals for {selectedUserName}</Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          {selectedUserJournals.length === 0 ? (
            <Typography variant="body1">No journals found for this user.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Mood</TableCell>
                    <TableCell>Tags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedUserJournals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell>{journal.id}</TableCell>
                      <TableCell>{journal.title}</TableCell>
                      <TableCell>{new Date(journal.date).toLocaleDateString()}</TableCell>
                      <TableCell>{journal.mood}</TableCell>
                      <TableCell>{journal.tags}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Modal>

      {/* Journal Viewer for Published Journals */}
      {viewingJournal && (
        <JournalViewer
          open={Boolean(viewingJournal)}
          onClose={handleCloseJournalViewer}
          entry={viewingJournal}
          readOnly={true}
          onOpenFileViewer={() => {}} // Admin view doesn't need file viewer
          onDownloadFile={() => {}} // Admin view doesn't need download
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;