import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Box,
  Container,
  Tooltip,
  Avatar,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Modal,
  Backdrop,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Photo as PhotoIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  FileDownload as DownloadIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  MenuBook as JournalIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import JournalViewer from '../components/JournalViewer';
import { 
  getJournals, 
  searchJournals, 
  getJournal,
  getCurrentUser,
  getPublicJournals,
  searchPublicJournals
} from '../services/api';

function UserJournals() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [filterMood, setFilterMood] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [fileViewer, setFileViewer] = useState({ open: false, files: [], currentIndex: 0 });
  const [mediaPlayer, setMediaPlayer] = useState({ playing: false, volume: 0.7 });

  const moods = ['all', 'happy', 'sad', 'excited', 'calm', 'anxious', 'grateful', 'frustrated', 'inspired'];

  useEffect(() => {
    if (!user) return;
    fetchCurrentUser();
    fetchJournals();
  }, [user, userId]);

  const fetchCurrentUser = async () => {
    try {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      // Use public journals endpoint to show only public journals when viewing other users
      const journalsRes = currentUser && currentUser.id === parseInt(userId) 
        ? await getJournals(userId)  // Show all journals if viewing own profile
        : await getPublicJournals(userId);  // Show only public journals if viewing others
      setEntries(journalsRes.data);
      if (journalsRes.data.length > 0) {
        setUserName(journalsRes.data[0].userName);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load journals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId || !search.trim()) {
      await fetchJournals();
      return;
    }
    setSearchLoading(true);
    try {
      // Use public search endpoint when viewing other users
      const res = currentUser && currentUser.id === parseInt(userId)
        ? await searchJournals(userId, { search })  // Search all journals if viewing own profile
        : await searchPublicJournals(userId, { search });  // Search only public journals if viewing others
      setEntries(res.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Search failed', severity: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearch('');
    await fetchJournals();
  };

  const handleFilterChange = async (e) => {
    const mood = e.target.value;
    setFilterMood(mood);
    setLoading(true);
    try {
      if (mood === 'all') {
        await fetchJournals();
      } else {
        // Use public search endpoint when viewing other users
        const res = currentUser && currentUser.id === parseInt(userId)
          ? await searchJournals(userId, { mood })  // Filter all journals if viewing own profile
          : await searchPublicJournals(userId, { mood });  // Filter only public journals if viewing others
        setEntries(res.data);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Filter failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntry = async (id) => {
    try {
      const res = await getJournal(id);
      setViewingEntry(res.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load journal', severity: 'error' });
    }
  };

  const handleCloseViewer = () => {
    setViewingEntry(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getColorForMood = (mood) => {
    const moodColors = {
      happy: '#4caf50',
      sad: '#2196f3',
      excited: '#ff9800',
      calm: '#03a9f4',
      anxious: '#f44336',
      grateful: '#8bc34a',
      frustrated: '#e91e63',
      inspired: '#9c27b0'
    };
    return moodColors[mood] || '#757575';
  };

  const isAdmin = currentUser?.roles?.some(role => role.name === 'ROLE_ADMIN');
  const isOwner = currentUser?.id === parseInt(userId);

  // File viewer handlers
  const handleOpenFileViewer = (files, startIndex = 0) => {
    setFileViewer({ open: true, files, currentIndex: startIndex });
  };

  const handleCloseFileViewer = () => {
    setFileViewer({ open: false, files: [], currentIndex: 0 });
    setMediaPlayer({ playing: false, volume: 0.7 });
  };

  const handleNextFile = () => {
    setFileViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.files.length
    }));
  };

  const handlePrevFile = () => {
    setFileViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.files.length - 1 : prev.currentIndex - 1
    }));
  };

  const handleDownloadFile = async (url) => {
    try {
      const fullUrl = getFullFileUrl(url);
      // Cloudinary URLs are public CDN — no cookies needed (cookies cause CORS error)
      const isCloudinary = fullUrl.startsWith('https://res.cloudinary.com');
      const response = await fetch(fullUrl, {
        credentials: isCloudinary ? 'omit' : 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSnackbar({ open: true, message: 'File downloaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({ open: true, message: 'Failed to download file', severity: 'error' });
    }
  };

  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    return 'document';
  };

  const getFullFileUrl = (url) => {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/api/journals/media/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
    }
    if (!url.startsWith('/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}`;
    }
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}
      >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Modern Header Section */}
            <Box textAlign="center" mb={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}
              >
                <IconButton 
                  onClick={() => navigate(-1)} 
                  sx={{ 
                    mr: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <JournalIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
              
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  mb: 2
                }}
              >
                {userName ? `${userName}'s Journals` : 'User Journals'}
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  maxWidth: 600,
                  margin: '0 auto',
                  lineHeight: 1.6
                }}
              >
                Explore the journal entries and discover shared thoughts and experiences
              </Typography>
            </Box>

            {/* Main Content Container */}
            <Paper 
              elevation={24} 
              sx={{ 
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            >

        <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexGrow: 1 }}>
            <TextField
              fullWidth
              label="Search Journals"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ ml: 1 }}
              disabled={searchLoading}
            >
              Search
            </Button>
          </form>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="mood-filter-label">Mood</InputLabel>
            <Select
              labelId="mood-filter-label"
              value={filterMood}
              label="Mood"
              onChange={handleFilterChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon />
                </InputAdornment>
              }
            >
              {moods.map((mood) => (
                <MenuItem key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ my: 4 }}>
            No journals found
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {entries.map((entry) => (
              <Grid item xs={12} sm={6} md={4} key={entry.id}>
                <Card 
                  elevation={3} 
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom noWrap>
                      {entry.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {entry.content}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(entry.date)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {/* Privacy Indicator Chip */}
                        <Chip
                          icon={entry.isPrivate ? <LockIcon /> : <PublicIcon />}
                          label={entry.isPrivate ? 'Private' : 'Public'}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: entry.isPrivate ? '#f44336' : '#4caf50',
                            color: entry.isPrivate ? '#f44336' : '#4caf50',
                            bgcolor: entry.isPrivate ? 'rgba(244, 67, 54, 0.05)' : 'rgba(76, 175, 80, 0.05)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': {
                              color: entry.isPrivate ? '#f44336' : '#4caf50',
                              fontSize: '12px'
                            }
                          }}
                        />
                        {entry.mood && (
                          <Chip 
                            label={entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)} 
                            size="small" 
                            sx={{ 
                              bgcolor: getColorForMood(entry.mood),
                              color: 'white'
                            }} 
                          />
                        )}
                      </Stack>
                    </Box>
                    {entry.tags && entry.tags.trim() !== '' && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {entry.tags.split(',').map((tag, index) => (
                          <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewEntry(entry.id)}
                      fullWidth
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
              </Paper>
            </Box>
          </Fade>
        </Container>
      </Box>

      {viewingEntry && (
        <JournalViewer 
          entry={viewingEntry} 
          open={Boolean(viewingEntry)} 
          onClose={handleCloseViewer}
          onOpenFileViewer={handleOpenFileViewer}
          onDownloadFile={handleDownloadFile}
        />
      )}

      {/* File Viewer Modal */}
      <Modal
        open={fileViewer.open}
        onClose={handleCloseFileViewer}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          {fileViewer.files.length > 0 && (() => {
            const currentFile = fileViewer.files[fileViewer.currentIndex];
            const fileType = getFileType(currentFile);
            const fullFileUrl = getFullFileUrl(currentFile);
            
            return (
              <>
                {/* Header */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Typography variant="h6">
                    File {fileViewer.currentIndex + 1} of {fileViewer.files.length}
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleDownloadFile(currentFile)} sx={{ mr: 1 }}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton onClick={handleCloseFileViewer}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ p: 2, textAlign: 'center', minHeight: 300 }}>
                  {fileType === 'image' && (
                    <img 
                      src={fullFileUrl} 
                      alt="File preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '70vh', 
                        objectFit: 'contain' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  )}

                  {fileType === 'video' && (
                    <video 
                      controls 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '70vh' 
                      }}
                    >
                      <source src={fullFileUrl} />
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {fileType === 'audio' && (
                    <Box sx={{ p: 4 }}>
                      <AudioIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <audio controls style={{ width: '100%', maxWidth: 400 }}>
                        <source src={fullFileUrl} />
                        Your browser does not support the audio tag.
                      </audio>
                    </Box>
                  )}

                  {fileType === 'document' && (
                    <Box sx={{ p: 4 }}>
                      <DocumentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Document Preview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This file type cannot be previewed directly
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadFile(currentFile)}
                      >
                        Download File
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Navigation */}
                {fileViewer.files.length > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <IconButton onClick={handlePrevFile}>
                      <PrevIcon />
                    </IconButton>
                    <Typography sx={{ mx: 2 }}>
                      {fileViewer.currentIndex + 1} / {fileViewer.files.length}
                    </Typography>
                    <IconButton onClick={handleNextFile}>
                      <NextIcon />
                    </IconButton>
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      </Modal>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default UserJournals;