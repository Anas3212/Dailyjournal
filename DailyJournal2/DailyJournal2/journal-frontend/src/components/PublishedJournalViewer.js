import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Paper,
  Divider,
  Stack,
  Avatar,
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Fade,
  Zoom,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Mood as MoodIcon,
  Tag as TagIcon,
  Photo as PhotoIcon,
  VideoLibrary as VideoIcon,
  Audiotrack as AudioIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  AccessTime as TimeIcon,
  Book as BookIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as VisibilityIcon,
  ThumbUpAlt as ThumbUpIcon,
  ThumbDownAlt as ThumbDownIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import DiscussionSection from './DiscussionSection';
import { getFileType as getFileTypeUtil, extractFilename } from '../utils/fileUtils';
import { downloadFile } from '../utils/fileDownload';

function PublishedJournalViewer({ 
  open, 
  onClose, 
  journal, 
  onOpenFileViewer, 
  onDownloadFile, 
  stats: propStats, 
  onReact 
}) {
  const entry = journal; // For compatibility with existing code
  const { user } = useContext(AuthContext);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(propStats || {
    totalViews: 0,
    uniqueViewers: 0,
    likes: 0,
    dislikes: 0,
    hearts: 0,
    userReaction: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState({ open: false, url: '', title: '' });
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: '', title: '' });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Reset page when entry changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [entry?.id]);

  // Sync stats when propStats changes
  useEffect(() => {
    if (propStats) {
      setStats(propStats);
    }
  }, [propStats]);

  const pages = entry?.pages?.length > 0 ? entry.pages : [entry?.content || ''];

  // Fetch journal stats when component opens
  useEffect(() => {
    if (open && entry?.id) {
      fetchJournalStats();
    }
  }, [open, entry?.id]);

  const fetchJournalStats = async () => {
    if (!entry?.id) return;
    
    setLoading(true);
    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/published/${entry.id}/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched journal stats:', data);
        setStats(data);
      } else {
        console.error('Failed to fetch stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching journal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType) => {
    if (onReact) {
      onReact(reactionType, entry?.id);
    }
  };

  // Authenticated Image Component for team journal media
  const AuthenticatedImage = ({ url, alt, sx, onClick, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        try {
          setLoading(true);
          setError(false);
          
          console.log('AuthenticatedImage: Loading image for URL:', url);
          console.log('AuthenticatedImage: User available:', !!user);
          
          const fullUrl = getFullFileUrl(url);
          console.log('AuthenticatedImage: Full URL:', fullUrl);
          
          // Cloudinary URLs are public CDN — no cookies needed (cookies cause CORS error)
          const isCloudinary = fullUrl.startsWith('https://res.cloudinary.com');
          const response = await fetch(fullUrl, {
            credentials: isCloudinary ? 'omit' : 'include'
          });
          
          console.log('AuthenticatedImage: Response status:', response.status);
          console.log('AuthenticatedImage: Response ok:', response.ok);
          
          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('AuthenticatedImage: Blob size:', blob.size);
          console.log('AuthenticatedImage: Blob type:', blob.type);
          
          const imageUrl = URL.createObjectURL(blob);
          console.log('AuthenticatedImage: Created blob URL:', imageUrl);
          setImageSrc(imageUrl);
        } catch (err) {
          console.error('AuthenticatedImage: Error loading image:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      if (url) {
        loadImage();
      }

      // Cleanup blob URL on unmount
      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [url]);

    if (loading) {
      return (
        <Box sx={{ ...sx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      );
    }

    if (error || !imageSrc) {
      return (
        <Box sx={{ ...sx, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
          <Typography variant="body2" color="error">
            Failed to load image
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        component="img"
        src={imageSrc}
        alt={alt}
        sx={sx}
        onClick={onClick}
        {...props}
      />
    );
  };

  const handleDownloadFile = async (url) => {
    try {
      const fullUrl = getFullFileUrl(url);
      const fileName = extractFilename(url);
      await downloadFile(fullUrl, fileName);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getFullFileUrl = (url) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/journals/media/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}?t=${Date.now()}`;
    if (!url.startsWith('/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}?t=${Date.now()}`;
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}?t=${Date.now()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getFileIcon = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <PhotoIcon />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return <VideoIcon />;
    if (['mp3', 'wav', 'ogg'].includes(extension)) return <AudioIcon />;
    if (extension === 'pdf') return <DocumentIcon />;
    return <DocumentIcon />;
  };

  // Delegates to shared utility from '../utils/fileUtils'
  const getFileType = (url) => getFileTypeUtil(url);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    const filename = profilePicture.includes('/') 
      ? profilePicture.split('/').pop() 
      : profilePicture;
    return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!entry) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 1.5
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, mr: 1 }}>
                  {entry.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                  sx={{ color: 'white', mb: 1 }}
                >
                  {isHeaderExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={isHeaderExpanded}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar
                    src={getProfilePhotoUrl(entry.userProfilePicture)}
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      mr: 2,
                      bgcolor: 'rgba(255,255,255,0.3)'
                    }}
                  >
                    {getInitials(entry.userName)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {entry.userName || 'Anonymous'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
                      {entry.userEmail || 'No email available'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {formatDate(entry.date)}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={<MoodIcon />}
                    label={`Mood: ${entry.mood || 'Not specified'}`}
                    size="small"
                    sx={{
                      bgcolor: getMoodColor(entry.mood),
                      color: 'white',
                      fontWeight: 600,
                      px: 1
                    }}
                  />
                  {entry.tags && entry.tags.split(',').map((tag, index) => (
                    <Chip
                      key={index}
                      icon={<TagIcon />}
                      label={tag.trim()}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Stack>
              </Collapse>
            </Box>
            
            <IconButton
              onClick={onClose}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ px: 3 }}
          >
            <Tab 
              icon={<ArticleIcon />} 
              label="Journal Content" 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              icon={<ForumIcon />} 
              label="Discussions" 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Journal Content */}
              <Card elevation={0} sx={{ mb: 3, bgcolor: 'white', borderRadius: 3 }}>
                <Box sx={{ p: 3, pb: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {pages.length > 1 && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton 
                        onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
                        disabled={currentPageIndex === 0}
                        size="small"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Page {currentPageIndex + 1} / {pages.length}
                      </Typography>
                      <IconButton 
                        onClick={() => setCurrentPageIndex(p => Math.min(pages.length - 1, p + 1))}
                        disabled={currentPageIndex === pages.length - 1}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Stack>
                  )}
                </Box>
                <CardContent sx={{ p: 4, pt: pages.length > 1 ? 2 : 4 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.8, 
                      fontSize: '1.1rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {pages[currentPageIndex]}
                  </Typography>
                </CardContent>
              </Card>

              {/* Media Files */}
              {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                <Fade in timeout={600}>
                  <Card elevation={0} sx={{ mb: 3, bgcolor: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <PhotoIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Media Files ({entry.mediaUrls.length})
                      </Typography>

                      {/* Image Gallery */}
                      {entry.mediaUrls.filter(url => getFileType(url) === 'image').length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            Images ({entry.mediaUrls.filter(url => getFileType(url) === 'image').length})
                          </Typography>
                          <Grid container spacing={2}>
                            {entry.mediaUrls
                              .filter(url => getFileType(url) === 'image')
                              .map((url, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                  <Card 
                                    elevation={2}
                                    sx={{ 
                                      position: 'relative',
                                      borderRadius: 2,
                                      overflow: 'hidden',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                      }
                                    }}
                                  >
                                    <AuthenticatedImage
                                      url={url}
                                      alt={`Image ${index + 1}`}
                                      sx={{
                                        width: '100%',
                                        height: 200,
                                        objectFit: 'cover',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => setImagePreview({ 
                                        open: true, 
                                        url: url, 
                                        title: url.split('/').pop() 
                                      })}
                                    />
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        display: 'flex',
                                        gap: 1,
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease',
                                        '.MuiCard-root:hover &': {
                                          opacity: 1
                                        }
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setImagePreview({ 
                                            open: true, 
                                            url: url, 
                                            title: url.split('/').pop() 
                                          });
                                        }}
                                        sx={{
                                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                                          color: 'white',
                                          '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.8)'
                                          }
                                        }}
                                      >
                                        <ZoomInIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(url);
                                        }}
                                        sx={{
                                          bgcolor: 'rgba(76, 175, 80, 0.8)',
                                          color: 'white',
                                          '&:hover': {
                                            bgcolor: 'rgba(76, 175, 80, 1)'
                                          }
                                        }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                    <CardContent sx={{ p: 1.5 }}>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          display: 'block',
                                          fontWeight: 500,
                                          color: 'text.secondary',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {url.split('/').pop()}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      )}

                      {/* PDF Files */}
                      {entry.mediaUrls.filter(url => getFileType(url) === 'pdf').length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            PDF Documents ({entry.mediaUrls.filter(url => getFileType(url) === 'pdf').length})
                          </Typography>
                          <Grid container spacing={2}>
                            {entry.mediaUrls
                              .filter(url => getFileType(url) === 'pdf')
                              .map((url, idx) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 2,
                                      bgcolor: 'grey.50',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        bgcolor: 'grey.100',
                                        borderColor: 'error.main'
                                      }
                                    }}
                                  >
                                    <Box sx={{ mr: 2, color: 'error.main' }}>
                                      {getFileIcon(url)}
                                    </Box>
                                    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 500 }}>
                                      {url.split('/').pop()}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const pdfUrl = getFullFileUrl(url);
                                          setPdfPreview({ 
                                            open: true, 
                                            url: pdfUrl, 
                                            title: url.split('/').pop() 
                                          });
                                        }}
                                        sx={{ 
                                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                                        }}
                                      >
                                        <ZoomInIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDownloadFile(url)}
                                        sx={{ 
                                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                        }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      )}

                      {/* Other Files */}
                      {entry.mediaUrls.filter(url => getFileType(url) !== 'image' && getFileType(url) !== 'pdf').length > 0 && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            Other Files
                          </Typography>
                          <Grid container spacing={2}>
                            {entry.mediaUrls
                              .filter(url => getFileType(url) !== 'image' && getFileType(url) !== 'pdf')
                              .map((url, idx) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 2,
                                      bgcolor: 'grey.50',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        bgcolor: 'grey.100',
                                        borderColor: 'primary.main'
                                      }
                                    }}
                                  >
                                    <Box sx={{ mr: 2, color: 'text.secondary' }}>
                                      {getFileIcon(url)}
                                    </Box>
                                    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 500 }}>
                                      {url.split('/').pop()}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={() => onOpenFileViewer(entry.mediaUrls, 
                                          entry.mediaUrls.indexOf(url))}
                                        sx={{ 
                                          bgcolor: 'rgba(102, 126, 234, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                                        }}
                                      >
                                        <ZoomInIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDownloadFile(url)}
                                        sx={{ 
                                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                        }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Stats and Reactions */}
              {stats && (
                <Card elevation={0} sx={{ bgcolor: 'white', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <VisibilityIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {stats.totalViews || 0} views
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {stats.hearts || 0} hearts
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ThumbUpIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {stats.likes || 0} likes
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ThumbDownIcon sx={{ mr: 1, color: 'warning.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {stats.dislikes || 0} dislikes
                          </Typography>
                        </Box>
                      </Stack>

                      {user && (
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            onClick={() => handleReaction('HEART')}
                            color={stats.userReaction === 'HEART' ? 'error' : 'default'}
                            sx={{
                              bgcolor: stats.userReaction === 'HEART' ? 'error.light' : 'transparent',
                              '&:hover': { bgcolor: 'error.light' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {stats.userReaction === 'HEART' ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                          </IconButton>
                          <IconButton
                            onClick={() => handleReaction('LIKE')}
                            color={stats.userReaction === 'LIKE' ? 'success' : 'default'}
                            sx={{
                              bgcolor: stats.userReaction === 'LIKE' ? 'success.light' : 'transparent',
                              '&:hover': { bgcolor: 'success.light' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ThumbUpIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleReaction('DISLIKE')}
                            color={stats.userReaction === 'DISLIKE' ? 'warning' : 'default'}
                            sx={{
                              bgcolor: stats.userReaction === 'DISLIKE' ? 'warning.light' : 'transparent',
                              '&:hover': { bgcolor: 'warning.light' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ThumbDownIcon />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {/* Discussion Section */}
              <DiscussionSection 
                journalId={entry.id}
                journalTitle={entry.title}
                journalAuthorId={entry.userId}
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={() => setImagePreview({ open: false, url: '', title: '' })}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 2
          }
        }}
      >
        <DialogContent sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <AuthenticatedImage
              url={imagePreview.url}
              alt={imagePreview.title}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 1
              }}
            />
            <IconButton
              onClick={() => setImagePreview({ open: false, url: '', title: '' })}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDownloadFile(imagePreview.url.split('?')[0])}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'rgba(76, 175, 80, 0.8)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 1)'
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              color: 'white',
              fontWeight: 500
            }}
          >
            {imagePreview.title}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog
        open={pdfPreview.open}
        onClose={() => setPdfPreview({ open: false, url: '', title: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            PDF Document
          </Typography>
          <IconButton
            onClick={() => setPdfPreview({ open: false, url: '', title: '' })}
            sx={{ 
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          {/* PDF Document Icon and Info */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}>
            <Box sx={{ 
              p: 3,
              borderRadius: '50%',
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              mb: 3
            }}>
              <DocumentIcon sx={{ fontSize: 48, color: 'error.main' }} />
            </Box>
            
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              {pdfPreview.title}
            </Typography>
            
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              PDF Document • Ready to view or download
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<ZoomInIcon />}
              onClick={() => {
                window.open(pdfPreview.url, '_blank');
                setPdfPreview({ open: false, url: '', title: '' });
              }}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Open in New Tab
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={() => {
                handleDownloadFile(pdfPreview.url.split('?')[0]);
                setPdfPreview({ open: false, url: '', title: '' });
              }}
              sx={{
                borderColor: 'grey.300',
                color: 'text.primary',
                '&:hover': { 
                  borderColor: 'grey.400',
                  bgcolor: 'grey.50'
                },
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Download PDF
            </Button>
          </Stack>

          {/* Info Text */}
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 3, 
              color: 'text.secondary',
              display: 'block',
              fontStyle: 'italic'
            }}
          >
            Opening in a new tab provides the best PDF viewing experience
          </Typography>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default PublishedJournalViewer;
