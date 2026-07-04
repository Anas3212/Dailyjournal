import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Box,
  Container,
  Fade,
  Zoom,
  Avatar,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  CalendarToday as CalendarTodayIcon,
  LocalOffer as TagIcon,
  InsertEmoticon as MoodIcon,
  ThumbUp as LikeIcon,
  ThumbDown as DislikeIcon,
  Favorite as HeartIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  ThumbDownOutlined as DislikeOutlinedIcon,
  FavoriteBorder as HeartOutlinedIcon,
  Photo as PhotoIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as DocumentIcon,
  Public as PublicIcon,
  Clear as ClearIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import PublishedJournalViewer from '../components/PublishedJournalViewer';
import PaginationControls from '../components/PaginationControls';
import ReportDialog from '../components/ReportDialog';
import ViewReportsDialog from '../components/ViewReportsDialog';
import usePagination from '../hooks/usePagination';
import { getAllPublishedJournals, searchPublishedJournals, recordPublishedView, getPublishedStats, togglePublishedReaction, getBatchPublishedStats } from '../services/api';

function PublishedJournals() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState([]);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [profileImageDialog, setProfileImageDialog] = useState({ open: false, imageUrl: '', userName: '' });
  const [fileViewer, setFileViewer] = useState({ open: false, files: [], currentIndex: 0 });
  const [viewingJournal, setViewingJournal] = useState(null);
  const [mediaPlayer, setMediaPlayer] = useState({ playing: false, volume: 0.7 });
  const [viewerStats, setViewerStats] = useState(null);
  const [batchStats, setBatchStats] = useState({});
  const [reportDialog, setReportDialog] = useState({ open: false, journalId: null, journalTitle: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [viewReportsDialog, setViewReportsDialog] = useState({ open: false, journalId: null, journalTitle: '' });

  const moods = ['happy', 'sad', 'excited', 'calm', 'anxious', 'grateful', 'frustrated', 'inspired'];

  // Initialize pagination with search dependencies
  const pagination = usePagination(
    journals, 
    12, // items per page
    [search, moodFilter, tagFilter], // reset to page 1 when filters change
    {
      persistPageSize: true,
      storageKey: 'published-journals-pagination',
      enableKeyboardNavigation: true,
      autoScrollToTop: true
    }
  );

  useEffect(() => {
    fetchPublishedJournals();
    if (user) {
      fetchCurrentUser();
    }
  }, [user]);

  const fetchCurrentUser = async () => {
    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}`}/api/users/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Dynamic search effect - triggers search as user types with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, moodFilter, tagFilter, sortBy]);

  // Apply sorting when sortBy changes
  useEffect(() => {
    if (journals.length > 0) {
      let sortedJournals = [...journals];
      
      if (sortBy === 'title') {
        sortedJournals = sortedJournals.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'author') {
        sortedJournals = sortedJournals.sort((a, b) => {
          const authorA = a.userName || a.user?.name || 'Anonymous';
          const authorB = b.userName || b.user?.name || 'Anonymous';
          return authorA.localeCompare(authorB);
        });
      } else {
        // Default sort by date (newest first)
        sortedJournals = sortedJournals.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      setJournals(sortedJournals);
    }
  }, [sortBy]);

  const fetchPublishedJournals = async () => {
    setLoading(true);
    try {
      const response = await getAllPublishedJournals();
      const journalsData = response.data || [];
      setJournals(journalsData);
      
      // Fetch batch stats for all journals
      if (journalsData.length > 0) {
        const journalIds = journalsData.map(j => j.id);
        console.log('Fetching batch stats for journal IDs:', journalIds);
        try {
          const statsResponse = await getBatchPublishedStats(journalIds);
          console.log('Batch stats response:', statsResponse.data);
          setBatchStats(statsResponse.data || {});
        } catch (statsError) {
          console.error('Error fetching batch stats:', statsError);
          // Don't show error for stats, just continue without them
        }
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load published journals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Separate search function for dynamic searching
  const performSearch = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (moodFilter) params.mood = moodFilter;
      if (tagFilter && tagFilter.trim()) params.tags = tagFilter.trim();
      
      // If no search parameters, just fetch all published journals
      let response;
      if (Object.keys(params).length === 0) {
        response = await getAllPublishedJournals();
      } else {
        response = await searchPublishedJournals(params);
      }
      
      let results = response.data || [];
      
      // Apply client-side sorting
      if (sortBy === 'title') {
        results = results.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'author') {
        results = results.sort((a, b) => {
          const authorA = a.userName || a.user?.name || 'Anonymous';
          const authorB = b.userName || b.user?.name || 'Anonymous';
          return authorA.localeCompare(authorB);
        });
      } else {
        // Default sort by date (newest first)
        results = results.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      setJournals(results);
      
      // Fetch batch stats for the results
      if (results.length > 0) {
        const journalIds = results.map(j => j.id);
        try {
          const statsResponse = await getBatchPublishedStats(journalIds);
          setBatchStats(statsResponse.data || {});
        } catch (statsError) {
          console.error('Error fetching batch stats:', statsError);
          // Don't show error for stats, just continue without them
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({ 
        open: true, 
        message: `Failed to search published journals: ${error.response?.data?.message || error.message}`, 
        severity: 'error' 
      });
    } finally {
      setSearchLoading(false);
    }
  }, [search, moodFilter, tagFilter, sortBy, user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleClearFilters = () => {
    setSearch('');
    setMoodFilter('');
    setTagFilter('');
    setSortBy('date');
    fetchPublishedJournals();
  };

  const handleViewJournal = (journal) => {
    setViewingJournal(journal);
  };

  const handleCloseViewer = () => {
    setViewingJournal(null);
    setViewerStats(null);
  };

  // Record a view and fetch stats when opening a journal
  useEffect(() => {
    const run = async () => {
      if (!viewingJournal) return;
      try {
        await recordPublishedView(viewingJournal.id);
        const resp = await getPublishedStats(viewingJournal.id);
        setViewerStats(resp.data);
      } catch (e) {
        setSnackbar({ open: true, message: 'Failed to load journal stats', severity: 'warning' });
      }
    };
    run();
  }, [viewingJournal]);

  const handleReaction = async (reactionType, journalId = null) => {
    const targetJournalId = journalId || selectedJournal?.id;
    if (!targetJournalId) return;
    if (!user) {
      setSnackbar({ open: true, message: 'Please sign in to react to journals', severity: 'info' });
      return;
    }
    
    console.log(`Toggling ${reactionType} for journal ${targetJournalId}`);
    
    try {
      const response = await togglePublishedReaction(targetJournalId, reactionType);
      console.log('Reaction response:', response.data);
      
      // Update viewer stats if this is for the currently viewed journal
      if (viewingJournal && targetJournalId === viewingJournal.id) {
        setViewerStats(response.data);
      }
      
      // Update batch stats for the card
      setBatchStats(prev => {
        const updated = {
          ...prev,
          [targetJournalId]: response.data
        };
        console.log('Updated batch stats:', updated);
        return updated;
      });
      
      setSnackbar({ 
        open: true, 
        message: `Reaction ${response.data.userReaction ? 'added' : 'removed'}!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      setSnackbar({ open: true, message: 'Failed to update reaction', severity: 'error' });
    }
  };

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

  const handleTogglePlay = () => {
    setMediaPlayer(prev => ({ ...prev, playing: !prev.playing }));
  };

  const handleVolumeChange = (event, newValue) => {
    setMediaPlayer(prev => ({ ...prev, volume: newValue }));
  };

  // File utility functions
  const getFileIcon = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <PhotoIcon />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return <VideoIcon />;
    if (['mp3', 'wav', 'ogg'].includes(extension)) return <AudioIcon />;
    return <DocumentIcon />;
  };

  // Utility functions for file handling
  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    return 'document';
  };

  const getFullFileUrl = (url) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/journals/media/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}?t=${Date.now()}`;
    if (!url.startsWith('/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}?t=${Date.now()}`;
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}?t=${Date.now()}`;
  };

  const handleDownloadFile = async (url) => {
    try {
      const fullUrl = getFullFileUrl(url);
      const filename = url.split('/').pop();
      
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
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSnackbar({ open: true, message: 'File downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({ open: true, message: 'Failed to download file', severity: 'error' });
    }
  };


  const getMoodColor = (mood) => {
    const colors = {
      happy: '#4caf50',
      sad: '#2196f3',
      excited: '#ff9800',
      calm: '#9c27b0',
      anxious: '#f44336',
      grateful: '#795548',
      frustrated: '#e91e63',
      inspired: '#00bcd4'
    };
    return colors[mood?.toLowerCase()] || '#757575';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    
    // Extract filename from the stored path
    const filename = profilePicture.includes('/') 
      ? profilePicture.split('/').pop() 
      : profilePicture;
    
    // Add cache busting timestamp
    const timestamp = Date.now();
    return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/${filename}?t=${timestamp}`;
  };

  const handleProfileImageClick = (journal) => {
    const profilePicture = journal.userProfilePicture;
    if (profilePicture) {
      const imageUrl = getProfilePhotoUrl(profilePicture);
      setProfileImageDialog({
        open: true,
        imageUrl: imageUrl,
        userName: journal.userName || 'Unknown User'
      });
    }
  };

  const handleCloseProfileDialog = () => {
    setProfileImageDialog({ open: false, imageUrl: '', userName: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
      {/* Enhanced Header Section */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                mr: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <PublicIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Published Journals
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Discover and read journals shared by our community
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Search and Filters */}
      <Fade in timeout={1000}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: (theme) => theme.shadows[4]
            }
          }}
        >
          <form onSubmit={handleSearch}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Search journals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {searchLoading ? (
                          <CircularProgress size={20} color="primary" />
                        ) : (
                          <SearchIcon color="primary" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <TextField
                  fullWidth
                  label="Filter by Tags"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  variant="outlined"
                  placeholder="e.g. travel, work"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Mood</InputLabel>
                  <Select
                    value={moodFilter}
                    label="Filter by Mood"
                    onChange={(e) => setMoodFilter(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  >
                    <MenuItem value="">All Moods</MenuItem>
                    <MenuItem value="happy">😊 Happy</MenuItem>
                    <MenuItem value="sad">😢 Sad</MenuItem>
                    <MenuItem value="excited">🎉 Excited</MenuItem>
                    <MenuItem value="calm">😌 Calm</MenuItem>
                    <MenuItem value="anxious">😰 Anxious</MenuItem>
                    <MenuItem value="grateful">🙏 Grateful</MenuItem>
                    <MenuItem value="frustrated">😤 Frustrated</MenuItem>
                    <MenuItem value="inspired">✨ Inspired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  >
                    <MenuItem value="date">📅 Date</MenuItem>
                    <MenuItem value="title">📝 Title</MenuItem>
                    <MenuItem value="author">👤 Author</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Stack spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ 
                      height: '56px',
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 10px 4px rgba(102, 126, 234, .3)'
                      }
                    }}
                  >
                    <SearchIcon sx={{ mr: 1 }} />
                    Search
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            {(search || moodFilter || tagFilter) && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}
          </form>
        </Paper>
      </Fade>

      {/* Enhanced Results Section */}
      {journals.length === 0 ? (
        <Fade in timeout={600}>
          <Paper 
            elevation={2}
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ mb: 3 }}>
              <PublicIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              No Published Journals Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              Try adjusting your search criteria or check back later for new published journals from our community.
            </Typography>
          </Paper>
        </Fade>
      ) : (
        <Fade in timeout={600}>
          <Grid container spacing={3}>
            {pagination.paginatedData.map((journal, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={journal.id}>
                <Fade in timeout={300 + index * 100}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${getMoodColor(journal.mood)} 0%, ${getMoodColor(journal.mood)}88 100%)`,
                        zIndex: 1
                      },
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        '&::after': {
                          opacity: 1
                        }
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                        zIndex: 0
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative', zIndex: 1 }}>
                      {/* Enhanced Header with Author */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          src={getProfilePhotoUrl(journal.user?.profilePicture || journal.userProfilePicture)}
                          onClick={() => handleProfileImageClick(journal)}
                          sx={{ 
                            bgcolor: getMoodColor(journal.mood),
                            mr: 2,
                            width: 48,
                            height: 48,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            cursor: journal.userProfilePicture ? 'pointer' : 'default',
                            '&:hover': {
                              transform: journal.userProfilePicture ? 'scale(1.05)' : 'none',
                              transition: 'transform 0.2s ease-in-out'
                            }
                          }}
                        >
                          {getInitials(journal.userName || journal.user?.name)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 700,
                              color: 'text.primary',
                              mb: 0.5
                            }}
                          >
                            {journal.userName || journal.user?.name || 'Anonymous'}
                          </Typography>
                          { (journal.userEmail || journal.user?.email) && (
                            <Typography 
                              variant="caption"
                              sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}
                            >
                              {journal.userEmail || journal.user?.email}
                            </Typography>
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          >
                            <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            {formatDate(journal.date)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Enhanced Title */}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'text.primary',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 2,
                          minHeight: '3.5rem'
                        }}
                      >
                        {journal.title}
                      </Typography>

                      {/* Enhanced Content Preview */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 3,
                          minHeight: '4.5rem'
                        }}
                      >
                        {journal.content}
                      </Typography>

                      {/* Enhanced Mood and Tags */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label={journal.mood || 'No mood'}
                            size="small"
                            sx={{
                              bgcolor: getMoodColor(journal.mood),
                              color: 'white',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                          {journal.tags && journal.tags.split(',').slice(0, 2).map((tag, idx) => (
                            <Chip
                              key={idx}
                              label={tag.trim()}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: getMoodColor(journal.mood),
                                color: getMoodColor(journal.mood),
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: getMoodColor(journal.mood),
                                  color: 'white',
                                  transform: 'scale(1.05)'
                                }
                              }}
                            />
                          ))}
                          {journal.tags && journal.tags.split(',').length > 2 && (
                            <Chip
                              label={`+${journal.tags.split(',').length - 2} more`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(0,0,0,0.08)',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            />
                          )}
                        </Stack>
                      </Box>

                      {/* Reaction Controls */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                              size="small"
                              startIcon={batchStats[journal.id]?.userReaction === 'LIKE' ? <LikeIcon /> : <LikeOutlinedIcon />}
                              onClick={() => handleReaction('LIKE', journal.id)}
                              sx={{
                                color: batchStats[journal.id]?.userReaction === 'LIKE' ? 'primary.main' : 'text.secondary',
                                minWidth: 'auto',
                                px: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              {batchStats[journal.id]?.likes || 0}
                            </Button>
                            <Button
                              size="small"
                              startIcon={batchStats[journal.id]?.userReaction === 'DISLIKE' ? <DislikeIcon /> : <DislikeOutlinedIcon />}
                              onClick={() => handleReaction('DISLIKE', journal.id)}
                              sx={{
                                color: batchStats[journal.id]?.userReaction === 'DISLIKE' ? 'error.main' : 'text.secondary',
                                minWidth: 'auto',
                                px: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              {batchStats[journal.id]?.dislikes || 0}
                            </Button>
                            <Button
                              size="small"
                              startIcon={batchStats[journal.id]?.userReaction === 'HEART' ? <HeartIcon /> : <HeartOutlinedIcon />}
                              onClick={() => handleReaction('HEART', journal.id)}
                              sx={{
                                color: batchStats[journal.id]?.userReaction === 'HEART' ? 'error.main' : 'text.secondary',
                                minWidth: 'auto',
                                px: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              {batchStats[journal.id]?.hearts || 0}
                            </Button>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {batchStats[journal.id]?.totalViews || 0} views
                          </Typography>
                        </Stack>
                      </Box>
                    </CardContent>

                    {/* Enhanced Card Actions */}
                    <CardActions sx={{ p: 3, pt: 0, position: 'relative', zIndex: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        <Button
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewJournal(journal)}
                          sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: 2,
                            background: `linear-gradient(45deg, ${getMoodColor(journal.mood)} 30%, ${getMoodColor(journal.mood)}CC 90%)`,
                            boxShadow: `0 4px 12px ${getMoodColor(journal.mood)}40`,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textTransform: 'none',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: `linear-gradient(45deg, ${getMoodColor(journal.mood)}DD 30%, ${getMoodColor(journal.mood)}AA 90%)`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${getMoodColor(journal.mood)}50`
                            }
                          }}
                        >
                          Read Journal
                        </Button>
                        {currentUser && String(currentUser.id) !== String(journal.userId) && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<FlagIcon />}
                            onClick={() => setReportDialog({ 
                              open: true, 
                              journalId: journal.id, 
                              journalTitle: journal.title 
                            })}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              textTransform: 'none',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                              }
                            }}
                          >
                            Report
                          </Button>
                        )}
                        {currentUser && String(currentUser.id) === String(journal.userId) && (
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<FlagIcon />}
                            onClick={() => setViewReportsDialog({ 
                              open: true, 
                              journalId: journal.id, 
                              journalTitle: journal.title 
                            })}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              textTransform: 'none',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                              }
                            }}
                          >
                            View Reports
                          </Button>
                        )}
                      </Stack>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}

      {/* Pagination Controls */}
      {journals.length > 0 && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.handlePageChange}
          onItemsPerPageChange={pagination.handleItemsPerPageChange}
          handleJumpToPage={pagination.handleJumpToPage}
          jumpToPageValue={pagination.jumpToPageValue}
          setJumpToPageValue={pagination.setJumpToPageValue}
          isLoading={pagination.isLoading || searchLoading}
          getStatistics={pagination.getStatistics}
          getPageRange={pagination.getPageRange}
          itemsPerPageOptions={[6, 12, 24, 48]}
          showItemsPerPageSelector={true}
          showResultInfo={true}
          showAdvancedControls={true}
          showStatistics={false}
          enableKeyboardHints={true}
        />
      )}

      {/* File Viewer */}
      <Dialog
        open={fileViewer.open}
        onClose={handleCloseFileViewer}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'background.paper',
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            File Preview ({fileViewer.currentIndex + 1} of {fileViewer.files.length})
          </Typography>
          <Box>
            <Button
              onClick={() => handleDownloadFile(fileViewer.files[fileViewer.currentIndex])}
              startIcon={<DocumentIcon />}
              sx={{ mr: 1 }}
            >
              Download
            </Button>
            <Button onClick={handleCloseFileViewer}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          {fileViewer.files.length > 0 && (() => {
            const currentFile = fileViewer.files[fileViewer.currentIndex];
            const fileType = getFileType(currentFile);
            const fullUrl = getFullFileUrl(currentFile);

            if (fileType === 'image') {
              return (
                <Box sx={{ textAlign: 'center', maxWidth: '100%', maxHeight: '70vh' }}>
                  <img
                    src={fullUrl}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ display: 'none', mt: 2 }}
                  >
                    Failed to load image
                  </Typography>
                </Box>
              );
            } else if (fileType === 'video') {
              return (
                <Box sx={{ textAlign: 'center', maxWidth: '100%' }}>
                  <video
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  >
                    <source src={fullUrl} />
                    Your browser does not support the video tag.
                  </video>
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ display: 'none', mt: 2 }}
                  >
                    Failed to load video
                  </Typography>
                </Box>
              );
            } else if (fileType === 'audio') {
              return (
                <Box sx={{ textAlign: 'center', width: '100%', mt: 4 }}>
                  <AudioIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <audio
                    controls
                    style={{ width: '100%', maxWidth: '500px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  >
                    <source src={fullUrl} />
                    Your browser does not support the audio tag.
                  </audio>
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ display: 'none', mt: 2 }}
                  >
                    Failed to load audio
                  </Typography>
                </Box>
              );
            } else {
              return (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <DocumentIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {currentFile.split('/').pop()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This file type cannot be previewed. Click Download to view it.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleDownloadFile(currentFile)}
                    startIcon={<DocumentIcon />}
                    sx={{ mt: 2 }}
                  >
                    Download File
                  </Button>
                </Box>
              );
            }
          })()}
        </DialogContent>
        {fileViewer.files.length > 1 && (
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={handlePrevFile} disabled={fileViewer.files.length <= 1}>
              Previous
            </Button>
            <Typography variant="body2" sx={{ mx: 2 }}>
              {fileViewer.currentIndex + 1} of {fileViewer.files.length}
            </Typography>
            <Button onClick={handleNextFile} disabled={fileViewer.files.length <= 1}>
              Next
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Published Journal Viewer with Discussions */}
      {viewingJournal && (
        <PublishedJournalViewer
          open={Boolean(viewingJournal)}
          onClose={handleCloseViewer}
          journal={viewingJournal}
          onOpenFileViewer={handleOpenFileViewer}
          onDownloadFile={handleDownloadFile}
          stats={viewerStats}
          onReact={handleReaction}
        />
      )}

      {/* Profile Image Dialog */}
      <Dialog
        open={profileImageDialog.open}
        onClose={handleCloseProfileDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {profileImageDialog.userName}'s Profile Photo
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Box
            component="img"
            src={profileImageDialog.imageUrl}
            alt={`${profileImageDialog.userName}'s profile`}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={handleCloseProfileDialog}
            variant="contained"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialog.open}
        onClose={() => setReportDialog({ open: false, journalId: null, journalTitle: '' })}
        journalId={reportDialog.journalId}
        journalTitle={reportDialog.journalTitle}
      />

      {/* View Reports Dialog */}
      <ViewReportsDialog
        open={viewReportsDialog.open}
        onClose={() => setViewReportsDialog({ open: false, journalId: null, journalTitle: '' })}
        journalId={viewReportsDialog.journalId}
        journalTitle={viewReportsDialog.journalTitle}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
}

export default PublishedJournals;
