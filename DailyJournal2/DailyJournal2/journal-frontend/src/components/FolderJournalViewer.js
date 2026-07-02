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
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Fade,
  Modal,
  Paper
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Folder as FolderIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Tag as TagIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Image as ImageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { getJournalsInFolder, getJournal } from '../services/api';

const FolderJournalViewer = ({ 
  open, 
  onClose, 
  folder, 
  onViewJournal,
  onShowSnackbar 
}) => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileViewer, setFileViewer] = useState({
    open: false,
    files: [],
    currentIndex: 0
  });

  // Fetch journals when dialog opens
  useEffect(() => {
    if (open && folder) {
      fetchFolderJournals();
    }
  }, [open, folder]);

  const fetchFolderJournals = async () => {
    if (!folder?.id) return;
    
    setLoading(true);
    try {
      const response = await getJournalsInFolder(folder.id);
      console.log('Folder journals response:', response);
      
      // Handle different response structures
      const journalsData = response.data?.data || response.data || response || [];
      console.log('Parsed journals:', journalsData);
      
      // Debug date properties for each journal
      journalsData.forEach((journal, index) => {
        console.log(`📅 Journal ${index + 1} date properties:`, {
          id: journal.id,
          title: journal.title,
          createdAt: journal.createdAt,
          date: journal.date,
          created_at: journal.created_at,
          updatedAt: journal.updatedAt,
          updated_at: journal.updated_at
        });
      });
      
      setJournals(journalsData);
    } catch (error) {
      console.error('Error fetching folder journals:', error);
      onShowSnackbar?.('Failed to load folder contents', 'error');
      setJournals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJournal = async (journal) => {
    // Same implementation as Dashboard's handleViewEntry
    setLoading(true);
    try {
      const res = await getJournal(journal.id);
      onClose();
      onViewJournal?.(res.data); // Pass the full journal data with media files
    } catch (error) {
      console.error('Failed to load journal:', error);
      onShowSnackbar?.('Failed to load journal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJournals([]);
    onClose();
  };

  // Helper functions (copied from Dashboard)
  const getMoodColor = (mood) => {
    const moodColors = {
      happy: '#4caf50',
      sad: '#2196f3', 
      excited: '#ff9800',
      calm: '#9c27b0',
      anxious: '#f44336',
      grateful: '#4caf50',
      frustrated: '#ff5722',
      inspired: '#673ab7'
    };
    return moodColors[mood?.toLowerCase()] || '#757575';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileType = (url) => {
    if (!url) return 'document';
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) return 'audio';
    if (['pdf'].includes(extension)) return 'pdf';
    return 'document';
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Add cache busting timestamp for better media loading
    const baseUrl = `${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}`}`}${url}`;
    return `${baseUrl}?t=${Date.now()}`;
  };

  // Authenticated Image Component for private media (copied from Dashboard)
  const AuthenticatedImage = ({ url, alt, style, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (!url) return;

      const loadImage = async () => {
        try {
          setLoading(true);
          setError(false);
          
          const fullUrl = getFullFileUrl(url);
          // Use cookies for authentication
          const response = await fetch(fullUrl, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setImageSrc(imageUrl);
        } catch (error) {
          console.error('Error loading image:', error);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      loadImage();

      // Cleanup function to revoke object URL
      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [url]);

    if (loading) {
      return (
        <Box 
          sx={{ 
            ...style, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <CircularProgress size={20} />
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
            backgroundColor: '#f5f5f5',
            color: 'text.secondary'
          }}
        >
          <ImageIcon />
        </Box>
      );
    }

    return <img src={imageSrc} alt={alt} style={style} {...props} />;
  };

  // File viewer handlers
  const handleOpenFileViewer = (files, startIndex = 0) => {
    setFileViewer({
      open: true,
      files: files || [],
      currentIndex: startIndex
    });
  };

  const handleCloseFileViewer = () => {
    setFileViewer({
      open: false,
      files: [],
      currentIndex: 0
    });
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
      const response = await fetch(fullUrl, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      onShowSnackbar?.('Failed to download file', 'error');
    }
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <FolderOpenIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" component="span">
                {folder?.name || 'Folder'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({journals.length} journal{journals.length !== 1 ? 's' : ''})
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading journals...
            </Typography>
          </Box>
        ) : journals.length === 0 ? (
          <Box textAlign="center" py={8}>
            <FolderIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Journals Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This folder is empty. Add some journals to see them here.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found {journals.length} journal{journals.length !== 1 ? 's' : ''} in "{folder?.name}":
            </Typography>
            
            <Grid container spacing={3}>
              {journals.map((journal, index) => (
                <Fade in timeout={600 + index * 100} key={journal.id || index}>
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card 
                      elevation={4}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                          '& .card-header': {
                            background: `linear-gradient(135deg, ${getMoodColor(journal.mood)} 0%, ${getMoodColor(journal.mood)}dd 100%)`
                          }
                        },
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Card Header with mood-based gradient */}
                      <Box 
                        className="card-header"
                        sx={{
                          background: `linear-gradient(135deg, ${getMoodColor(journal.mood)}22 0%, ${getMoodColor(journal.mood)}11 100%)`,
                          p: 2,
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {journal.title || 'Untitled Journal'}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ ml: 1, flexShrink: 0 }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={journal.mood || 'No mood'}
                            size="small"
                            sx={{
                              bgcolor: getMoodColor(journal.mood),
                              color: 'white',
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}
                          />
                          
                          {/* Privacy Indicator Chip */}
                          <Chip
                            icon={journal.isPrivate ? <LockIcon /> : <PublicIcon />}
                            label={journal.isPrivate ? 'Private' : 'Public'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: journal.isPrivate ? '#f44336' : '#4caf50',
                              color: journal.isPrivate ? '#f44336' : '#4caf50',
                              bgcolor: journal.isPrivate ? 'rgba(244, 67, 54, 0.05)' : 'rgba(76, 175, 80, 0.05)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                color: journal.isPrivate ? '#f44336' : '#4caf50',
                                fontSize: '12px'
                              }
                            }}
                          />
                          
                          {/* Publish Status Indicator */}
                          {journal.isPublished && (
                            <Chip
                              icon={<ShareIcon />}
                              label="Published"
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: '#2196f3',
                                color: '#2196f3',
                                bgcolor: 'rgba(33, 150, 243, 0.05)',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                '& .MuiChip-icon': {
                                  color: '#2196f3',
                                  fontSize: '12px'
                                }
                              }}
                            />
                          )}
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(journal.createdAt || journal.date || journal.created_at)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Card Content */}
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 2,
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {truncateText(journal.content)}
                        </Typography>

                        {/* Tags */}
                        {journal.tags && (
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {journal.tags.split(',').filter(Boolean).slice(0, 3).map(tag => (
                                <Chip
                                  key={tag}
                                  label={tag.trim()}
                                  size="small"
                                  icon={<TagIcon />}
                                  sx={{
                                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                                    color: '#667eea',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              ))}
                              {journal.tags.split(',').filter(Boolean).length > 3 && (
                                <Chip
                                  label={`+${journal.tags.split(',').filter(Boolean).length - 3}`}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(0,0,0,0.1)',
                                    color: 'text.secondary'
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        )}

                        {/* Files Preview */}
                        {journal.mediaUrls && journal.mediaUrls.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AttachFileIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {journal.mediaUrls.length} file{journal.mediaUrls.length > 1 ? 's' : ''}
                            </Typography>
                            <ImageList sx={{ width: '100%', height: 120, m: 0 }} cols={3} rowHeight={40}>
                              {journal.mediaUrls.slice(0, 6).map((url, idx) => (
                                <ImageListItem key={url} sx={{ cursor: 'pointer' }}>
                                  {getFileType(url) === 'image' ? (
                                    <AuthenticatedImage
                                      url={url}
                                      alt={`File ${idx + 1}`}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleOpenFileViewer(journal.mediaUrls, idx)}
                                    />
                                  ) : (
                                    <Box
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleOpenFileViewer(journal.mediaUrls, idx)}
                                    >
                                      <InsertDriveFileIcon />
                                    </Box>
                                  )}
                                  <ImageListItemBar
                                    sx={{
                                      background: 'rgba(0,0,0,0.7)',
                                      '& .MuiImageListItemBar-title': {
                                        fontSize: '0.75rem',
                                        textAlign: 'center'
                                      }
                                    }}
                                    title={journal.mediaUrls.length > 6 && idx === 5 ? `+${journal.mediaUrls.length - 6} more` : ''}
                                  />
                                </ImageListItem>
                              ))}
                            </ImageList>
                            {journal.mediaUrls.length > 6 && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenFileViewer(journal.mediaUrls, 0)}
                                sx={{ mt: 1 }}
                              >
                                View All Files ({journal.mediaUrls.length})
                              </Button>
                            )}
                          </Box>
                        )}
                      </CardContent>

                      {/* Card Actions */}
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewJournal(journal)}
                            sx={{ flex: 1 }}
                          >
                            View
                          </Button>
                        </Stack>
                      </CardActions>
                    </Card>
                  </Grid>
                </Fade>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>

    {/* File Viewer Modal */}
    <Modal
      open={fileViewer.open}
      onClose={handleCloseFileViewer}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        sx={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* File Viewer Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6">
            File {fileViewer.currentIndex + 1} of {fileViewer.files.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => handleDownloadFile(fileViewer.files[fileViewer.currentIndex])}
              size="small"
            >
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={handleCloseFileViewer} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* File Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 400,
          position: 'relative'
        }}>
          {fileViewer.files.length > 0 && (() => {
            const currentFile = fileViewer.files[fileViewer.currentIndex];
            const fileType = getFileType(currentFile);
            
            return (
              <>
                {/* Navigation Buttons */}
                {fileViewer.files.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevFile}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                      }}
                    >
                      <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextFile}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                      }}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </>
                )}

                {/* File Display */}
                {fileType === 'image' && (
                  <AuthenticatedImage
                    url={currentFile}
                    alt="File preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain'
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
                    <source src={getFullFileUrl(currentFile)} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                {fileType === 'audio' && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <audio controls style={{ width: '100%', maxWidth: 400 }}>
                      <source src={getFullFileUrl(currentFile)} type="audio/mpeg" />
                      Your browser does not support the audio tag.
                    </audio>
                  </Box>
                )}

                {(fileType === 'document' || fileType === 'pdf') && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <InsertDriveFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {currentFile.split('/').pop()}
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
              </>
            );
          })()}
        </Box>

        {/* File Info Footer */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}>
          <Typography variant="body2" color="text.secondary">
            {fileViewer.files[fileViewer.currentIndex]?.split('/').pop()}
          </Typography>
        </Box>
      </Paper>
    </Modal>
  </>
  );
};

export default FolderJournalViewer;
