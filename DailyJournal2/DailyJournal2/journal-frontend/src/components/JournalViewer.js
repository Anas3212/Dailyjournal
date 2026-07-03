import React, { useState, useEffect } from 'react';
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
  Grid
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
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Book as BookIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as VisibilityIcon,
  ThumbUpAlt as ThumbUpIcon,
  ThumbDownAlt as ThumbDownIcon
} from '@mui/icons-material';

function JournalViewer({ open, onClose, entry, onDeleteFile, onOpenFileViewer, stats, onReact }) {
  if (!entry) return null;

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
      link.download = url.split('/').pop(); // Extract filename from URL
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getFileIcon = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <PhotoIcon />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return <VideoIcon />;
    if (['mp3', 'wav', 'ogg'].includes(extension)) return <AudioIcon />;
    return <DocumentIcon />;
  };

  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    return 'document';
  };

  const getFullFileUrl = (url) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/journals/media/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
    if (!url.startsWith('/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}`;
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
  };

  // Authenticated Image Component for private media
  const AuthenticatedImage = ({ url, alt, style, isPrivate = false, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const fetchImage = async () => {
        try {
          setLoading(true);
          setError(false);
          
          const fullUrl = getFullFileUrl(url);
          
          // Cloudinary URLs are public CDN — no cookies needed (and would cause CORS error)
          const isCloudinary = fullUrl.startsWith('https://res.cloudinary.com');
          const response = await fetch(fullUrl, {
            credentials: isCloudinary ? 'omit' : 'include'
          });

          if (response.ok) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            setImageSrc(objectUrl);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error fetching image:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchImage();

      // Cleanup object URL on unmount
      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [url, isPrivate]);

    if (loading) {
      return (
        <Box
          sx={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.1)',
            color: 'text.secondary'
          }}
        >
          Loading...
        </Box>
      );
    }

    if (error || !imageSrc) {
      return (
        <Box
          sx={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.1)',
            color: 'text.secondary'
          }}
        >
          Failed to load
        </Box>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={alt}
        style={style}
        {...props}
      />
    );
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      'happy': '#4caf50',
      'sad': '#2196f3',
      'excited': '#ff9800',
      'angry': '#f44336',
      'calm': '#9c27b0',
      'anxious': '#ff5722',
      'grateful': '#8bc34a',
      'tired': '#607d8b',
      'energetic': '#ffeb3b',
      'peaceful': '#00bcd4'
    };
    return moodColors[mood?.toLowerCase()] || '#667eea';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tags = entry.tags ? (Array.isArray(entry.tags) ? entry.tags : entry.tags.split(',')) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '95vh',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {/* Header with beautiful gradient */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${getMoodColor(entry.mood)} 0%, ${getMoodColor(entry.mood)}dd 100%)`,
            color: 'white',
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative background elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'rotate(45deg)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%'
            }}
          />
          
          {/* Close button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.3)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Title and metadata */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 60,
                  height: 60,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <BookIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {entry.title}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                  A Personal Journal Entry
                </Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CalendarIcon sx={{ fontSize: 24 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(entry.date)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {formatTime(entry.date)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              {entry.mood && (
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <MoodIcon sx={{ fontSize: 24 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {entry.mood}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Current Mood
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              )}
            </Grid>

            {/* Tags */}
            {tags.length > 0 && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <TagIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Tags & Topics
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      size="medium"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          bgcolor: 'rgba(255,255,255,0.3)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>

        {/* Content area */}
        <Box sx={{ p: 4, overflow: 'auto', maxHeight: '60vh' }}>
          {/* Content text */}
          <Card elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
              Your Thoughts & Reflections
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: 2,
                fontSize: '1.1rem',
                whiteSpace: 'pre-wrap',
                fontFamily: '"Georgia", serif',
                color: 'text.secondary',
                textAlign: 'justify'
              }}
            >
              {entry.content}
            </Typography>
          </Card>

          {/* Files section */}
          {entry.mediaUrls && entry.mediaUrls.length > 0 && (
            <Fade in timeout={800}>
              <Card elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                  📎 Attachments ({entry.mediaUrls.length})
                </Typography>
                
                <ImageList sx={{ width: '100%', height: 250, mb: 3 }} cols={4} rowHeight={100}>
                  {entry.mediaUrls.slice(0, 8).map((url, idx) => (
                    <ImageListItem key={url} sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}>
                      {getFileType(url) === 'image' ? (
                        <AuthenticatedImage
                          url={url}
                          alt={`File ${idx + 1}`}
                          isPrivate={entry.isPrivate}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}
                          onClick={() => onOpenFileViewer(entry.mediaUrls, idx)}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}
                          onClick={() => onOpenFileViewer(entry.mediaUrls, idx)}
                        >
                          {getFileIcon(url)}
                        </Box>
                      )}
                      <ImageListItemBar
                        sx={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8,
                          '& .MuiImageListItemBar-title': {
                            fontSize: '0.7rem',
                            color: 'white',
                            fontWeight: 600
                          }
                        }}
                        title={url.split('/').pop()}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>

                {entry.mediaUrls.length > 8 && (
                  <Button
                    variant="outlined"
                    onClick={() => onOpenFileViewer(entry.mediaUrls, 0)}
                    sx={{ mb: 3 }}
                  >
                    View All Files ({entry.mediaUrls.length})
                  </Button>
                )}

                {/* File list */}
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                    📁 File Details
                  </Typography>
                  <Grid container spacing={2}>
                    {entry.mediaUrls.map((url, idx) => (
                      <Grid item xs={12} key={url}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            '&:hover': { 
                              bgcolor: 'rgba(102, 126, 234, 0.05)',
                              transform: 'translateX(4px)'
                            },
                            transition: 'all 0.3s ease'
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
                              onClick={() => onOpenFileViewer(entry.mediaUrls, idx)}
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
              </Card>
            </Fade>
          )}

          {/* Entry metadata */}
          <Card elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Entry ID: {entry.id} • Created on {formatDate(entry.date)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <FavoriteIcon sx={{ color: getMoodColor(entry.mood), fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary">
                  Personal Journal Entry
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default JournalViewer; 