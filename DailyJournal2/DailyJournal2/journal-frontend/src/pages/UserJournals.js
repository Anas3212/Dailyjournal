import React, { useContext, useEffect, useState, useCallback } from 'react';
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



  const fetchCurrentUser = useCallback(async () => {
    try {
      const userRes = await getCurrentUser();
      setCurrentUser(userRes.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, [userId]);

  const fetchJournals = useCallback(async () => {
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
  }, [currentUser, userId]);

  useEffect(() => {
    if (!user) return;
    fetchCurrentUser();
    fetchJournals();
  }, [user, userId, fetchCurrentUser, fetchJournals]);


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
      
      if (isCloudinary) {
        let downloadUrl = fullUrl;
        if (!fullUrl.includes('/raw/upload/')) {
          downloadUrl = fullUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = url.split('/').pop().split('?')[0];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
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
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: 4,
          position: 'relative'
        }}
      >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Modern Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, flexWrap: 'wrap', gap: 2 }}>
              <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ 
                  backgroundColor: 'white',
                  color: '#667eea',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                }}
              >
                <JournalIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              
              <Box sx={{ ml: 1 }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800,
                    color: '#2d3748',
                    letterSpacing: '-0.5px',
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  {userName ? `${userName}'s Journals` : 'User Journals'}
                </Typography>
                
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#718096',
                    mt: 0.5,
                    fontWeight: 500
                  }}
                >
                  Explore the journal entries and discover shared thoughts and experiences
                </Typography>
              </Box>
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

        <Box sx={{ 
          display: 'flex', 
          mb: 5, 
          flexWrap: 'wrap', 
          gap: 3, 
          p: 3, 
          borderRadius: 4, 
          bgcolor: '#f8fafc', 
          border: '1px solid #e2e8f0',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexGrow: 1, gap: '16px' }}>
            <TextField
              fullWidth
              placeholder="Search journals by title or content..."
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  bgcolor: 'white', 
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }
                } 
              }}
              InputProps={{
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end" size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={searchLoading}
              sx={{ 
                borderRadius: 3, 
                px: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #633f8a 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                }
              }}
            >
              Search
            </Button>
          </form>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="mood-filter-label">Filter by Mood</InputLabel>
            <Select
              labelId="mood-filter-label"
              value={filterMood}
              label="Filter by Mood"
              onChange={handleFilterChange}
              sx={{ 
                bgcolor: 'white', 
                borderRadius: 3,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.1)'
                }
              }}
              startAdornment={
                <InputAdornment position="start" sx={{ ml: 1 }}>
                  <FilterIcon color="action" />
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
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={entry.id}>
                <Card 
                  elevation={0} 
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: 'linear-gradient(to bottom right, #ffffff, #fafafa)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      borderColor: 'transparent',
                      '& .view-btn': {
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea'
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '16px 16px 0 0'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#2d3748',
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {entry.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 3,
                        color: '#4a5568',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.6
                      }}
                    >
                      {entry.content}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: '#718096' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatDate(entry.date)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {/* Privacy Indicator Chip */}
                        <Chip
                          icon={entry.isPrivate ? <LockIcon /> : <PublicIcon />}
                          label={entry.isPrivate ? 'Private' : 'Public'}
                          size="small"
                          sx={{
                            borderColor: entry.isPrivate ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)',
                            color: entry.isPrivate ? '#d32f2f' : '#2e7d32',
                            bgcolor: entry.isPrivate ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            border: '1px solid',
                            '& .MuiChip-icon': {
                              color: 'inherit',
                              fontSize: '14px'
                            }
                          }}
                        />
                        {entry.mood && (
                          <Chip 
                            label={entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)} 
                            size="small" 
                            sx={{ 
                              bgcolor: getColorForMood(entry.mood),
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }} 
                          />
                        )}
                      </Stack>
                    </Box>
                    {entry.tags && entry.tags.trim() !== '' && (
                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                        {entry.tags.split(',').map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag.trim()} 
                            size="small" 
                            sx={{
                              bgcolor: 'rgba(0,0,0,0.04)',
                              color: '#4a5568',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              borderRadius: 2
                            }} 
                          />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                  
                  <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                  
                  <CardActions sx={{ p: 2, pt: 1.5 }}>
                    <Button 
                      className="view-btn"
                      size="medium" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewEntry(entry.id)}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        color: 'text.secondary',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea'
                        }
                      }}
                    >
                      Read Full Entry
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