import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, CardActions, CardContent, Chip, Grid, IconButton, Stack, Typography, Menu, MenuItem, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { listTeamJournals, listMembers } from '../services/teamApi';
import JournalEditor from '../components/JournalEditor';
import JournalViewer from '../components/JournalViewer';
import MediaViewer from '../components/MediaViewer';
import ConfirmDialog from '../components/ConfirmDialog';
import JournalEditorAssignment from '../components/JournalEditorAssignment';
import JournalPermissionError from '../components/JournalPermissionError';
import { getCurrentUser, createJournal, updateJournal, deleteJournal, uploadJournalFiles, publishJournal, unpublishJournal, getPublishedStats, deleteJournalFile, getJournal } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PhotoIcon from '@mui/icons-material/Photo';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import AudioIcon from '@mui/icons-material/Audiotrack';
import DocumentIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DownloadIcon from '@mui/icons-material/Download';

export default function TeamJournals() {
  const { teamId } = useParams();
  const { user } = useContext(AuthContext);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [mediaPreview, setMediaPreview] = useState({ open: false, url: '', urls: [], index: 0 });
  const [thumbs, setThumbs] = useState({}); // url -> blob object URL
  const [confirm, setConfirm] = useState({ open: false, type: '', journal: null });
  const [menuState, setMenuState] = useState({ anchorEl: null, journal: null });
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [canManageJournals, setCanManageJournals] = useState(false);
  const [journalStats, setJournalStats] = useState({});
  const [editorAssignmentOpen, setEditorAssignmentOpen] = useState(false);
  const [selectedJournalForAssignment, setSelectedJournalForAssignment] = useState(null);
  const [permissionError, setPermissionError] = useState({ open: false, message: '', journalId: null, journalTitle: '' });
  const [fileDialog, setFileDialog] = useState({ open: false, journalId: null });

  // Menu handlers (component scope)
  const handleMenuOpen = (event, j) => {
    setMenuState({ anchorEl: event.currentTarget, journal: j });
  };

  // Media viewer controls (mirror Dashboard/JournalsTable)
  const handleOpenFileViewer = (files, startIndex = 0) => {
    if (!files || files.length === 0) return;
    setMediaPreview({ open: true, url: files[startIndex], urls: files, index: startIndex });
  };

  const handleCloseFileViewer = () => {
    setMediaPreview({ open: false, url: '', urls: [], index: 0 });
  };

  const handleNextFile = () => {
    if (!mediaPreview.urls.length) return;
    const nextIdx = (mediaPreview.index + 1) % mediaPreview.urls.length;
    setMediaPreview(prev => ({ ...prev, index: nextIdx, url: prev.urls[nextIdx] }));
  };

  const handlePrevFile = () => {
    if (!mediaPreview.urls.length) return;
    const prevIdx = mediaPreview.index === 0 ? mediaPreview.urls.length - 1 : mediaPreview.index - 1;
    setMediaPreview(prev => ({ ...prev, index: prevIdx, url: prev.urls[prevIdx] }));
  };
  const handleMenuClose = () => setMenuState({ anchorEl: null, journal: null });

  // Journal editor assignment handlers
  const handleOpenEditorAssignment = (journal) => {
    setSelectedJournalForAssignment(journal);
    setEditorAssignmentOpen(true);
    handleMenuClose();
  };

  const handleCloseEditorAssignment = () => {
    setEditorAssignmentOpen(false);
    setSelectedJournalForAssignment(null);
  };

  const handleAssignmentChange = () => {
    // Refresh journals list to reflect any changes
    // This could be optimized to only refresh specific journal data
    loadJournals();
  };

  const loadJournals = async () => {
    try {
      const { data } = await listTeamJournals(teamId);
      setJournals(data || []);
    } catch (err) {
      console.error('Error loading journals:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const me = await getCurrentUser();
        setUserId(me.data.id);
        
        // Get user's role in this team
        const { data: members } = await listMembers(teamId);
        const currentMember = members?.find(m => m.userId === me.data.id);
        const role = currentMember?.role || null; // Don't default to 'MEMBER' for non-members
        setCurrentUserRole(role);
        setCanManageJournals(role === 'ADMIN' || role === 'MASTER');
        
        const { data } = await listTeamJournals(teamId);
        // Endpoint already returns journals for this team; DTO has teamId, not nested team entity
        setJournals(data || []);
        
        // Fetch stats for published journals
        const publishedJournals = (data || []).filter(j => j.isPublished);
        console.log('Published journals found:', publishedJournals.length);
        if (publishedJournals.length > 0) {
          const statsPromises = publishedJournals.map(async (journal) => {
            try {
              console.log(`Fetching stats for journal ${journal.id}`);
              const statsRes = await getPublishedStats(journal.id);
              console.log(`Stats response for journal ${journal.id}:`, statsRes);
              console.log(`Stats data for journal ${journal.id}:`, statsRes.data);
              console.log(`Views value:`, statsRes.data?.totalViews);
              return { id: journal.id, stats: statsRes.data };
            } catch (err) {
              console.warn(`Failed to fetch stats for journal ${journal.id}:`, err);
              return { id: journal.id, stats: null };
            }
          });
          
          const statsResults = await Promise.allSettled(statsPromises);
          const statsMap = {};
          statsResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.stats) {
              console.log(`Adding stats for journal ${result.value.id}:`, result.value.stats);
              statsMap[result.value.id] = result.value.stats;
            }
          });
          console.log('Final stats map:', statsMap);
          setJournalStats(statsMap);
        }
      } catch (e) {
        console.error('Failed to load team journals', e);
        const msg = e?.response?.data?.message || e?.message || 'Failed to load team journals';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId]);

  // Prefetch image thumbnails with Authorization so <img> can render them
  useEffect(() => {
    let revoked = false;
    const created = [];
    const controller = new AbortController();

    const prefetch = async (url) => {
      try {
        // only images
        if (getFileType(url) !== 'image') return;
        if (thumbs[url]) return;
        const full = getFullFileUrl(url);
        const isCloudinary = full.startsWith('https://res.cloudinary.com');
        // ✅ Use cookies for backend media; omit for Cloudinary CDN
        const res = await fetch(full, { credentials: isCloudinary ? 'omit' : 'include', signal: controller.signal });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        created.push(obj);
        if (!revoked) setThumbs(prev => ({ ...prev, [url]: obj }));
      } catch (_) { /* ignore */ }
    };

    // prefetch first 6 of each journal
    (async () => {
      const tasks = [];
      for (const j of journals || []) {
        const arr = (j.mediaUrls || []).slice(0, 6);
        for (const u of arr) tasks.push(prefetch(u));
      }
      await Promise.allSettled(tasks);
    })();

    return () => {
      revoked = true;
      controller.abort();
      created.forEach(u => URL.revokeObjectURL(u));
    };
  }, [journals]);

  const handleCreate = async (data) => {
    try {
      await createJournal(userId, { ...data, teamId: Number(teamId) });
      setEditorOpen(false);
      // refresh
      const { data: list } = await listTeamJournals(teamId);
      setJournals(list || []);
    } catch (e) {
      console.error('Failed to create journal', e);
      let msg = 'Failed to create journal';
      if (typeof e?.response?.data === 'string') {
        msg = e.response.data;
      } else if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    }
  };

  // Match Dashboard mood coloring
  const getMoodColor = (mood) => {
    const moodColors = {
      happy: '#4caf50',
      sad: '#2196f3',
      excited: '#ff9800',
      angry: '#f44336',
      calm: '#9c27b0',
      anxious: '#ff5722',
      grateful: '#8bc34a',
      tired: '#607d8b',
      energetic: '#ffeb3b',
      peaceful: '#00bcd4',
    };
    return moodColors[mood?.toLowerCase?.()] || '#667eea';
  };

  // Build absolute URL to backend media like Dashboard/JournalViewer
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/journals/media/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
    if (!url.startsWith('/')) return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}`;
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
  };

  const getFileType = (url) => {
    const ext = (url || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    return 'document';
  };

  const getFileIcon = (url) => {
    const ext = (url || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <PhotoIcon />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return <VideoIcon />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <AudioIcon />;
    return <DocumentIcon />;
  };

  const checkEditPermission = async (journalId) => {
    try {
      console.log('Checking edit permission for journal:', journalId, 'user:', userId);
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journal-editors/can-edit?journalId=${journalId}&userId=${userId}`, {
        credentials: 'include'
      });
      
      console.log('Permission check response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Permission check result:', result);
        return result.canEdit;
      } else {
        const errorText = await response.text();
        console.error('Permission check failed:', response.status, errorText);
      }
      return false;
    } catch (err) {
      console.error('Error checking edit permission:', err);
      return false;
    }
  };

  const openEdit = async (j) => {
    // Check if user can edit this journal
    const canEdit = await checkEditPermission(j.id);
    
    if (!canEdit) {
      // Show enhanced permission error immediately
      setPermissionError({
        open: true,
        message: 'You do not have permission to edit this journal.',
        journalId: j.id,
        journalTitle: j.title
      });
      return;
    }
    
    // User has permission, open the editor
    setEditTarget(j);
    setEditorOpen(true);
  };

  const handleEdit = async (data) => {
    if (!editTarget) return;
    try {
      await updateJournal(editTarget.id, { ...data, teamId: Number(teamId) });
      setEditorOpen(false);
      setEditTarget(null);
      const { data: list } = await listTeamJournals(teamId);
      setJournals(list || []);
    } catch (e) {
      console.error('Failed to update journal', e);
      let msg = 'Failed to update journal';
      if (typeof e?.response?.data === 'string') {
        msg = e.response.data;
      } else if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    }
  };

  const requestDelete = (j) => setConfirm({ open: true, type: 'delete', journal: j });
  const confirmDelete = async () => {
    const j = confirm.journal;
    if (!j) return;
    try {
      await deleteJournal(j.id);
      const { data } = await listTeamJournals(teamId);
      setJournals(data || []);
    } catch (e) {
      console.error('Failed to delete journal', e);
      let msg = 'Failed to delete journal';
      if (typeof e?.response?.data === 'string') {
        msg = e.response.data;
      } else if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setConfirm({ open: false, type: '', journal: null });
    }
  };

  // Client-side validation to mirror backend constraints
  const ALLOWED_EXTS = ['jpg','jpeg','png','gif','pdf','mp3','wav','ogg'];
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES_PER_JOURNAL = 4;

  const handleUploadClick = (id) => {
    fileInputRef.current && (fileInputRef.current.dataset.journalId = String(id));
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (e) => {
    // Copy FileList BEFORE clearing the input; FileList is live and may be emptied
    const selected = Array.from(e.target.files || []);
    const jid = Number(e.target.dataset.journalId);
    e.target.value = '';
    if (selected.length === 0 || !jid) return;

    // Pre-validate like backend to provide user-friendly errors
    const journal = journals.find(x => x.id === jid);
    const existingCount = journal?.mediaUrls?.length || 0;
    const availableSlots = Math.max(0, MAX_FILES_PER_JOURNAL - existingCount);
    if (selected.length > availableSlots) {
      setError(`Upload limit reached: you can add only ${availableSlots} more file(s) to this journal (max ${MAX_FILES_PER_JOURNAL}).`);
      return;
    }

    let totalSize = 0;
    for (const f of selected) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        setError(`File type not allowed: ${f.name}. Allowed: ${ALLOWED_EXTS.join(', ')}`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`File exceeds 3MB: ${f.name}`);
        return;
      }
      totalSize += f.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        setError('Total upload size exceeds 10MB.');
        return;
      }
    }

    try {
      await uploadJournalFiles(jid, selected);
      const { data } = await listTeamJournals(teamId);
      setJournals(data || []);
    } catch (err) {
      console.error('Failed to upload files', err);
      // Backend may return plain string like "Upload failed: ..."
      const serverMsg = typeof err?.response?.data === 'string' ? err.response.data : (err?.response?.data?.message);
      const msg = serverMsg || err?.message || 'Failed to upload files';
      
      // Check if it's a permission error and route to JournalPermissionError component
      if (msg.toLowerCase().includes('upload failed') || msg.toLowerCase().includes('manage media files') || 
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
        const targetJournal = journals.find(j => j.id === jid);
        setPermissionError({
          open: true,
          message: msg,
          journalId: jid,
          journalTitle: targetJournal?.title || 'Unknown Journal'
        });
      } else {
        setError(msg);
      }
    }
  };

  const requestTogglePublish = (j) => setConfirm({ open: true, type: j.isPublished ? 'unpublish' : 'publish', journal: j });
  const confirmTogglePublish = async () => {
    const j = confirm.journal;
    if (!j) return;
    try {
      if (confirm.type === 'unpublish') await unpublishJournal(j.id);
      else await publishJournal(j.id);
      const { data } = await listTeamJournals(teamId);
      setJournals(data || []);
    } catch (e) {
      console.error('Failed to toggle publish', e);
      let msg = 'Failed to toggle publish';
      if (typeof e?.response?.data === 'string') {
        msg = e.response.data;
      } else if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setConfirm({ open: false, type: '', journal: null });
    }
  };

  // Open file dialog directly - permission errors will be handled in upload/delete actions
  const handleFilesButtonClick = (journal) => {
    setFileDialog({ open: true, journalId: journal.id });
  };

  // File management functions
  const handleDeleteFile = async (journalId, url) => {
    try {
      const filename = url.includes('/api/journals/media/') 
        ? url.split('/').pop().split('?')[0] 
        : url;
      await deleteJournalFile(journalId, filename);
      const res = await getJournal(journalId);
      setJournals(journals => journals.map(j => j.id === journalId ? res.data : j));
      setError('');
    } catch (error) {
      console.error('Failed to delete file', error);
      const serverMsg = typeof error?.response?.data === 'string' ? error.response.data : (error?.response?.data?.message);
      const msg = serverMsg || error?.message || 'Failed to delete file';
      
      if (msg.toLowerCase().includes('upload failed') || msg.toLowerCase().includes('manage media files') || 
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
        const targetJournal = journals.find(j => j.id === journalId);
        setPermissionError({
          open: true,
          message: msg,
          journalId: journalId,
          journalTitle: targetJournal?.title || 'Unknown Journal'
        });
      } else {
        setError(msg);
      }
    }
  };

  const handleDownloadFile = async (url) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
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
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const handleAddFileToJournal = async (journalId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      await uploadJournalFiles(journalId, files);
      const res = await getJournal(journalId);
      setJournals(journals => journals.map(j => j.id === journalId ? res.data : j));
      setFileDialog({ open: false, journalId: null });
      setError('');
    } catch (error) {
      console.error('Failed to upload files', error);
      const serverMsg = typeof error?.response?.data === 'string' ? error.response.data : (error?.response?.data?.message);
      const msg = serverMsg || error?.message || 'Failed to upload files';
      
      if (msg.toLowerCase().includes('upload failed') || msg.toLowerCase().includes('manage media files') || 
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
        const targetJournal = journals.find(j => j.id === journalId);
        setPermissionError({
          open: true,
          message: msg,
          journalId: journalId,
          journalTitle: targetJournal?.title || 'Unknown Journal'
        });
      } else {
        setError(msg);
      }
      setFileDialog({ open: false, journalId: null });
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ 
          mb: 4,
          p: 3,
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Team Journals
          </Typography>
          <Chip 
            label={currentUserRole ? `Your Role: ${currentUserRole}` : 'View Only Access'} 
            size="medium" 
            color={currentUserRole === 'MASTER' ? 'error' : currentUserRole === 'ADMIN' ? 'warning' : currentUserRole ? 'primary' : 'default'}
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        </Stack>
        {canManageJournals && (
          <Button 
            variant="contained" 
            onClick={() => setEditorOpen(true)}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25,118,210,0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            New Team Journal
          </Button>
        )}
      </Stack>
      <Grid container spacing={3}>
        {journals.map(j => (
          <Grid item xs={12} md={6} lg={4} key={j.id}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid',
                borderColor: 'grey.200',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }
              }}
            >
              {/* Header similar to Dashboard: colored by mood */}
              <Box sx={{ 
                bgcolor: getMoodColor(j.mood), 
                color: 'white', 
                px: 3, 
                py: 2.5, 
                borderTopLeftRadius: 12, 
                borderTopRightRadius: 12,
                background: `linear-gradient(135deg, ${getMoodColor(j.mood)}, ${getMoodColor(j.mood)}dd)`
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {j.title || 'Untitled'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleMenuOpen(e, j)} 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip 
                    size="small" 
                    label={j.mood || 'Unspecified'} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'medium',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }} 
                  />
                  {j.isPrivate && (
                    <Chip 
                      size="small" 
                      label="Private" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        fontWeight: 'medium',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }} 
                    />
                  )}
                  {j.isPublished && (
                    <Chip 
                      size="small" 
                      label="Published" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        fontWeight: 'medium',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }} 
                    />
                  )}
                  <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.9, fontWeight: 'medium' }}>
                    {j.date ? new Date(j.date).toLocaleString() : ''}
                  </Typography>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-line', 
                    mt: 1,
                    lineHeight: 1.6,
                    color: 'text.secondary',
                    fontSize: '0.9rem'
                  }}
                >
                  {(j.content || '').slice(0, 40)}{(j.content || '').length > 40 ? '...' : ''}
                </Typography>
                {Array.isArray(j.mediaUrls) && j.mediaUrls.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <AttachFileIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {j.mediaUrls.length} file{j.mediaUrls.length > 1 ? 's' : ''}
                      </Typography>
                    </Stack>
                    <Box sx={{ width: '100%' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {j.mediaUrls.slice(0, 6).map((url, idx) => (
                          <div 
                            key={url || idx} 
                            style={{ 
                              position: 'relative', 
                              width: '100%', 
                              height: 80, 
                              cursor: 'pointer',
                              borderRadius: 8,
                              overflow: 'hidden',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              transition: 'transform 0.2s ease'
                            }} 
                            onClick={() => handleOpenFileViewer(j.mediaUrls, idx)}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            {getFileType(url) === 'image' ? (
                              <img
                                src={thumbs[url] || getFullFileUrl(url)}
                                alt={`File ${idx + 1}`}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Box sx={{
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                              }}>
                                {getFileIcon(url)}
                              </Box>
                            )}
                            <div style={{
                              position: 'absolute', 
                              left: 0, 
                              right: 0, 
                              bottom: 0, 
                              padding: '4px 8px',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', 
                              color: '#fff',
                              fontSize: 11, 
                              fontWeight: 'medium'
                            }} title={url.split('/').pop()}>
                              {url.split('/').pop()?.slice(0, 15)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </Box>
                    {j.mediaUrls.length > 6 && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleOpenFileViewer(j.mediaUrls, 0)} 
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          fontWeight: 'medium'
                        }}
                      >
                        View All Files ({j.mediaUrls.length})
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>

              {/* Published Stats Bar */}
              {j.isPublished && (
                <Box sx={{ px: 3, pb: 1 }}>
                  {journalStats[j.id] ? (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 1, 
                        bgcolor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={3}>
                          <Chip
                            icon={<VisibilityIcon />}
                            label={`${journalStats[j.id].totalViews || 0}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              width: '100%',
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              bgcolor: 'rgba(25, 118, 210, 0.08)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                color: '#1976d2',
                                fontSize: '14px'
                              },
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Chip
                            icon={<ThumbUpIcon />}
                            label={`${journalStats[j.id].likes || 0}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              width: '100%',
                              borderColor: '#4caf50',
                              color: '#4caf50',
                              bgcolor: 'rgba(76, 175, 80, 0.08)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                color: '#4caf50',
                                fontSize: '14px'
                              },
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Chip
                            icon={<FavoriteIcon />}
                            label={`${journalStats[j.id].hearts || 0}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              width: '100%',
                              borderColor: '#e91e63',
                              color: '#e91e63',
                              bgcolor: 'rgba(233, 30, 99, 0.08)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                color: '#e91e63',
                                fontSize: '14px'
                              },
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Chip
                            icon={<ThumbDownIcon />}
                            label={`${journalStats[j.id].dislikes || 0}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              width: '100%',
                              borderColor: '#ff5722',
                              color: '#ff5722',
                              bgcolor: 'rgba(255, 87, 34, 0.08)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                color: '#ff5722',
                                fontSize: '14px'
                              },
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ) : (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        textAlign: 'center'
                      }}
                    >
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Loading engagement stats...
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              <CardActions sx={{ justifyContent: 'flex-start', p: 3, pt: 0 }}>
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setViewingEntry(j)} 
                    startIcon={<PublicIcon />}
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 'medium',
                      px: 2,
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    View
                  </Button>
                  {canManageJournals && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => handleFilesButtonClick(j)} 
                      startIcon={<AttachFileIcon />}
                      color="primary"
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 'medium'
                      }}
                    >
                      Files
                    </Button>
                  )}
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Enhanced menu with better styling */}
      <Menu
        anchorEl={menuState.anchorEl}
        open={Boolean(menuState.anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'grey.200',
            minWidth: 150
          }
        }}
      >
        {canManageJournals && (
          <MenuItem 
            onClick={() => { if (menuState.journal) openEdit(menuState.journal); handleMenuClose(); }}
            sx={{ 
              py: 1.5, 
              px: 2,
              '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
            }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18 }} />
            Edit
          </MenuItem>
        )}
        {currentUserRole === 'MASTER' && (
          <MenuItem 
            onClick={() => { if (menuState.journal) handleOpenEditorAssignment(menuState.journal); }}
            sx={{ 
              py: 1.5, 
              px: 2,
              '&:hover': { bgcolor: 'info.light', color: 'info.contrastText' }
            }}
          >
            <PersonAddIcon sx={{ mr: 1, fontSize: 18 }} />
            Assign Editors
          </MenuItem>
        )}
        {canManageJournals && (
          <MenuItem 
            onClick={() => { if (menuState.journal) requestTogglePublish(menuState.journal); handleMenuClose(); }}
            sx={{ 
              py: 1.5, 
              px: 2,
              '&:hover': { bgcolor: 'success.light', color: 'success.contrastText' }
            }}
          >
            {menuState.journal?.isPublished ? <PublicOffIcon sx={{ mr: 1, fontSize: 18 }} /> : <PublicIcon sx={{ mr: 1, fontSize: 18 }} />}
            {menuState.journal?.isPublished ? 'Unpublish' : 'Publish'}
          </MenuItem>
        )}
        {canManageJournals && (
          <MenuItem 
            onClick={() => { if (menuState.journal) requestDelete(menuState.journal); handleMenuClose(); }} 
            sx={{ 
              color: 'error.main',
              py: 1.5, 
              px: 2,
              '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
            }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Enhanced error and empty states */}
      {!loading && error && !error.toLowerCase().includes('manage media files') && !error.toLowerCase().includes('permission') && !error.toLowerCase().includes('forbidden') && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Enhanced Permission Error Display */}
      <JournalPermissionError
        open={permissionError.open}
        message={permissionError.message}
        journalId={permissionError.journalId}
        journalTitle={permissionError.journalTitle}
        onClose={() => setPermissionError({ open: false, message: '', journalId: null, journalTitle: '' })}
      />
      
      {!loading && !error && journals.length === 0 && (
        <Box 
          sx={{ 
            mt: 4, 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'white',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'grey.300',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <DocumentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
            No journals found
          </Typography>
          <Typography color="text.secondary">
            {canManageJournals 
              ? 'Create your first team journal to get started!' 
              : 'Team journals will appear here when created.'}
          </Typography>
        </Box>
      )}

      <JournalEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditTarget(null); }}
        onSave={editTarget ? handleEdit : handleCreate}
        initialData={editTarget ? {
          id: editTarget.id,
          title: editTarget.title,
          content: editTarget.content,
          mood: editTarget.mood,
          tags: editTarget.tags,
          date: editTarget.date,
          isPrivate: editTarget.isPrivate,
          teamId: Number(teamId)
        } : { teamId: Number(teamId), isPrivate: true }}
        fixedTeamId={Number(teamId)}
      />

      {/* hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        name="files"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.mp3,.wav,.ogg"
        onChange={onFilesSelected}
      />

      {/* Viewer */}
      <JournalViewer
        open={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        entry={viewingEntry}
        onOpenFileViewer={handleOpenFileViewer}
      />

      <MediaViewer
        open={mediaPreview.open}
        onClose={handleCloseFileViewer}
        mediaUrl={mediaPreview.url}
        mediaUrls={mediaPreview.urls}
        onNext={handleNextFile}
        onPrev={handlePrevFile}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, type: '', journal: null })}
        onConfirm={confirm.type === 'delete' ? confirmDelete : confirmTogglePublish}
        title={confirm.type === 'delete' ? 'Confirm Delete' : confirm.type === 'publish' ? 'Confirm Publish' : 'Confirm Unpublish'}
        description={confirm.journal ? `Are you sure you want to ${confirm.type} "${confirm.journal.title}"?` : ''}
        confirmText={confirm.type === 'delete' ? 'Delete' : confirm.type === 'publish' ? 'Publish' : 'Unpublish'}
      />

      {/* Journal Editor Assignment Dialog */}
      <JournalEditorAssignment
        open={editorAssignmentOpen}
        onClose={handleCloseEditorAssignment}
        journal={selectedJournalForAssignment}
        teamId={teamId}
        onAssignmentChange={handleAssignmentChange}
      />

      {/* Manage Files Dialog */}
      <Dialog open={fileDialog.open} onClose={() => setFileDialog({ open: false, journalId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Files</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<AttachFileIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Add New Files
              <input
                type="file"
                multiple
                hidden
                accept=".jpg,.jpeg,.png,.gif,.pdf,.mp3,.wav,.ogg"
                onChange={e => handleAddFileToJournal(fileDialog.journalId, e)}
              />
            </Button>
            
            {fileDialog.journalId && (() => {
              const entry = journals.find(j => j.id === fileDialog.journalId);
              return entry?.mediaUrls && entry.mediaUrls.length > 0 ? (
                <List>
                  {entry.mediaUrls.map((url, idx) => (
                    <ListItem key={url}>
                      <ListItemIcon>
                        {getFileIcon(url)}
                      </ListItemIcon>
                      <ListItemText
                        primary={url.split('/').pop()}
                        secondary="Journal attachment"
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenFileViewer(entry.mediaUrls, idx)}
                          >
                            <ZoomInIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadFile(url)}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              handleDeleteFile(entry.id, url);
                              setFileDialog({ open: false, journalId: null });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No files attached to this journal
                </Typography>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog({ open: false, journalId: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
