import React, { useEffect, useState, useContext } from 'react';
import {
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
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
  Zoom,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AlertTitle,
  Menu,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Book as BookIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  PersonRemove as PersonRemoveIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  FilePresent as FilePresentIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
  Menu as MenuIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { getCurrentUser, updateProfile, uploadProfilePhoto, getMyFriends, getFriendCount, getJournals, removeFriend, getUserFriends, getMyVerifications, createVerification, updateVerification, deleteVerification, getVerificationFile } from '../services/api';
import { useNavigate } from 'react-router-dom';
import * as teamApi from '../services/teamApi';
import { AuthContext } from '../context/AuthContext';

function Profile() {
  const { updateUser: updateAuthUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    community: '',
    password: '',
    oldPassword: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [friends, setFriends] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [journalCount, setJournalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [privateCount, setPrivateCount] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [removingFriend, setRemovingFriend] = useState(null);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState({ open: false, friend: null });
  const [viewFriendsDialog, setViewFriendsDialog] = useState({ open: false, friend: null, friends: [], loading: false });
  const [friendMenuAnchor, setFriendMenuAnchor] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [teamRemovalDialog, setTeamRemovalDialog] = useState({ open: false, friend: null, sharedTeams: [] });

  // Verification states
  const [verifications, setVerifications] = useState([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState({ open: false, verification: null, isEdit: false });
  const [verificationViewDialog, setVerificationViewDialog] = useState({ open: false, verification: null });
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationFilePreview, setVerificationFilePreview] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    type: 'CERTIFICATE',
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    visibility: 'PUBLIC'
  });

  // Fetch user only on mount
  useEffect(() => {
    fetchUser();
    fetchFriends();
    fetchJournalCount();
    fetchAdditionalStats();
    fetchVerifications();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res.data);
      if (updateAuthUser) {
        updateAuthUser(res.data);
      }
      setForm({
        name: res.data.name,
        email: res.data.email,
        community: res.data.community || '',
        password: '',
        oldPassword: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const [friendsRes, countRes] = await Promise.all([
        getMyFriends(),
        getFriendCount()
      ]);
      setFriends(friendsRes.data);
      setFriendCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load friends',
        severity: 'error'
      });
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchJournalCount = async () => {
    try {
      const userRes = await getCurrentUser();
      const journalsRes = await getJournals(userRes.data.id);
      setJournalCount(journalsRes.data.length);
    } catch (error) {
      console.error('Error fetching journal count:', error);
      // Don't show error message for journal count as it's not critical
      setJournalCount(0);
    }
  };

  const fetchAdditionalStats = async () => {
    try {
      const userRes = await getCurrentUser();
      const journalsRes = await getJournals(userRes.data.id);
      const journals = journalsRes.data;

      // Count published and private journals
      const published = journals.filter(journal => journal.isPublished).length;
      const privateJournals = journals.filter(journal => journal.isPrivate).length;

      setPublishedCount(published);
      setPrivateCount(privateJournals);

      // Set member since date from user creation date
      if (userRes.data.createdAt) {
        const memberDate = new Date(userRes.data.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        setMemberSince(memberDate);
      } else {
        setMemberSince('Unknown');
      }
    } catch (error) {
      console.error('Error fetching additional stats:', error);
      // Set default values on error
      setPublishedCount(0);
      setPrivateCount(0);
      setMemberSince('Unknown');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleViewUserJournals = (userId) => {
    navigate(`/user-journals/${userId}`);
  };

  const handleRemoveFriendClick = (friend) => {
    setConfirmRemoveDialog({ open: true, friend });
  };

  const handleViewFriendsClick = async (friend) => {
    setViewFriendsDialog({ open: true, friend, friends: [], loading: true });

    try {
      const response = await getUserFriends(friend.id);
      setViewFriendsDialog(prev => ({
        ...prev,
        friends: response.data || [],
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching friend\'s friends:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load friends list',
        severity: 'error'
      });
      setViewFriendsDialog(prev => ({
        ...prev,
        friends: [],
        loading: false
      }));
    }
  };

  const handleCloseViewFriendsDialog = () => {
    setViewFriendsDialog({ open: false, friend: null, friends: [], loading: false });
  };

  const handleFriendMenuOpen = (event, friend) => {
    setFriendMenuAnchor(event.currentTarget);
    setSelectedFriend(friend);
  };

  const handleFriendMenuClose = () => {
    setFriendMenuAnchor(null);
    setSelectedFriend(null);
  };

  const handleMenuViewProfile = () => {
    if (selectedFriend) {
      navigate(`/users/${selectedFriend.id}`);
    }
    handleFriendMenuClose();
  };

  const handleMenuViewJournals = () => {
    if (selectedFriend) {
      handleViewUserJournals(selectedFriend.id);
    }
    handleFriendMenuClose();
  };

  const handleMenuViewFriends = () => {
    if (selectedFriend) {
      handleViewFriendsClick(selectedFriend);
    }
    handleFriendMenuClose();
  };

  const handleMenuRemoveFriend = () => {
    if (selectedFriend) {
      handleRemoveFriendClick(selectedFriend);
    }
    handleFriendMenuClose();
  };

  // Check for shared teams and prompt for removal
  const checkSharedTeamsAndPrompt = async (removedFriend) => {
    try {
      const myTeamsResponse = await teamApi.getMyTeams();
      const myTeams = myTeamsResponse.data || [];

      const removableTeams = [];

      // Check each team to see if the removed friend is a member AND current user can remove them
      for (const team of myTeams) {
        try {
          const membersResponse = await teamApi.listMembers(team.id);
          const members = membersResponse.data || [];

          const friendMember = members.find(member => member.userId === removedFriend.id);
          const currentUserMember = members.find(member => member.userId === user?.id);

          if (friendMember && currentUserMember) {
            // Only allow removal if:
            // 1. Current user is MASTER or OWNER of the team
            // 2. Friend is not the owner of the team
            const canRemove = (currentUserMember.role === 'MASTER' || team.ownerId === user?.id) &&
              team.ownerId !== removedFriend.id;

            if (canRemove) {
              removableTeams.push({
                ...team,
                friendMember,
                currentUserRole: currentUserMember.role
              });
            }
          }
        } catch (err) {
          // Skip teams we can't access
          console.warn(`Could not check members for team ${team.id}:`, err);
        }
      }

      if (removableTeams.length > 0) {
        setTeamRemovalDialog({
          open: true,
          friend: removedFriend,
          sharedTeams: removableTeams
        });
      }
    } catch (err) {
      console.error('Error checking shared teams:', err);
    }
  };

  const handleConfirmRemoveFriend = async () => {
    const friendToRemove = confirmRemoveDialog.friend;
    if (!friendToRemove) return;

    setRemovingFriend(friendToRemove.id);
    try {
      const response = await removeFriend(friendToRemove.id);
      if (response.data.success) {
        // Remove friend from local state
        setFriends(prevFriends => prevFriends.filter(f => f.id !== friendToRemove.id));
        setFriendCount(prevCount => prevCount - 1);

        // Check for shared teams and prompt for removal
        checkSharedTeamsAndPrompt(friendToRemove);

        setSnackbar({
          open: true,
          message: `${friendToRemove.name} has been removed from your friends list.`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to remove friend',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setSnackbar({
        open: true,
        message: 'Error removing friend. Please try again.',
        severity: 'error'
      });
    } finally {
      setRemovingFriend(null);
      setConfirmRemoveDialog({ open: false, friend: null });
    }
  };

  const handleCancelRemoveFriend = () => {
    setConfirmRemoveDialog({ open: false, friend: null });
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    friend.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const fetchVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const response = await getMyVerifications();
      setVerifications(response.data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load verifications',
        severity: 'error'
      });
    } finally {
      setVerificationsLoading(false);
    }
  };

  const handleVerificationFormChange = (e) => {
    setVerificationForm({ ...verificationForm, [e.target.name]: e.target.value });
  };

  const handleVerificationFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'File size must be less than 10MB',
        severity: 'error'
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed',
        severity: 'error'
      });
      return;
    }

    setVerificationFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setVerificationFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setVerificationFilePreview(null);
    }
  };

  const handleAddVerification = () => {
    setVerificationForm({
      type: 'CERTIFICATE',
      title: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      description: '',
      visibility: 'PUBLIC'
    });
    setVerificationFile(null);
    setVerificationFilePreview(null);
    setVerificationDialog({ open: true, verification: null, isEdit: false });
  };

  const handleEditVerification = (verification) => {
    setVerificationForm({
      type: verification.type,
      title: verification.title,
      issuer: verification.issuer || '',
      issueDate: verification.issueDate || '',
      expiryDate: verification.expiryDate || '',
      credentialId: verification.credentialId || '',
      credentialUrl: verification.credentialUrl || '',
      description: verification.description || '',
      visibility: verification.visibility
    });
    setVerificationFile(null);
    setVerificationFilePreview(null);
    setVerificationDialog({ open: true, verification, isEdit: true });
  };

  const handleSaveVerification = async () => {
    if (!verificationForm.title.trim()) {
      setSnackbar({
        open: true,
        message: 'Title is required',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', verificationForm.type);
      formData.append('title', verificationForm.title);
      if (verificationForm.issuer) formData.append('issuer', verificationForm.issuer);
      if (verificationForm.issueDate) formData.append('issueDate', verificationForm.issueDate);
      if (verificationForm.expiryDate) formData.append('expiryDate', verificationForm.expiryDate);
      if (verificationForm.credentialId) formData.append('credentialId', verificationForm.credentialId);
      if (verificationForm.credentialUrl) formData.append('credentialUrl', verificationForm.credentialUrl);
      if (verificationForm.description) formData.append('description', verificationForm.description);
      formData.append('visibility', verificationForm.visibility);
      if (verificationFile) formData.append('file', verificationFile);

      if (verificationDialog.isEdit) {
        await updateVerification(verificationDialog.verification.id, formData);
        setSnackbar({
          open: true,
          message: 'Verification updated successfully!',
          severity: 'success'
        });
      } else {
        await createVerification(formData);
        setSnackbar({
          open: true,
          message: 'Verification added successfully!',
          severity: 'success'
        });
      }

      setVerificationDialog({ open: false, verification: null, isEdit: false });
      fetchVerifications();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save verification: ' + (error?.response?.data || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVerification = async (verificationId) => {
    if (!window.confirm('Are you sure you want to delete this verification?')) return;

    try {
      await deleteVerification(verificationId);
      setSnackbar({
        open: true,
        message: 'Verification deleted successfully!',
        severity: 'success'
      });
      fetchVerifications();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete verification: ' + (error?.response?.data || error.message),
        severity: 'error'
      });
    }
  };

  const handleViewVerificationFile = async (verification) => {
    if (verification.fileName) {
      try {
        // ✅ Use cookies for authentication
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/verifications/${verification.id}/file`, {
          credentials: 'include'
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to load file',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error loading file: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleViewVerificationDetails = (verification) => {
    setVerificationViewDialog({ open: true, verification });
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

  const handleEdit = () => {
    setEdit(true);
    setForm(f => ({ ...f, password: '', oldPassword: '' }));
  };

  const handleCancel = () => {
    setEdit(false);
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        community: user.community || '',
        password: '',
        oldPassword: ''
      });
    }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    setLoading(true);

    const updateData = {
      name: form.name,
      email: form.email,
      community: form.community,
    };

    if (form.password && form.password.trim() !== "") {
      updateData.password = form.password;
      updateData.oldPassword = form.oldPassword;
    }

    try {
      await updateProfile(updateData);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
      await fetchUser();
      setEdit(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Update failed: ' + (err?.response?.data?.message || err?.response?.data || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async e => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setSnackbar({
        open: true,
        message: 'File size must be less than 5MB',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await uploadProfilePhoto(file);
      setSnackbar({
        open: true,
        message: 'Profile photo updated successfully!',
        severity: 'success'
      });
      await fetchUser();
      setPhotoDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Photo upload failed: ' + (error?.response?.data?.message || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
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

  const getJoinDate = () => {
    if (!user?.createdAt) return 'Unknown';
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !user) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
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
        {/* Header Section */}
        <Fade in timeout={800}>
          <Paper elevation={8} sx={{
            p: 4,
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={getProfilePhotoUrl(user?.profilePicture)}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: '3rem',
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  >
                    {getInitials(user?.name)}
                  </Avatar>
                  <Tooltip title="Change Photo">
                    <IconButton
                      onClick={() => setPhotoDialog(true)}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' }
                      }}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {user?.name}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  {user?.email}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    icon={<PersonIcon />}
                    label={user?.role || 'User'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    icon={<CalendarIcon />}
                    label={`Joined ${getJoinDate()}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Stack>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={edit ? <SaveIcon /> : <EditIcon />}
                  onClick={edit ? handleUpdate : handleEdit}
                  disabled={loading}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {edit ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Stats Cards */}
        <Zoom in timeout={1000}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <BookIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {journalCount}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Journal Entries
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <StarIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Account Status
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {friendCount}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Friends
                </Typography>
              </Card>
            </Grid>

            {/* Published Journals Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <PublicIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {publishedCount}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Published Journals
                </Typography>
              </Card>
            </Grid>

            {/* Private Journals Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <LockIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {privateCount}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Private Journals
                </Typography>
              </Card>
            </Grid>

            {/* Member Since Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{
                textAlign: 'center',
                p: 4,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <CalendarIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {memberSince}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Member Since
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Zoom>

        {/* Profile Form */}
        <Fade in timeout={1200}>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              Profile Information
            </Typography>

            <Box component="form" onSubmit={handleUpdate}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Full Name"
                    name="name"
                    fullWidth
                    value={form.name}
                    onChange={handleChange}
                    disabled={!edit}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: edit ? '#667eea' : 'transparent',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    fullWidth
                    value={form.email}
                    onChange={handleChange}
                    disabled={!edit}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: edit ? '#667eea' : 'transparent',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Community (Optional)"
                    name="community"
                    fullWidth
                    value={form.community}
                    onChange={handleChange}
                    disabled={!edit}
                    placeholder="e.g., University, Company, Organization, Area name..."
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: edit ? '#667eea' : 'transparent',
                        },
                      },
                    }}
                  />
                </Grid>

                {edit && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }}>
                        <Chip label="Change Password (Optional)" color="primary" />
                      </Divider>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Current Password"
                        name="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        fullWidth
                        value={form.oldPassword}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              edge="end"
                            >
                              {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label="New Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={form.password}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {edit && (
                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{
                      bgcolor: '#667eea',
                      '&:hover': { bgcolor: '#5a6fd8' }
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        </Fade>

        {/* My Verification Section */}
        <Fade in timeout={1000}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mt: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f3e5f5 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedIcon sx={{ mr: 2, color: '#4caf50', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  My Verifications ({verifications.length})
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddVerification}
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #45a049 0%, #7cb342 100%)',
                  }
                }}
              >
                Add Verification
              </Button>
            </Box>

            {verificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : verifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <VerifiedIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No verifications yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add your certificates, authorizations, and rewards to showcase your credentials!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {verifications.map((verification) => (
                  <Grid item xs={12} sm={6} md={4} key={verification.id}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                          '& .card-actions': {
                            opacity: 1
                          }
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: `linear-gradient(90deg, ${getVerificationTypeColor(verification.type)}, ${getVerificationTypeColor(verification.type)}dd)`,
                          borderRadius: '12px 12px 0 0'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, pb: 2 }}>
                        {/* Header with type and actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                          <Chip
                            label={verification.type}
                            size="small"
                            sx={{
                              backgroundColor: getVerificationTypeColor(verification.type),
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 28,
                              '& .MuiChip-label': {
                                px: 1.5
                              }
                            }}
                          />
                          <Box className="card-actions" sx={{ opacity: 0.7, transition: 'opacity 0.2s' }}>
                            <Tooltip title="Edit verification">
                              <IconButton
                                size="small"
                                onClick={() => handleEditVerification(verification)}
                                sx={{
                                  mr: 0.5,
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete verification">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteVerification(verification.id)}
                                sx={{
                                  backgroundColor: 'rgba(244,67,54,0.1)',
                                  color: '#f44336',
                                  '&:hover': { backgroundColor: 'rgba(244,67,54,0.2)' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Title */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 2,
                            color: '#1a202c',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {verification.title}
                        </Typography>

                        {/* Metadata section */}
                        <Box sx={{ mb: 2.5 }}>
                          {verification.issuer && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {verification.issuer}
                              </Typography>
                            </Box>
                          )}

                          {verification.issueDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                Issued: {new Date(verification.issueDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Typography>
                            </Box>
                          )}

                          {verification.expiryDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#ff9800', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 500 }}>
                                Expires: {new Date(verification.expiryDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Typography>
                            </Box>
                          )}

                          {verification.credentialId && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <VerifiedIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontFamily: 'monospace',
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                {verification.credentialId}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Description */}
                        {verification.description && (
                          <Box sx={{ mb: 2.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                fontStyle: 'italic',
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              "{verification.description}"
                            </Typography>
                          </Box>
                        )}

                        {/* Footer actions */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          pt: 2,
                          borderTop: '1px solid rgba(0,0,0,0.06)'
                        }}>
                          <Chip
                            label={verification.visibility}
                            size="small"
                            variant="outlined"
                            icon={verification.visibility === 'PUBLIC' ? <VisibilityIcon /> :
                              verification.visibility === 'FRIENDS' ? <PersonIcon /> :
                                <VisibilityOffIcon />}
                            sx={{
                              borderColor: getVisibilityColor(verification.visibility),
                              color: getVisibilityColor(verification.visibility),
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                fontSize: 14
                              }
                            }}
                          />

                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View full details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewVerificationDetails(verification)}
                                sx={{
                                  backgroundColor: 'rgba(103,58,183,0.1)',
                                  color: '#673ab7',
                                  '&:hover': { backgroundColor: 'rgba(103,58,183,0.2)' }
                                }}
                              >
                                <DescriptionIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {verification.credentialUrl && (
                              <Tooltip title="View credential online">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(verification.credentialUrl, '_blank')}
                                  sx={{
                                    backgroundColor: 'rgba(33,150,243,0.1)',
                                    color: '#2196f3',
                                    '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                                  }}
                                >
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {verification.fileName && (
                              <Tooltip title={`View ${verification.fileType?.includes('pdf') ? 'PDF' : 'file'}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewVerificationFile(verification)}
                                  sx={{
                                    backgroundColor: verification.fileType?.includes('pdf') ?
                                      'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
                                    color: verification.fileType?.includes('pdf') ? '#f44336' : '#4caf50',
                                    '&:hover': {
                                      backgroundColor: verification.fileType?.includes('pdf') ?
                                        'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)'
                                    }
                                  }}
                                >
                                  {verification.fileType?.includes('pdf') ? <PdfIcon fontSize="small" /> : <FilePresentIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Fade>

        {/* Friends Section */}
        <Fade in timeout={800}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mt: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PeopleIcon sx={{ mr: 2, color: '#667eea', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                Friends ({friendCount})
              </Typography>
            </Box>

            {/* Friend Search Input */}
            {friends.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search friends by name or email..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                      }
                    }
                  }}
                />
              </Box>
            )}

            {friendsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : friends.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  You haven't added any friends yet. Search for users to add them as friends!
                </Typography>
              </Box>
            ) : filteredFriends.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No friends found matching "{friendSearch}". Try a different search term.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredFriends.map((friend) => (
                  <Grid item xs={12} sm={6} md={4} key={friend.id}>
                    <Card
                      sx={{
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <IconButton
                        onClick={(event) => handleFriendMenuOpen(event, friend)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: '#667eea',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                          }
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Avatar
                          src={getProfilePhotoUrl(friend.profilePicture)}
                          sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}
                        >
                          {getInitials(friend.name)}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {friend.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {friend.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PersonIcon />}
                            onClick={() => navigate(`/users/${friend.id}`)}
                            sx={{
                              backgroundColor: '#4caf50',
                              color: 'white',
                              width: '100%',
                              '&:hover': {
                                backgroundColor: '#388e3c'
                              }
                            }}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewUserJournals(friend.id)}
                            sx={{
                              borderColor: '#667eea',
                              color: '#667eea',
                              width: '100%',
                              '&:hover': {
                                borderColor: '#5a6fd8',
                                backgroundColor: 'rgba(102, 126, 234, 0.04)'
                              }
                            }}
                          >
                            View Journals
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Fade>

        {/* Photo Upload Dialog */}
        <Dialog open={photoDialog} onClose={() => setPhotoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar
                src={user?.profilePicture ? `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${user.profilePicture}` : undefined}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              >
                {getInitials(user?.name)}
              </Avatar>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a new profile photo. Maximum file size: 5MB
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                Select Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPhotoDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Remove Friend Confirmation Dialog */}
        <Dialog
          open={confirmRemoveDialog.open}
          onClose={handleCancelRemoveFriend}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonRemoveIcon color="error" />
            Remove Friend
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to remove <strong>{confirmRemoveDialog.friend?.name}</strong> from your friends list?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action will:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Remove them from your friends list
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Remove you from their friends list
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                You can send them a new friend request later if needed
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCancelRemoveFriend}
              disabled={removingFriend !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemoveFriend}
              color="error"
              variant="contained"
              disabled={removingFriend !== null}
              startIcon={removingFriend !== null ? <CircularProgress size={16} /> : <PersonRemoveIcon />}
            >
              {removingFriend !== null ? 'Removing...' : 'Remove Friend'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Friends Dialog */}
        <Dialog
          open={viewFriendsDialog.open}
          onClose={handleCloseViewFriendsDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            {viewFriendsDialog.friend?.name}'s Friends
          </DialogTitle>
          <DialogContent>
            {viewFriendsDialog.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (viewFriendsDialog.friends?.length || 0) === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {viewFriendsDialog.friend?.name} has no friends yet
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {(viewFriendsDialog.friends || []).map((friendOfFriend) => (
                  <Grid item xs={12} sm={6} md={4} key={friendOfFriend.id}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Avatar
                          src={getProfilePhotoUrl(friendOfFriend.profilePicture)}
                          sx={{ width: 50, height: 50, mx: 'auto', mb: 1 }}
                        >
                          {getInitials(friendOfFriend.name)}
                        </Avatar>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {friendOfFriend.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {friendOfFriend.email}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PersonIcon />}
                            onClick={() => {
                              handleCloseViewFriendsDialog();
                              navigate(`/users/${friendOfFriend.id}`);
                            }}
                            sx={{
                              backgroundColor: '#4caf50',
                              color: 'white',
                              fontSize: '0.75rem',
                              '&:hover': {
                                backgroundColor: '#388e3c'
                              }
                            }}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              handleCloseViewFriendsDialog();
                              handleViewUserJournals(friendOfFriend.id);
                            }}
                            sx={{
                              borderColor: '#667eea',
                              color: '#667eea',
                              fontSize: '0.75rem',
                              '&:hover': {
                                borderColor: '#5a6fd8',
                                backgroundColor: 'rgba(102, 126, 234, 0.04)'
                              }
                            }}
                          >
                            View Journals
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewFriendsDialog}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog
          open={verificationDialog.open}
          onClose={() => setVerificationDialog({ open: false, verification: null, isEdit: false })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 4,
            py: 2.5
          }}>
            <VerifiedIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
              {verificationDialog.isEdit ? 'Edit Verification' : 'Add Verification'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Type</InputLabel>
                    <Select
                      name="type"
                      value={verificationForm.type}
                      onChange={handleVerificationFormChange}
                      label="Type"
                      sx={{ bgcolor: 'white', borderRadius: 2 }}
                    >
                      <MenuItem value="CERTIFICATE">Certificate</MenuItem>
                      <MenuItem value="AUTHORIZATION">Authorization</MenuItem>
                      <MenuItem value="REWARD">Reward</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      name="visibility"
                      value={verificationForm.visibility}
                      onChange={handleVerificationFormChange}
                      label="Visibility"
                      sx={{ bgcolor: 'white', borderRadius: 2 }}
                    >
                      <MenuItem value="PUBLIC">Public</MenuItem>
                      <MenuItem value="FRIENDS">Friends Only</MenuItem>
                      <MenuItem value="PRIVATE">Private</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={verificationForm.title}
                    onChange={handleVerificationFormChange}
                    required
                    placeholder="e.g., AWS Certified Developer"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Issuer"
                    name="issuer"
                    value={verificationForm.issuer}
                    onChange={handleVerificationFormChange}
                    placeholder="e.g., Amazon Web Services"
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Credential ID"
                    name="credentialId"
                    value={verificationForm.credentialId}
                    onChange={handleVerificationFormChange}
                    placeholder="e.g., AWS-12345"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Issue Date"
                    name="issueDate"
                    type="date"
                    value={verificationForm.issueDate}
                    onChange={handleVerificationFormChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    name="expiryDate"
                    type="date"
                    value={verificationForm.expiryDate}
                    onChange={handleVerificationFormChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Credential URL"
                    name="credentialUrl"
                    value={verificationForm.credentialUrl}
                    onChange={handleVerificationFormChange}
                    placeholder="https://..."
                    InputProps={{
                      startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={verificationForm.description}
                    onChange={handleVerificationFormChange}
                    multiline
                    rows={3}
                    placeholder="Additional details about this verification..."
                    InputProps={{
                      startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      bgcolor: '#f8faff'
                    }
                  }}>
                    <Typography variant="h6" sx={{ mb: 1, color: '#334155', fontWeight: 600 }}>
                      Upload Proof (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Upload an image or PDF as proof. Max size: 10MB
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<FilePresentIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: '#f1f5f9',
                          borderColor: '#94a3b8'
                        }
                      }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept="image/*,application/pdf"
                        onChange={handleVerificationFileChange}
                      />
                    </Button>

                    {verificationFile && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, display: 'inline-block', minWidth: '50%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          Selected: {verificationFile.name} ({(verificationFile.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>

                        {verificationFilePreview && (
                          <Box sx={{ mt: 2 }}>
                            <img
                              src={verificationFilePreview}
                              alt="Preview"
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 4, py: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setVerificationDialog({ open: false, verification: null, isEdit: false })}
              disabled={loading}
              sx={{ color: '#64748b', fontWeight: 600, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVerification}
              variant="contained"
              disabled={loading || !verificationForm.title.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 14px 0 rgba(102,126,234,0.39)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(102,126,234,0.23)',
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
            >
              {loading ? 'Saving...' : (verificationDialog.isEdit ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification Details Viewer Dialog */}
        <Dialog
          open={verificationViewDialog.open}
          onClose={() => setVerificationViewDialog({ open: false, verification: null })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{
            background: `linear-gradient(135deg, ${getVerificationTypeColor(verificationViewDialog.verification?.type)} 0%, ${getVerificationTypeColor(verificationViewDialog.verification?.type)}dd 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}>
            <VerifiedIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {verificationViewDialog.verification?.title}
              </Typography>
              <Chip
                label={verificationViewDialog.verification?.type}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            {verificationViewDialog.verification && (
              <Box>
                {/* Issuer and Dates Section */}
                <Box sx={{ p: 3, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <Grid container spacing={3}>
                    {verificationViewDialog.verification.issuer && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              ISSUED BY
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                            {verificationViewDialog.verification.issuer}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {verificationViewDialog.verification.issueDate && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              ISSUE DATE
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                            {new Date(verificationViewDialog.verification.issueDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {verificationViewDialog.verification.expiryDate && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarIcon sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              EXPIRY DATE
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
                            {new Date(verificationViewDialog.verification.expiryDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {verificationViewDialog.verification.credentialId && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <VerifiedIcon sx={{ fontSize: 20, color: 'info.main', mr: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              CREDENTIAL ID
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: 'monospace',
                              backgroundColor: '#f1f5f9',
                              p: 1,
                              borderRadius: 1,
                              wordBreak: 'break-all',
                              fontSize: '0.9rem'
                            }}
                          >
                            {verificationViewDialog.verification.credentialId}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Description Section */}
                {verificationViewDialog.verification.description && (
                  <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
                      Description
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.7,
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        backgroundColor: '#f8fafc',
                        p: 2,
                        borderRadius: 2,
                        borderLeft: '4px solid',
                        borderLeftColor: getVerificationTypeColor(verificationViewDialog.verification.type)
                      }}
                    >
                      "{verificationViewDialog.verification.description}"
                    </Typography>
                  </Box>
                )}

                {/* Actions Section */}
                <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
                    Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {verificationViewDialog.verification.credentialUrl && (
                      <Button
                        variant="contained"
                        startIcon={<LinkIcon />}
                        onClick={() => window.open(verificationViewDialog.verification.credentialUrl, '_blank')}
                        sx={{
                          backgroundColor: '#2196f3',
                          '&:hover': { backgroundColor: '#1976d2' }
                        }}
                      >
                        View Credential Online
                      </Button>
                    )}

                    {verificationViewDialog.verification.fileName && (
                      <Button
                        variant="contained"
                        startIcon={verificationViewDialog.verification.fileType?.includes('pdf') ? <PdfIcon /> : <FilePresentIcon />}
                        onClick={() => handleViewVerificationFile(verificationViewDialog.verification)}
                        sx={{
                          backgroundColor: verificationViewDialog.verification.fileType?.includes('pdf') ? '#f44336' : '#4caf50',
                          '&:hover': {
                            backgroundColor: verificationViewDialog.verification.fileType?.includes('pdf') ? '#d32f2f' : '#388e3c'
                          }
                        }}
                      >
                        View {verificationViewDialog.verification.fileType?.includes('pdf') ? 'PDF' : 'File'}
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setVerificationViewDialog({ open: false, verification: null });
                        handleEditVerification(verificationViewDialog.verification);
                      }}
                      sx={{
                        borderColor: getVerificationTypeColor(verificationViewDialog.verification.type),
                        color: getVerificationTypeColor(verificationViewDialog.verification.type),
                        '&:hover': {
                          backgroundColor: `${getVerificationTypeColor(verificationViewDialog.verification.type)}10`,
                          borderColor: getVerificationTypeColor(verificationViewDialog.verification.type)
                        }
                      }}
                    >
                      Edit Verification
                    </Button>
                  </Box>
                </Box>

                {/* Metadata Section */}
                <Box sx={{ p: 3, backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          VISIBILITY:
                        </Typography>
                        <Chip
                          label={verificationViewDialog.verification.visibility}
                          size="small"
                          variant="outlined"
                          icon={verificationViewDialog.verification.visibility === 'PUBLIC' ? <VisibilityIcon /> :
                            verificationViewDialog.verification.visibility === 'FRIENDS' ? <PersonIcon /> :
                              <VisibilityOffIcon />}
                          sx={{
                            ml: 1,
                            borderColor: getVisibilityColor(verificationViewDialog.verification.visibility),
                            color: getVisibilityColor(verificationViewDialog.verification.visibility)
                          }}
                        />
                      </Box>
                    </Grid>

                    {verificationViewDialog.verification.fileName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          FILE: {verificationViewDialog.verification.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {verificationViewDialog.verification.fileType} • {(verificationViewDialog.verification.fileSize / 1024).toFixed(1)} KB
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(verificationViewDialog.verification.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(verificationViewDialog.verification.updatedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, backgroundColor: 'white', borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setVerificationViewDialog({ open: false, verification: null })}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Friend Actions Menu */}
        <Menu
          anchorEl={friendMenuAnchor}
          open={Boolean(friendMenuAnchor)}
          onClose={handleFriendMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.08)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuViewFriends} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" sx={{ color: '#ff9800' }} />
            </ListItemIcon>
            <ListItemText
              primary="View Friends"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </MenuItem>

          <MenuItem
            onClick={handleMenuRemoveFriend}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)'
              }
            }}
          >
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" sx={{ color: '#f44336' }} />
            </ListItemIcon>
            <ListItemText
              primary="Remove Friend"
              primaryTypographyProps={{ fontWeight: 500, color: '#f44336' }}
            />
          </MenuItem>
        </Menu>

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
            <AlertTitle>
              {snackbar.severity === 'success' ? 'Success!' : 'Error!'}
            </AlertTitle>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Team Removal Dialog */}
        <Dialog
          open={teamRemovalDialog.open}
          onClose={() => setTeamRemovalDialog({ open: false, friend: null, sharedTeams: [] })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
              <PersonRemoveIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Remove from Teams
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {teamRemovalDialog.friend?.name} is also a member of your teams
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
              You removed <strong>{teamRemovalDialog.friend?.name}</strong> from your friends list.
              They are currently a member of the following teams where you have permission to remove them.
            </Typography>

            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {teamRemovalDialog.sharedTeams.map((team) => (
                <Card key={team.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {team.name?.charAt(0)?.toUpperCase() || 'T'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {team.name}
                        </Typography>
                        <Chip
                          label={team.friendMember?.role || 'MEMBER'}
                          size="small"
                          color={team.friendMember?.role === 'MASTER' ? 'error' :
                            team.friendMember?.role === 'ADMIN' ? 'warning' : 'primary'}
                        />
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={async () => {
                        try {
                          await teamApi.removeMember(team.id, teamRemovalDialog.friend.id);
                          setSnackbar({
                            open: true,
                            message: `${teamRemovalDialog.friend.name} removed from ${team.name}`,
                            severity: 'success'
                          });
                          // Remove this team from the dialog
                          setTeamRemovalDialog(prev => ({
                            ...prev,
                            sharedTeams: prev.sharedTeams.filter(t => t.id !== team.id)
                          }));
                        } catch (err) {
                          setSnackbar({
                            open: true,
                            message: err.response?.data?.message || `Failed to remove from ${team.name}`,
                            severity: 'error'
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setTeamRemovalDialog({ open: false, friend: null, sharedTeams: [] })}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Skip
            </Button>
            <Button
              onClick={async () => {
                // Remove from all teams at once
                const promises = teamRemovalDialog.sharedTeams.map(team =>
                  teamApi.removeMember(team.id, teamRemovalDialog.friend.id)
                );

                try {
                  await Promise.all(promises);
                  setSnackbar({
                    open: true,
                    message: `${teamRemovalDialog.friend.name} removed from all teams`,
                    severity: 'success'
                  });
                } catch (err) {
                  setSnackbar({
                    open: true,
                    message: 'Some team removals failed',
                    severity: 'warning'
                  });
                }

                setTeamRemovalDialog({ open: false, friend: null, sharedTeams: [] });
              }}
              variant="contained"
              color="error"
              sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}
            >
              Remove from All Teams
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Profile;