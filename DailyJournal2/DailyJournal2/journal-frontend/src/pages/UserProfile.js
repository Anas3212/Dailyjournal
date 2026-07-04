import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Avatar,
  Box,
  CircularProgress,
  Stack,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Chip,
  Fade,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon,
  Groups as TeamsIcon,
  Article as JournalIcon,
  Verified as VerifiedIcon,
  Link as LinkIcon,
  FilePresent as FilePresentIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { getUserProfile, getPublicJournals, getUserFriends, getUserTeamsStats, getUserVerifications, getVerificationFile } from '../services/api';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [journalStats, setJournalStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    published: 0
  });
  const [teamsStats, setTeamsStats] = useState({
    teamsCount: 0,
    teamJournalsStats: []
  });
  const [verifications, setVerifications] = useState([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [profileImageDialog, setProfileImageDialog] = useState({ open: false, imageUrl: '', userName: '' });

  useEffect(() => {
    fetchUserProfile();
    fetchJournalStats();
    fetchUserFriends();
    fetchTeamsStats();
    fetchUserVerifications();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile(userId);
      setUserProfile(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load user profile', severity: 'error' });
    }
  };

  const fetchJournalStats = async () => {
    try {
      const response = await getPublicJournals(userId);
      const publicJournals = response.data || [];
      setJournalStats({
        total: publicJournals.length,
        public: publicJournals.filter(j => !j.isPrivate).length,
        private: 0, // We can't see private journals
        published: publicJournals.filter(j => j.isPublished).length
      });
    } catch (error) {
      console.error('Failed to load journal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFriends = async () => {
    try {
      const response = await getUserFriends(userId);
      setFriends(response.data || []);
    } catch (error) {
      console.error('Failed to load user friends:', error);
      setFriends([]);
    }
  };

  const fetchTeamsStats = async () => {
    try {
      const response = await getUserTeamsStats(userId);
      setTeamsStats(response || { teamsCount: 0, teamJournalsStats: [] });
    } catch (error) {
      console.error('Failed to load teams stats:', error);
      setTeamsStats({ teamsCount: 0, teamJournalsStats: [] });
    }
  };

  const fetchUserVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const response = await getUserVerifications(userId);
      setVerifications(response.data || []);
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      setVerifications([]);
    } finally {
      setVerificationsLoading(false);
    }
  };

  const handleViewVerificationFile = async (verification) => {
    try {
      const blob = await getVerificationFile(verification.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load file',
        severity: 'error'
      });
    }
  };

  const getVerificationTypeColor = (type) => {
    switch (type) {
      case 'CERTIFICATE': return '#4caf50';
      case 'AUTHORIZATION': return '#ff9800';
      case 'REWARD': return '#e91e63';
      default: return '#2196f3';
    }
  };

  const getVisibilityColor = (visibility) => {
    switch (visibility) {
      case 'PUBLIC': return '#4caf50';
      case 'FRIENDS': return '#ff9800';
      case 'PRIVATE': return '#f44336';
      default: return '#2196f3';
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith('http')) return profilePicture;
    const filename = profilePicture.split('/').pop();
    return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/${filename}?t=${Date.now()}`;
  };

  const handleOpenProfileImage = () => {
    const imageUrl = getProfilePhotoUrl(userProfile?.profilePicture);
    if (imageUrl) {
      setProfileImageDialog({ open: true, imageUrl, userName: userProfile?.name || 'User' });
    }
  };

  const handleCloseProfileImage = () => {
    setProfileImageDialog({ open: false, imageUrl: '', userName: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
              {/* Header Section */}
              <Box textAlign="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 3 }}>
                  <IconButton 
                    onClick={() => navigate(-1)} 
                    sx={{ 
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

                  {/* Avatar to the left of name; clickable to open full image */}
                  <Avatar
                    src={getProfilePhotoUrl(userProfile?.profilePicture)}
                    onClick={handleOpenProfileImage}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: '3rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      border: '4px solid rgba(255, 255, 255, 0.2)',
                      cursor: userProfile?.profilePicture ? 'pointer' : 'default',
                      '&:hover': {
                        transform: userProfile?.profilePicture ? 'scale(1.03)' : 'none',
                        transition: 'transform 0.2s ease-in-out'
                      }
                    }}
                  >
                    {getInitials(userProfile?.name)}
                  </Avatar>

                  <Box sx={{ textAlign: 'left' }}>
                    <Typography 
                      variant="h3" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        mb: 1
                      }}
                    >
                      {userProfile?.name}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        mb: 2
                      }}
                    >
                      {userProfile?.email}
                    </Typography>
                    <Chip
                      label="Member"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Main Content */}
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
                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(255, 154, 158, 0.3)'
                    }}>
                      <CardContent sx={{ width: '100%', py: 2 }}>
                        <BookIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                          {journalStats.total}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                          Public Journals
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)'
                    }}>
                      <CardContent sx={{ width: '100%', py: 2 }}>
                        <StarIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                          {journalStats.published}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                          Published
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                    }}>
                      <CardContent sx={{ width: '100%', py: 2 }}>
                        <PublicIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                          {journalStats.public}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                          Public
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(252, 182, 159, 0.3)'
                    }}>
                      <CardContent sx={{ width: '100%', py: 2 }}>
                        <PeopleIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                          {friends.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                          Friends
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Teams Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(132, 250, 176, 0.3)'
                    }}>
                      <CardContent sx={{ width: '100%', py: 2 }}>
                        <TeamsIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                          {teamsStats.teamsCount}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                          Teams
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {teamsStats.teamJournalsStats.slice(0, 3).map((team, index) => (
                    <Grid item xs={6} sm={3} key={team.teamId}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        background: `linear-gradient(135deg, ${
                          index === 0 ? '#ff9a9e 0%, #fecfef 100%' :
                          index === 1 ? '#a8edea 0%, #fed6e3 100%' :
                          '#667eea 0%, #764ba2 100%'
                        })`,
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 3,
                        boxShadow: `0 8px 32px ${
                          index === 0 ? 'rgba(255, 154, 158, 0.3)' :
                          index === 1 ? 'rgba(168, 237, 234, 0.3)' :
                          'rgba(102, 126, 234, 0.3)'
                        }`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 40px ${
                            index === 0 ? 'rgba(255, 154, 158, 0.4)' :
                            index === 1 ? 'rgba(168, 237, 234, 0.4)' :
                            'rgba(102, 126, 234, 0.4)'
                          }`
                        }
                      }}>
                        <CardContent sx={{ width: '100%', py: 2 }}>
                          <JournalIcon sx={{ fontSize: 36, color: 'white', mb: 1 }} />
                          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                            {team.journalCount}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255,255,255,0.9)', 
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {team.teamName}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Profile Information */}
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Profile Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1" fontWeight={500}>{userProfile?.name}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <EmailIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1" fontWeight={500}>{userProfile?.email}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <CalendarIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Member Since</Typography>
                        <Typography variant="body1" fontWeight={500}>{formatDate(userProfile?.createdAt)}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <PeopleIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Typography variant="body1" fontWeight={500}>Active Member</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Friends Section */}
                {friends.length > 0 && (
                  <>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Friends ({friends.length})
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {friends.slice(0, 6).map((friend) => (
                        <Grid item xs={6} sm={4} md={2} key={friend.id}>
                          <Card 
                            sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                              }
                            }}
                            onClick={() => navigate(`/users/${friend.id}`)}
                          >
                            <Avatar
                              src={getProfilePhotoUrl(friend.profilePicture)}
                              sx={{
                                width: 60,
                                height: 60,
                                mx: 'auto',
                                mb: 1,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontSize: '1.5rem'
                              }}
                            >
                              {getInitials(friend.name)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {friend.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {friend.email}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {friends.length > 6 && (
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          And {friends.length - 6} more friends...
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 3 }} />
                  </>
                )}

                {/* Verifications Section */}
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  <VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#4caf50' }} />
                  Verifications ({verifications.length})
                </Typography>

                {verificationsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : verifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <VerifiedIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No public verifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This user hasn't added any public verifications yet.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {verifications.map((verification) => (
                      <Grid item xs={12} sm={6} md={4} key={verification.id}>
                        <Card
                          sx={{
                            height: '100%',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Chip
                                label={verification.type}
                                size="small"
                                sx={{
                                  backgroundColor: getVerificationTypeColor(verification.type),
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                              <Chip
                                label={verification.visibility}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: getVisibilityColor(verification.visibility),
                                  color: getVisibilityColor(verification.visibility)
                                }}
                              />
                            </Box>

                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {verification.title}
                            </Typography>

                            {verification.issuer && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Issued by: {verification.issuer}
                              </Typography>
                            )}

                            {verification.issueDate && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Issue Date: {new Date(verification.issueDate).toLocaleDateString()}
                              </Typography>
                            )}

                            {verification.expiryDate && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Expires: {new Date(verification.expiryDate).toLocaleDateString()}
                              </Typography>
                            )}

                            {verification.credentialId && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                ID: {verification.credentialId}
                              </Typography>
                            )}

                            {verification.description && (
                              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                                {verification.description}
                              </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              {verification.credentialUrl && (
                                <Button
                                  size="small"
                                  startIcon={<LinkIcon />}
                                  onClick={() => window.open(verification.credentialUrl, '_blank')}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  View Link
                                </Button>
                              )}

                              {verification.fileName && (
                                <Button
                                  size="small"
                                  startIcon={verification.fileType?.includes('pdf') ? <PdfIcon /> : <FilePresentIcon />}
                                  onClick={() => handleViewVerificationFile(verification)}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  View {verification.fileType?.includes('pdf') ? 'PDF' : 'File'}
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<BookIcon />}
                    onClick={() => navigate(`/user-journals/${userId}`)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    View Public Journals
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Profile Image Dialog */}
      <Dialog
        open={profileImageDialog.open}
        onClose={handleCloseProfileImage}
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
            onClick={handleCloseProfileImage}
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

export default UserProfile;
