import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Grid,
  Alert,
  Snackbar,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  DeleteForever as RemoveImageIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmDialog from './ConfirmDialog';

// Component to handle authenticated image loading
const NoticeImage = ({ teamId, noticeId, isPinned, version }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // ✅ Use cookies for authentication
        const response = await api.get(
          `/teams/${teamId}/notices/${noticeId}/image?v=${encodeURIComponent(version || '')}`,
          {
            responseType: 'blob'
          }
        );
        
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('Failed to load image for notice', noticeId, error);
        setImageError(true);
      }
    };

    loadImage();
    
    // Cleanup function to revoke object URL
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [teamId, noticeId, version]);

  if (imageError || !imageSrc) {
    return null;
  }

  return (
    <Box
      sx={{
        height: 200,
        overflow: 'hidden',
        position: 'relative',
        mt: isPinned ? 2 : 0
      }}
    >
      <img
        src={imageSrc}
        alt="Notice attachment"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.3s ease'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          borderRadius: 2,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        <ImageIcon sx={{ fontSize: 14 }} />
        IMAGE
      </Box>
    </Box>
  );
};

// Component for viewing images in dialog
const NoticeImageViewer = ({ teamId, noticeId, version }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // ✅ Use cookies for authentication
        const response = await api.get(
          `/teams/${teamId}/notices/${noticeId}/image?v=${encodeURIComponent(version || '')}`,
          {
            responseType: 'blob'
          }
        );
        
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('Failed to load image for notice viewer', noticeId, error);
        setImageError(true);
      }
    };

    loadImage();
    
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [teamId, noticeId, version]);

  if (imageError || !imageSrc) {
    return null;
  }

  return (
    <Box sx={{ mb: 4, textAlign: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          display: 'inline-block',
          maxWidth: '100%'
        }}
      >
        <img
          src={imageSrc}
          alt="Notice attachment"
          style={{
            maxWidth: '100%',
            maxHeight: '400px',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </Paper>
    </Box>
  );
};

const NoticeBoard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [userRole, setUserRole] = useState('MEMBER');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingNotice, setViewingNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
    fetchUserRole();
  }, [teamId]);

  const fetchNotices = async () => {
    try {
      // ✅ Use cookies for authentication
      const response = await api.get(`/teams/${teamId}/notices`);
      setNotices(response.data);
    } catch (error) {
      showSnackbar('Error fetching notices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      // ✅ Use cookies for authentication
      const response = await api.get(`/teams/${teamId}`);
      setUserRole(response.data.userRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const canManageNotices = () => {
    return userRole === 'MASTER' || userRole === 'ADMIN';
  };

  const handleCreateNotice = () => {
    setEditingNotice(null);
    setFormData({ title: '', content: '', priority: 'NORMAL' });
    setSelectedImage(null);
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority
    });
    setSelectedImage(null);
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleViewNotice = (notice) => {
    setViewingNotice(notice);
    setViewDialogOpen(true);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('Image size must be less than 5MB', 'error');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select a valid image file', 'error');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSaveNotice = async () => {
    try {
      // ✅ Use cookies for authentication
      
      // Use FormData for multipart upload when image is present
      if (selectedImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('content', formData.content);
        formDataToSend.append('priority', formData.priority);
        formDataToSend.append('image', selectedImage);
        
        if (editingNotice) {
          // Update existing notice with image
          await api.put(
            `/teams/${teamId}/notices/${editingNotice.id}`,
            formDataToSend,
            { 
              headers: { 
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
          showSnackbar('Notice updated successfully', 'success');
        } else {
          // Create new notice with image
          await api.post(
            `/teams/${teamId}/notices`,
            formDataToSend,
            { 
              headers: { 
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
          showSnackbar('Notice created successfully', 'success');
        }
      } else {
        // Use JSON for text-only notices (existing functionality)
        if (editingNotice) {
          await api.put(
            `/teams/${teamId}/notices/${editingNotice.id}`,
            formData
          );
          showSnackbar('Notice updated successfully', 'success');
        } else {
          await api.post(
            `/teams/${teamId}/notices`,
            formData
          );
          showSnackbar('Notice created successfully', 'success');
        }
      }
      
      setOpenDialog(false);
      fetchNotices();
    } catch (error) {
      showSnackbar('Error saving notice', 'error');
    }
  };

  const handleDeleteNotice = (noticeId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Notice',
      message: 'Are you sure you want to delete this notice? This action cannot be undone.',
      onConfirm: async () => {
        try {
          // ✅ Use cookies for authentication
          await api.delete(`/teams/${teamId}/notices/${noticeId}`);
          showSnackbar('Notice deleted successfully', 'success');
          fetchNotices();
        } catch (error) {
          showSnackbar('Error deleting notice', 'error');
        } finally {
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleTogglePin = async (noticeId) => {
    try {
      // ✅ Use cookies for authentication
      const response = await api.put(`/teams/${teamId}/notices/${noticeId}/pin`, {});
      
      // Update with server response for accuracy
      setNotices(prevNotices => 
        prevNotices.map(notice => 
          notice.id === noticeId 
            ? { ...notice, pinned: response.data.pinned }
            : notice
        ).sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned - a.pinned;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      );
      
      showSnackbar(response.data.pinned ? 'Notice pinned successfully' : 'Notice unpinned successfully', 'success');
    } catch (error) {
      console.error('Pin toggle error:', error);
      showSnackbar('Error updating pin status', 'error');
      fetchNotices();
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case 'URGENT': return 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)';
      case 'HIGH': return 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)';
      case 'NORMAL': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'LOW': return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      default: return 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'URGENT': return '🔴 URGENT';
      case 'HIGH': return '🟡 HIGH';
      case 'NORMAL': return '🔵 NORMAL';
      case 'LOW': return '🟢 LOW';
      default: return priority;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'MASTER': return '#f56565'; // Red
      case 'ADMIN': return '#ed8936'; // Orange
      case 'MEMBER': return '#4299e1'; // Blue
      default: return '#718096'; // Gray
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'MASTER': return '👑';
      case 'ADMIN': return '⚡';
      case 'MEMBER': return '👤';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading notices...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Enhanced Header with Gradient */}
      <Paper 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 0,
          mb: 3
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <IconButton 
                onClick={() => navigate(`/teams/${teamId}`)} 
                sx={{ 
                  mr: 2, 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  📋 Team Notice Board
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Stay updated with important team announcements
                </Typography>
              </Box>
            </Box>
            {canManageNotices() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNotice}
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Create Notice
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, pb: 3 }}>
        {/* Enhanced Empty State */}
        {notices.length === 0 ? (
          <Paper 
            elevation={0}
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: '4rem', 
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                📋
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4a5568', mb: 1 }}>
                No notices yet
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                {canManageNotices() 
                  ? 'Create the first notice to keep your team informed about important updates and announcements!' 
                  : 'Your team masters and admins can create notices here to share important information.'}
              </Typography>
            </Box>
            {canManageNotices() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNotice}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Create First Notice
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {notices.map((notice) => (
              <Grid key={notice.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 5,
                    overflow: 'hidden',
                    background: notice.pinned 
                      ? 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)',
                    border: notice.pinned 
                      ? '3px solid transparent'
                      : '1px solid rgba(0,0,0,0.06)',
                    backgroundImage: notice.pinned 
                      ? 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%), linear-gradient(135deg, #667eea, #764ba2)'
                      : 'none',
                    backgroundOrigin: notice.pinned ? 'border-box' : 'padding-box',
                    backgroundClip: notice.pinned ? 'content-box, border-box' : 'padding-box',
                    boxShadow: notice.pinned 
                      ? '0 12px 48px rgba(102, 126, 234, 0.2), 0 4px 16px rgba(102, 126, 234, 0.1)' 
                      : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: notice.pinned 
                        ? '0 20px 60px rgba(102, 126, 234, 0.3), 0 8px 24px rgba(102, 126, 234, 0.15)' 
                        : '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
                      '& .card-actions': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  {/* Priority Color Bar */}
                  <Box
                    sx={{
                      height: 6,
                      background: getPriorityGradient(notice.priority),
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 2
                    }}
                  />

                  {/* Notice Image */}
                  {notice.hasImage && (
                    <NoticeImage teamId={teamId} noticeId={notice.id} isPinned={notice.pinned} version={notice.updatedAt || notice.createdAt} />
                  )}

                  {/* Pin Badge */}
                  {notice.pinned && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                        zIndex: 3,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <PinIcon sx={{ fontSize: 14 }} />
                      PINNED
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 4, pt: notice.pinned ? 5 : 3 }}>
                    {/* Header Section */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                      <Chip
                        label={getPriorityLabel(notice.priority)}
                        sx={{
                          background: getPriorityGradient(notice.priority),
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: 3,
                          px: 1,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '& .MuiChip-label': { 
                            px: 2,
                            py: 0.5
                          }
                        }}
                      />
                      <Box textAlign="right">
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 600,
                            bgcolor: 'rgba(102, 126, 234, 0.08)',
                            px: 2,
                            py: 0.8,
                            borderRadius: 3,
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {formatDate(notice.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Title Section */}
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        fontWeight: 800,
                        color: '#2d3748',
                        mb: 2,
                        lineHeight: 1.2,
                        fontSize: '1.4rem',
                        background: notice.pinned 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {notice.title}
                    </Typography>
                    
                    {/* Content Section */}
                    <Box
                      sx={{
                        bgcolor: 'rgba(102, 126, 234, 0.02)',
                        borderRadius: 3,
                        p: 2.5,
                        mb: 3,
                        border: '1px solid rgba(102, 126, 234, 0.08)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: getPriorityGradient(notice.priority),
                          borderRadius: '0 2px 2px 0'
                        }
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#4a5568',
                          lineHeight: 1.7,
                          fontSize: '0.95rem',
                          fontWeight: 400,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {notice.content}
                      </Typography>
                    </Box>
                    
                    {/* Author Section */}
                    <Box 
                      display="flex" 
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ 
                        mt: 'auto',
                        pt: 2,
                        borderTop: '2px solid',
                        borderColor: 'rgba(102, 126, 234, 0.1)',
                        background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
                        mx: -4,
                        px: 4,
                        pb: 1
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}
                        >
                          {notice.createdByName?.charAt(0)?.toUpperCase() || '?'}
                        </Box>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#4a5568',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                lineHeight: 1.2
                              }}
                            >
                              {notice.createdByName}
                            </Typography>
                            {notice.createdByRole && (
                              <Chip
                                label={`${getRoleIcon(notice.createdByRole)} ${notice.createdByRole}`}
                                size="small"
                                sx={{
                                  backgroundColor: getRoleColor(notice.createdByRole),
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  height: 20,
                                  borderRadius: 2,
                                  '& .MuiChip-label': {
                                    px: 1,
                                    py: 0
                                  }
                                }}
                              />
                            )}
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            Author
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                
                  {/* Enhanced Action Buttons */}
                  <CardActions 
                    className="card-actions"
                    sx={{ 
                      p: 3, 
                      pt: 0, 
                      justifyContent: 'center',
                      opacity: 0.7,
                      transform: 'translateY(4px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box display="flex" gap={1.5}>
                      {/* View Button - Available to all users */}
                      <IconButton
                        size="medium"
                        onClick={() => handleViewNotice(notice)}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: 3,
                          width: 44,
                          height: 44,
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            transform: 'translateY(-2px) scale(1.1)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                      
                      {/* Management buttons - Only for ADMIN/MASTER */}
                      {canManageNotices() && (
                        <>
                          <IconButton
                            size="medium"
                            onClick={() => handleTogglePin(notice.id)}
                            sx={{
                              background: notice.pinned 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
                              color: notice.pinned ? 'white' : '#64748b',
                              borderRadius: 3,
                              width: 44,
                              height: 44,
                              boxShadow: notice.pinned 
                                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                : '0 2px 8px rgba(0,0,0,0.1)',
                              '&:hover': {
                                background: notice.pinned 
                                  ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                transform: 'translateY(-2px) scale(1.1)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            {notice.pinned ? <PinIcon /> : <UnpinIcon />}
                          </IconButton>
                          
                          <IconButton
                            size="medium"
                            onClick={() => handleEditNotice(notice)}
                            sx={{
                              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                              color: 'white',
                              borderRadius: 3,
                              width: 44,
                              height: 44,
                              boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                                transform: 'translateY(-2px) scale(1.1)',
                                boxShadow: '0 6px 20px rgba(72, 187, 120, 0.4)'
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          
                          <IconButton
                            size="medium"
                            onClick={() => handleDeleteNotice(notice.id)}
                            sx={{
                              background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                              color: 'white',
                              borderRadius: 3,
                              width: 44,
                              height: 44,
                              boxShadow: '0 4px 12px rgba(245, 101, 101, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                                transform: 'translateY(-2px) scale(1.1)',
                                boxShadow: '0 6px 20px rgba(245, 101, 101, 0.4)'
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Enhanced Create/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              overflow: 'visible'
            }
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid #764ba2'
              }
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              📝 {editingNotice ? 'Edit Notice' : 'Create New Notice'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4, mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Notice Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }
              }}
              placeholder="Enter a clear and descriptive title..."
            />
            
            <TextField
              margin="dense"
              label="Notice Content"
              fullWidth
              multiline
              rows={5}
              variant="outlined"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }
              }}
              placeholder="Write your notice content here..."
            />
            
            <FormControl 
              fullWidth 
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }
              }}
            >
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                label="Priority Level"
              >
                <MenuItem value="LOW">🟢 Low Priority</MenuItem>
                <MenuItem value="NORMAL">🔵 Normal Priority</MenuItem>
                <MenuItem value="HIGH">🟡 High Priority</MenuItem>
                <MenuItem value="URGENT">🔴 Urgent Priority</MenuItem>
              </Select>
            </FormControl>

            {/* Image Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#4a5568' }}>
                📸 Attach Image (Optional)
              </Typography>
              
              {/* Image Preview */}
              {imagePreview && (
                <Paper
                  elevation={2}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    maxHeight: 300
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(245, 101, 101, 0.9)',
                      color: 'white',
                      '&:hover': {
                        background: 'rgba(245, 101, 101, 1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <RemoveImageIcon />
                  </IconButton>
                </Paper>
              )}
              
              {/* Upload Button */}
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{
                  width: '100%',
                  py: 2,
                  borderRadius: 3,
                  borderColor: '#667eea',
                  color: '#667eea',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    borderStyle: 'dashed'
                  }
                }}
              >
                {selectedImage ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', textAlign: 'center' }}>
                Supported formats: JPEG, PNG, GIF, WebP (Max: 5MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotice} 
              variant="contained"
              disabled={!formData.title.trim()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: 'grey.300',
                  color: 'grey.500'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {editingNotice ? '✏️ Update Notice' : '✨ Create Notice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notice Viewer Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              maxHeight: '90vh'
            }
          }}
        >
          {viewingNotice && (
            <>
              {/* Notice Viewer Header */}
              <Box
                sx={{
                  background: getPriorityGradient(viewingNotice.priority),
                  color: 'white',
                  p: 3,
                  position: 'relative'
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      label={getPriorityLabel(viewingNotice.priority)}
                      sx={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    />
                    {viewingNotice.pinned && (
                      <Chip
                        icon={<PinIcon sx={{ color: 'white !important' }} />}
                        label="PINNED"
                        sx={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          borderRadius: 3,
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />
                    )}
                  </Box>
                  <IconButton
                    onClick={() => setViewDialogOpen(false)}
                    sx={{
                      color: 'white',
                      background: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mt: 2, 
                    mb: 1,
                    lineHeight: 1.2
                  }}
                >
                  {viewingNotice.title}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} sx={{ opacity: 0.9 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {viewingNotice.createdByName?.charAt(0)?.toUpperCase() || '?'}
                    </Box>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {viewingNotice.createdByName}
                        </Typography>
                        {viewingNotice.createdByRole && (
                          <Chip
                            label={`${getRoleIcon(viewingNotice.createdByRole)} ${viewingNotice.createdByRole}`}
                            size="small"
                            sx={{
                              backgroundColor: getRoleColor(viewingNotice.createdByRole),
                              color: 'white',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              height: 20,
                              borderRadius: 2,
                              '& .MuiChip-label': {
                                px: 1,
                                py: 0
                              }
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {formatDate(viewingNotice.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Notice Content */}
              <DialogContent sx={{ p: 4 }}>
                {/* Notice Image */}
                {viewingNotice.hasImage && (
                  <NoticeImageViewer teamId={teamId} noticeId={viewingNotice.id} version={viewingNotice.updatedAt || viewingNotice.createdAt} />
                )}

                {/* Notice Content */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: 'linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      background: getPriorityGradient(viewingNotice.priority),
                      borderRadius: '0 3px 3px 0'
                    }
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#4a5568',
                      lineHeight: 1.8,
                      fontSize: '1.1rem',
                      fontWeight: 400,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {viewingNotice.content}
                  </Typography>
                </Paper>

                {/* Notice Metadata */}
                <Box 
                  sx={{ 
                    mt: 4, 
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: 3,
                    border: '1px solid rgba(102, 126, 234, 0.1)'
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Created By
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4a5568', mt: 0.5 }}>
                        {viewingNotice.createdByName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Created On
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4a5568', mt: 0.5 }}>
                        {formatDate(viewingNotice.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>

              {/* Action Buttons in Viewer */}
              {canManageNotices() && (
                <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid rgba(102, 126, 234, 0.1)' }}>
                  <Button
                    startIcon={viewingNotice.pinned ? <UnpinIcon /> : <PinIcon />}
                    onClick={() => {
                      handleTogglePin(viewingNotice.id);
                      setViewDialogOpen(false);
                    }}
                    sx={{
                      background: viewingNotice.pinned 
                        ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: viewingNotice.pinned ? '#64748b' : 'white',
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {viewingNotice.pinned ? 'Unpin Notice' : 'Pin Notice'}
                  </Button>
                  
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleEditNotice(viewingNotice);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      color: 'white',
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Edit Notice
                  </Button>
                  
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleDeleteNotice(viewingNotice.id);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      color: 'white',
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Delete Notice
                  </Button>
                </DialogActions>
              )}
            </>
          )}
        </Dialog>

        {/* Enhanced Floating Action Button for Mobile */}
        {canManageNotices() && (
          <Fab
            aria-label="add notice"
            onClick={handleCreateNotice}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', md: 'none' },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default NoticeBoard;

