import React, { useContext, useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fab,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Box,
  Container,
  Fade,
  Zoom,
  Tooltip,
  Divider,
  Avatar,
  Badge,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  CardMedia,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Modal,
  Backdrop,
  Pagination,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as MoodIcon,
  LocalOffer as TagIcon,
  CalendarToday as DateIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  FileDownload as DownloadIcon,
  Photo as PhotoIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Block as BlockIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import JournalEditor from '../components/JournalEditor';
import JournalViewer from '../components/JournalViewer';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import UnpublishBeforeEditDialog from '../components/UnpublishBeforeEditDialog';
import FolderCreateDialog from '../components/FolderCreateDialog';
import FolderManagement from '../components/FolderManagement';
import FolderJournalViewer from '../components/FolderJournalViewer';
import { 
  getCurrentUser, 
  getJournals, 
  createJournal, 
  updateJournal, 
  deleteJournal, 
  searchJournals, 
  getJournal, 
  uploadJournalFiles, 
  deleteJournalFile,
  publishJournal,
  unpublishJournal,
  getBatchPublishedStats,
  createFolder,
  getFolders,
  moveJournalToFolder,
  getJournalsInFolder
} from '../services/api';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [userId, setUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [menuAnchorEls, setMenuAnchorEls] = useState({});
  const [viewingEntry, setViewingEntry] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterMood, setFilterMood] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fileDialog, setFileDialog] = useState({ open: false, journalId: null });

  const [mediaPlayer, setMediaPlayer] = useState({ playing: false, volume: 0.7 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', journalId: null, journalTitle: '' });
  const [fileViewer, setFileViewer] = useState({ open: false, files: [], currentIndex: 0 });
  const [journalStats, setJournalStats] = useState({});
  const [unpublishDialog, setUnpublishDialog] = useState({ open: false, journal: null, loading: false });
  
  // Folder-related state
  const [folderCreateDialog, setFolderCreateDialog] = useState({ open: false, loading: false });
  const [folderManagementDialog, setFolderManagementDialog] = useState({ open: false });
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [addToFolderDialog, setAddToFolderDialog] = useState({ open: false, journalId: null, journalTitle: '', loading: false });
  const [folderJournalViewer, setFolderJournalViewer] = useState({ open: false, folder: null });

  const moods = ['all', 'happy', 'sad', 'excited', 'calm', 'anxious', 'grateful', 'frustrated', 'inspired'];

  // Fetch published stats for journals
  const fetchJournalStats = async (journalIds) => {
    if (!journalIds || journalIds.length === 0) return;
    
    try {
      const response = await getBatchPublishedStats(journalIds);
      const statsData = response.data || {};
      
      // The API returns an object with journalId as key, so we can use it directly
      const statsMap = {};
      Object.keys(statsData).forEach(journalId => {
        const stat = statsData[journalId];
        statsMap[journalId] = {
          views: stat.totalViews || 0,
          likes: stat.likes || 0,
          dislikes: stat.dislikes || 0,
          hearts: stat.hearts || 0
        };
      });
      
      setJournalStats(statsMap);
    } catch (error) {
      console.error('Error fetching journal stats:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchJournals();
    fetchFolders();
  }, [user]);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const userRes = await getCurrentUser();
      setUserId(userRes.data.id);
      const journalsRes = await getJournals(userRes.data.id);
      // Only personal journals on Dashboard (exclude team-associated ones)
      const personalOnly = (journalsRes.data || []).filter(e => !e.teamId);
      setEntries(personalOnly);
      
      // Fetch stats for published journals
      const publishedJournalIds = personalOnly
        .filter(entry => entry.isPublished)
        .map(entry => entry.id);
      
      if (publishedJournalIds.length > 0) {
        await fetchJournalStats(publishedJournalIds);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load journals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const handleEditEntry = (entry) => {
    console.log('Editing entry:', entry);
    console.log('Entry mediaUrls:', entry.mediaUrls);
    console.log('Entry mediaPaths:', entry.mediaPaths);
    
    // Check if journal is published - if so, show unpublish dialog first
    if (entry.isPublished) {
      setUnpublishDialog({ open: true, journal: entry, loading: false });
    } else {
      // Journal is not published, proceed with normal edit
      setEditingEntry(entry);
      setEditorOpen(true);
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      console.log('Dashboard handleSaveEntry called with:', entryData);
      console.log('Current editingEntry:', editingEntry);
      
      if (editingEntry) {
        await updateJournal(editingEntry.id, entryData);
        setSnackbar({ open: true, message: 'Journal updated successfully!', severity: 'success' });
      } else {
        await createJournal(userId, entryData);
        setSnackbar({ open: true, message: 'Journal created successfully!', severity: 'success' });
      }
      setEditorOpen(false);
      setEditingEntry(null);
      fetchJournals();
    } catch (error) {
      console.log('Save error:', error);
      setSnackbar({ open: true, message: 'Failed to save journal', severity: 'error' });
    }
  };

  const handleDeleteEntry = (id) => {
    const journal = entries.find(e => e.id === id);
    setConfirmDialog({
      open: true,
      type: 'delete',
      journalId: id,
      journalTitle: journal?.title || 'this journal'
    });
  };

  const handleConfirmDelete = async () => {
    const { journalId } = confirmDialog;
    setLoading(true);
    try {
      await deleteJournal(journalId);
      setEntries(entries.filter(e => e.id !== journalId));
      setSnackbar({ open: true, message: 'Journal deleted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete journal', severity: 'error' });
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, type: '', journalId: null, journalTitle: '' });
    }
  };

  // Menu handlers
  const handleMenuOpen = (event, entryId) => {
    event.stopPropagation();
    setMenuAnchorEls(prev => ({ ...prev, [entryId]: event.currentTarget }));
  };

  const handleMenuClose = (entryId) => {
    setMenuAnchorEls(prev => {
      const newState = { ...prev };
      delete newState[entryId];
      return newState;
    });
  };

  const handlePublishJournal = (entryId) => {
    const journal = entries.find(e => e.id === entryId);
    setConfirmDialog({
      open: true,
      type: 'publish',
      journalId: entryId,
      journalTitle: journal?.title || 'this journal'
    });
    handleMenuClose(entryId);
  };

  const handleConfirmPublish = async () => {
    const { journalId } = confirmDialog;
    try {
      await publishJournal(journalId);
      setSnackbar({ open: true, message: 'Journal published successfully!', severity: 'success' });
      fetchJournals();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to publish journal', severity: 'error' });
    }
    setConfirmDialog({ open: false, type: '', journalId: null, journalTitle: '' });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, type: '', journalId: null, journalTitle: '' });
  };

  const handleUnpublishBeforeEdit = async () => {
    const { journal } = unpublishDialog;
    if (!journal) return;
    
    setUnpublishDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await unpublishJournal(journal.id);
      setSnackbar({ open: true, message: 'Journal unpublished successfully! You can now edit it.', severity: 'success' });
      
      // Close unpublish dialog and open editor with the journal
      setUnpublishDialog({ open: false, journal: null, loading: false });
      setEditingEntry(journal);
      setEditorOpen(true);
      
      // Refresh journals to update the published status
      fetchJournals();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to unpublish journal', severity: 'error' });
      setUnpublishDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloseUnpublishDialog = () => {
    setUnpublishDialog({ open: false, journal: null, loading: false });
  };

  // Folder-related handlers
  const handleCreateFolder = () => {
    setFolderCreateDialog({ open: true, loading: false });
  };

  const handleCloseFolderCreateDialog = () => {
    setFolderCreateDialog({ open: false, loading: false });
  };

  const handleFolderSubmit = () => {
    setSnackbar({ open: true, message: 'Folder created successfully!', severity: 'success' });
    fetchFolders(); // Refresh folders list
  };

  const handleOpenFolderManagement = () => {
    setFolderManagementDialog({ open: true });
  };

  const handleCloseFolderManagement = () => {
    setFolderManagementDialog({ open: false });
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
    // You can add logic here to filter journals by folder
    setSnackbar({ 
      open: true, 
      message: `Viewing folder: ${folder.name}`, 
      severity: 'info' 
    });
  };

  const fetchFolders = async () => {
    try {
      const response = await getFolders();
      setFolders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleUnpublishJournal = async (entryId) => {
    try {
      await unpublishJournal(entryId);
      setSnackbar({ open: true, message: 'Journal unpublished successfully!', severity: 'success' });
      fetchJournals();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to unpublish journal', severity: 'error' });
    }
    handleMenuClose(entryId);
  };

  // Folder handlers
  const handleAddToFolder = (entryId) => {
    const journal = entries.find(e => e.id === entryId);
    setAddToFolderDialog({
      open: true,
      journalId: entryId,
      journalTitle: journal?.title || 'this journal',
      loading: false
    });
    handleMenuClose(entryId);
  };

  const handleAddToFolderConfirm = async (folderId) => {
    if (!addToFolderDialog.journalId || !folderId) return;

    setAddToFolderDialog(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await moveJournalToFolder(folderId, addToFolderDialog.journalId);
      
      if (response.data && response.data.success) {
        setSnackbar({ 
          open: true, 
          message: `Journal "${addToFolderDialog.journalTitle}" added to folder successfully!`, 
          severity: 'success' 
        });
        setAddToFolderDialog({ open: false, journalId: null, journalTitle: '', loading: false });
        // Refresh journals to update UI
        fetchJournals();
      } else {
        setSnackbar({ 
          open: true, 
          message: response.data?.message || 'Failed to add journal to folder', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error adding journal to folder:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add journal to folder';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setAddToFolderDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Folder view handlers
  const handleViewFolder = (folder) => {
    setFolderJournalViewer({ open: true, folder });
  };

  const handleCloseFolderJournalViewer = () => {
    setFolderJournalViewer({ open: false, folder: null });
  };

  const handleViewJournalFromFolder = (journal) => {
    // Close the folder viewer
    handleCloseFolderJournalViewer();
    // Set the journal for viewing
    setViewingEntry(journal);
  };

  const handleShowSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId || !search.trim()) {
      await fetchJournals();
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchJournals(userId, { search });
      setEntries(res.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Search failed', severity: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchJournals();
  };

  const handleViewEntry = async (id) => {
    setLoading(true);
    try {
      const res = await getJournal(id);
      setViewingEntry(res.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load journal', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseView = () => setViewingEntry(null);

  const handleDeleteFile = async (journalId, url) => {
    setLoading(true);
    try {
      // If it's a local file, extract the filename. If it's Cloudinary, keep the full URL.
      const filename = url.includes('/api/journals/media/') 
        ? url.split('/').pop().split('?')[0] 
        : url;
      await deleteJournalFile(journalId, filename);
      const res = await getJournal(journalId);
      setEntries(entries => entries.map(e => e.id === journalId ? res.data : e));
      if (viewingEntry && viewingEntry.id === journalId) setViewingEntry(res.data);
      setSnackbar({ open: true, message: 'File deleted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete file', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFile = async (journalId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      await uploadJournalFiles(journalId, files);
      const res = await getJournal(journalId);
      setEntries(entries => entries.map(e => e.id === journalId ? res.data : e));
      if (viewingEntry && viewingEntry.id === journalId) setViewingEntry(res.data);
      setSnackbar({ open: true, message: 'Files uploaded successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to upload files', severity: 'error' });
    } finally {
      setLoading(false);
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

  // Normalize any malformed media URLs/paths that may include duplicated prefixes
  // Examples it fixes:
  //   ${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/filename.jpg -> filename.jpg
  //   /api/journals/media/filename.jpg -> filename.jpg
  const normalizeMediaPath = (raw) => {
    if (!raw) return '';
    let u = String(raw).trim();
    const marker = '/api/journals/media/';
    const last = u.lastIndexOf(marker);
    if (last !== -1) {
      // Take only the filename part after the last occurrence of the marker
      u = u.substring(last + marker.length);
    }
    return u;
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';

    // First normalize any malformed or prefixed values down to just the filename when applicable
    const normalized = normalizeMediaPath(url);
    let fullUrl;

    // If the URL already starts with http, it's already a full URL from backend
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      fullUrl = normalized;
    }
    // If it starts with /api/journals/media/, add the backend base URL
    else if (normalized.startsWith('/api/journals/media/')) {
      fullUrl = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${normalized}`;
    }
    // If it's just a filename, construct the full URL
    else if (!normalized.startsWith('/')) {
      fullUrl = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${normalized}`;
    }
    // For other cases, add the backend base URL
    else {
      fullUrl = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${normalized}`;
    }

    // Add cache busting timestamp to prevent browser caching issues
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}t=${Date.now()}`;
  };

  // Authenticated Image Component for private media
  const AuthenticatedImage = ({ url, alt, style, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const fetchImage = async () => {
        try {
          setLoading(true);
          setError(false);
          
          const fullUrl = getFullFileUrl(url);
          // Cloudinary URLs are public CDN — no cookies needed (cookies cause CORS error)
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

      if (url && user) {
        fetchImage();
      }

      // Cleanup object URL on unmount
      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [url, user]);

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
            color: '#999'
          }}
        >
          <ImageIcon />
        </Box>
      );
    }

    return <img src={imageSrc} alt={alt} style={style} {...props} />;
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#4caf50',
      sad: '#2196f3',
      excited: '#ff9800',
      calm: '#9c27b0',
      anxious: '#f44336',
      grateful: '#8bc34a',
      frustrated: '#ff5722',
      inspired: '#e91e63'
    };
    return colors[mood] || '#757575';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
      link.download = url.split('/').pop(); // Extract filename from URL
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

  // Enhanced live search and filter
  const filteredEntries = entries.filter(entry => {
    const searchTerm = search.toLowerCase();
    const matchesTitle = entry.title?.toLowerCase().includes(searchTerm);
    const matchesContent = entry.content?.toLowerCase().includes(searchTerm);
    const matchesTags = entry.tags?.toLowerCase().includes(searchTerm);
    const matchesMood = entry.mood?.toLowerCase().includes(searchTerm);
    const matchesMoodFilter = filterMood === 'all' || (entry.mood && entry.mood.toLowerCase() === filterMood);
    return (
      matchesMoodFilter &&
      (matchesTitle || matchesContent || matchesTags || matchesMood)
    );
  });

  // Sort by selected field
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'title':
        aValue = a.title?.toLowerCase();
        bValue = b.title?.toLowerCase();
        break;
      case 'mood':
        aValue = a.mood || '';
        bValue = b.mood || '';
        break;
      default:
        aValue = new Date(a.date);
        bValue = new Date(b.date);
    }
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Use enhanced pagination hook with advanced options
  const pagination = usePagination(
    sortedEntries, 
    12, // initial items per page
    [search, filterMood, sortBy, sortOrder], // dependencies that reset to page 1
    {
      persistPageSize: true,
      storageKey: 'journal-pagination-settings',
      enableKeyboardNavigation: true,
      autoScrollToTop: true,
      loadingDelay: 200
    }
  );

  // File Viewer Component
  const FileViewer = () => {
    const currentFile = fileViewer.files[fileViewer.currentIndex];
    const fileType = currentFile ? getFileType(currentFile) : 'document';
    const fullFileUrl = currentFile ? getFullFileUrl(currentFile) : '';

    return (
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
          width: 'auto',
          height: 'auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            bgcolor: 'rgba(0,0,0,0.02)'
          }}>
            <Typography variant="h6">
              {currentFile ? currentFile.split('/').pop() : 'File Viewer'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {fileViewer.currentIndex + 1} of {fileViewer.files.length}
              </Typography>
              <IconButton onClick={handleCloseFileViewer}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* File Content */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            maxHeight: '70vh',
            p: 2,
            position: 'relative'
          }}>
            {currentFile && (
              <>
                {/* Navigation Buttons */}
                {fileViewer.files.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevFile}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                      }}
                    >
                      <CloseIcon sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                    <IconButton
                      onClick={handleNextFile}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                      }}
                    >
                      <CloseIcon sx={{ transform: 'rotate(-90deg)' }} />
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
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}

                {fileType === 'video' && (
                  <video
                    src={fullFileUrl}
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                    autoPlay={mediaPlayer.playing}
                  />
                )}

                {fileType === 'audio' && (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <audio
                      src={fullFileUrl}
                      controls
                      style={{ width: '100%', maxWidth: '400px' }}
                      autoPlay={mediaPlayer.playing}
                    />
                    <Box sx={{ mt: 2 }}>
                      <IconButton onClick={handleTogglePlay}>
                        {mediaPlayer.playing ? <PauseIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {fileType === 'document' && (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
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
              </>
            )}
          </Box>

          {/* Footer Actions */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid rgba(0,0,0,0.1)',
            bgcolor: 'rgba(0,0,0,0.02)'
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadFile(currentFile)}
              >
                Download
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {fileType.toUpperCase()} • {currentFile ? currentFile.split('/').pop() : ''}
            </Typography>
          </Box>
        </Box>
      </Modal>
    );
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" color="text.secondary">
          Please log in to view your journal entries
        </Typography>
      </Container>
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
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  My Journal Dashboard
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {entries.length} journal entries • Capture your thoughts and memories
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Manage Folders">
                  <Fab 
                    color="secondary" 
                    size="medium"
                    onClick={handleOpenFolderManagement}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  >
                    <FolderOpenIcon />
                  </Fab>
                </Tooltip>
                <Tooltip title="Create New Folder">
                  <Fab 
                    color="secondary" 
                    size="medium"
                    onClick={handleCreateFolder}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  >
                    <CreateNewFolderIcon />
                  </Fab>
                </Tooltip>
                <Tooltip title="Create New Journal">
                  <Fab 
                    color="primary" 
                    size="large"
                    onClick={handleNewEntry}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <AddIcon />
                  </Fab>
                </Tooltip>
              </Box>
            </Box>

            {/* Search and Filters */}
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <form onSubmit={handleSearch}>
                  <TextField
                    placeholder="Search journals by title, content, or tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {search && (
                            <IconButton onClick={handleClearSearch} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              <ClearIcon />
                            </IconButton>
                          )}
                          <IconButton type="submit" disabled={searchLoading} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {searchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </form>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255,255,255,0.7)',
                        },
                      }}
                    >
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="title">Title</MenuItem>
                      <MenuItem value="mood">Mood</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <ToggleButtonGroup
                    value={sortOrder}
                    exclusive
                    onChange={(e, value) => value && setSortOrder(value)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ToggleButton value="desc">↓</ToggleButton>
                    <ToggleButton value="asc">↑</ToggleButton>
                  </ToggleButtonGroup>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Mood Filter</InputLabel>
                    <Select
                      value={filterMood}
                      onChange={e => setFilterMood(e.target.value)}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255,255,255,0.7)',
                        },
                      }}
                    >
                      <MenuItem value="all">All Moods</MenuItem>
                      {moods.slice(1).map(mood => (
                        <MenuItem key={mood} value={mood}>
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, value) => value && setViewMode(value)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ToggleButton value="grid">Grid</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Folder Filter Section */}
        {selectedFolder && (
          <Fade in timeout={600}>
            <Paper elevation={4} sx={{ p: 2, mb: 3, borderRadius: 2, background: 'rgba(255,255,255,0.9)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: selectedFolder.color }}>
                    {selectedFolder.icon === 'folder' ? <FolderIcon /> : 
                     selectedFolder.icon === 'work' ? <WorkIcon /> :
                     selectedFolder.icon === 'person' ? <PersonIcon /> :
                     selectedFolder.icon === 'lightbulb' ? <LightbulbIcon /> :
                     <FolderIcon />}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Viewing Folder: {selectedFolder.name}
                  </Typography>
                  <Chip 
                    label={`${selectedFolder.journalCount} journals`}
                    size="small"
                    sx={{ 
                      backgroundColor: `${selectedFolder.color}20`,
                      color: selectedFolder.color,
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedFolder(null)}
                  sx={{ borderRadius: 2 }}
                >
                  Show All Journals
                </Button>
              </Box>
              {selectedFolder.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  {selectedFolder.description}
                </Typography>
              )}
            </Paper>
          </Fade>
        )}

        {/* Show result count */}
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {sortedEntries.length} result{sortedEntries.length !== 1 ? 's' : ''} found
            {selectedFolder && ` in folder "${selectedFolder.name}"`}
          </Typography>
        </Box>

        {/* Journal Entries */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : sortedEntries.length === 0 ? (
          <Fade in timeout={1000}>
            <Paper elevation={4} sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
              <ArchiveIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {search ? 'No journals found' : 'No journal entries yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {search ? 'Try adjusting your search terms' : 'Start your journaling journey by creating your first entry'}
              </Typography>
              {!search && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleNewEntry}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' }
                  }}
                >
                  Create Your First Journal
                </Button>
              )}
            </Paper>
          </Fade>
        ) : (
          <Zoom in timeout={1200}>
            <Grid container spacing={3}>
              {pagination.paginatedData.map((entry, index) => (
                <Fade in timeout={600 + index * 100} key={entry.id || index}>
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
                            background: `linear-gradient(135deg, ${getMoodColor(entry.mood)} 0%, ${getMoodColor(entry.mood)}dd 100%)`
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
                          background: `linear-gradient(135deg, ${getMoodColor(entry.mood)}22 0%, ${getMoodColor(entry.mood)}11 100%)`,
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
                            {entry.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, entry.id)}
                            sx={{ ml: 1, flexShrink: 0 }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={entry.mood || 'No mood'}
                            size="small"
                            sx={{
                              bgcolor: getMoodColor(entry.mood),
                              color: 'white',
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}
                          />
                          
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
                          
                          {/* Publish Status Indicator */}
                          {entry.isPublished ? (
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
                          ) : entry.hiddenByAdmin ? (
                            <Chip
                              icon={<BlockIcon />}
                              label="Hidden by Admin"
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: '#ff9800',
                                color: '#ff9800',
                                bgcolor: 'rgba(255, 152, 0, 0.05)',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                '& .MuiChip-icon': {
                                  color: '#ff9800',
                                  fontSize: '12px'
                                }
                              }}
                            />
                          ) : null}
                          
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(entry.date)}
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
                          {truncateText(entry.content)}
                        </Typography>

                        {/* Tags */}
                        {entry.tags && (
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {entry.tags.split(',').filter(Boolean).slice(0, 3).map(tag => (
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
                              {entry.tags.split(',').filter(Boolean).length > 3 && (
                                <Chip
                                  label={`+${entry.tags.split(',').filter(Boolean).length - 3}`}
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
                        {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AttachFileIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {entry.mediaUrls.length} file{entry.mediaUrls.length > 1 ? 's' : ''}
                            </Typography>
                            <ImageList sx={{ width: '100%', height: 120, m: 0 }} cols={3} rowHeight={40}>
                              {entry.mediaUrls.slice(0, 6).map((url, idx) => (
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
                                      onClick={() => handleOpenFileViewer(entry.mediaUrls, idx)}
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
                                      onClick={() => handleOpenFileViewer(entry.mediaUrls, idx)}
                                    >
                                      <InsertDriveFileIcon />
                                    </Box>
                                  )}
                                  <ImageListItemBar
                                    sx={{
                                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                                      '& .MuiImageListItemBar-title': {
                                        fontSize: '0.6rem',
                                        color: 'white'
                                      }
                                    }}
                                    title={url.split('/').pop()}
                                  />
                                </ImageListItem>
                              ))}
                            </ImageList>
                            {entry.mediaUrls.length > 6 && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenFileViewer(entry.mediaUrls, 0)}
                                sx={{ mt: 1 }}
                              >
                                View All Files ({entry.mediaUrls.length})
                              </Button>
                            )}
                          </Box>
                        )}
                      </CardContent>

                      {/* Published Stats Bar */}
                      {entry.isPublished && (
                        <Box sx={{ px: 2, pb: 1 }}>
                          {journalStats[entry.id] ? (
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
                                <Grid size={{ xs: 6, sm: 3 }}>
                                  <Chip
                                    icon={<VisibilityIcon />}
                                    label={`${journalStats[entry.id].views}`}
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
                                <Grid size={{ xs: 6, sm: 3 }}>
                                  <Chip
                                    icon={<ThumbUpIcon />}
                                    label={`${journalStats[entry.id].likes}`}
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
                                <Grid size={{ xs: 6, sm: 3 }}>
                                  <Chip
                                    icon={<FavoriteIcon />}
                                    label={`${journalStats[entry.id].hearts}`}
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
                                <Grid size={{ xs: 6, sm: 3 }}>
                                  <Chip
                                    icon={<ThumbDownIcon />}
                                    label={`${journalStats[entry.id].dislikes}`}
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

                      {/* Card Actions */}
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewEntry(entry.id)}
                            sx={{ flex: 1 }}
                          >
                            View
                          </Button>
                          <Tooltip title="Add Files">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AttachFileIcon />}
                              onClick={() => setFileDialog({ open: true, journalId: entry.id })}
                            >
                              Files
                            </Button>
                          </Tooltip>
                        </Stack>
                      </CardActions>

                      {/* Menu */}
                      <Menu
                        anchorEl={menuAnchorEls[entry.id]}
                        open={Boolean(menuAnchorEls[entry.id])}
                        onClose={() => handleMenuClose(entry.id)}
                      >
                        <MenuItem onClick={() => { handleEditEntry(entry); handleMenuClose(entry.id); }}>
                          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem onClick={() => handleAddToFolder(entry.id)}>
                          <FolderIcon fontSize="small" sx={{ mr: 1 }} /> Add to Folder
                        </MenuItem>
                        {entry.isPublished ? (
                          <MenuItem onClick={() => handleUnpublishJournal(entry.id)}>
                            <PublicIcon fontSize="small" sx={{ mr: 1 }} color="warning" /> Unpublish
                          </MenuItem>
                        ) : entry.hiddenByAdmin ? (
                          // Journal was hidden by admin - show status info instead of publish button
                          <MenuItem disabled>
                            <BlockIcon fontSize="small" sx={{ mr: 1 }} color="error" /> Hidden by Admin
                          </MenuItem>
                        ) : (
                          <MenuItem onClick={() => handlePublishJournal(entry.id)}>
                            <ShareIcon fontSize="small" sx={{ mr: 1 }} color="primary" /> Publish
                          </MenuItem>
                        )}
                        <MenuItem onClick={() => { handleDeleteEntry(entry.id); handleMenuClose(entry.id); }}>
                          <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" /> Delete
                        </MenuItem>
                      </Menu>
                    </Card>
                  </Grid>
                </Fade>
              ))}
            </Grid>
          </Zoom>
        )}

        {/* Enhanced Pagination Controls */}
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
          isLoading={pagination.isLoading}
          getStatistics={pagination.getStatistics}
          getPageRange={pagination.getPageRange}
          showAdvancedControls={true}
          showStatistics={false}
          enableKeyboardHints={true}
        />

        {/* File Upload Dialog */}
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
                  onChange={e => {
                    handleAddFile(fileDialog.journalId, e);
                    setFileDialog({ open: false, journalId: null });
                  }}
                />
              </Button>
              
              {fileDialog.journalId && (() => {
                const entry = entries.find(e => e.id === fileDialog.journalId);
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

        {/* File Viewer */}
        <FileViewer />

        {/* Journal Editor */}
        <JournalEditor 
          open={editorOpen} 
          onClose={handleCloseEditor} 
          onSave={handleSaveEntry} 
          initialData={editingEntry} 
          readOnly={false} 
          isTeamJournal={false}
        />
        
        {/* Journal Viewer */}
        <JournalViewer 
          open={!!viewingEntry} 
          onClose={handleCloseView} 
          entry={viewingEntry}
          onDeleteFile={handleDeleteFile}
          onOpenFileViewer={handleOpenFileViewer}
        />

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {confirmDialog.type === 'delete' ? 'Confirm Delete' : 'Confirm Publish'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              {confirmDialog.type === 'delete' 
                ? `Are you sure you want to delete "${confirmDialog.journalTitle}"? This action cannot be undone.`
                : `Are you sure you want to publish "${confirmDialog.journalTitle}"? This will make it visible to other users in the Published Journals section.`
              }
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={confirmDialog.type === 'delete' ? handleConfirmDelete : handleConfirmPublish}
              color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
              variant="contained"
            >
              {confirmDialog.type === 'delete' ? 'Delete' : 'Publish'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Unpublish Before Edit Dialog */}
        <UnpublishBeforeEditDialog
          open={unpublishDialog.open}
          onClose={handleCloseUnpublishDialog}
          onConfirm={handleUnpublishBeforeEdit}
          journalTitle={unpublishDialog.journal?.title || ''}
          loading={unpublishDialog.loading}
        />

        {/* Folder Create Dialog */}
        <FolderCreateDialog
          open={folderCreateDialog.open}
          onClose={handleCloseFolderCreateDialog}
          onSubmit={handleFolderSubmit}
          loading={folderCreateDialog.loading}
        />

        {/* Folder Management Dialog */}
        <FolderManagement
          open={folderManagementDialog.open}
          onClose={() => setFolderManagementDialog({ open: false })}
          onSelectFolder={handleSelectFolder}
          onViewFolder={handleViewFolder}
        />

        {/* Add to Folder Dialog */}
        <Dialog 
          open={addToFolderDialog.open} 
          onClose={() => setAddToFolderDialog({ open: false, journalId: null, journalTitle: '', loading: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <FolderOpenIcon sx={{ mr: 1, color: 'primary.main' }} />
              Add "{addToFolderDialog.journalTitle}" to Folder
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a folder to add this journal to:
            </Typography>
            
            {folders.length === 0 ? (
              <Box textAlign="center" py={3}>
                <CreateNewFolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No folders available. Create a folder first to organize your journals.
                </Typography>
              </Box>
            ) : (
              <Box>
                {folders.map((folder) => (
                  <Paper
                    key={folder.id}
                    elevation={1}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Box display="flex" alignItems="center">
                        <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {folder.name}
                          </Typography>
                          {folder.description && (
                            <Typography variant="body2" color="text.secondary">
                              {folder.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip 
                        label={`${folder.journalCount || 0} journals`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFolder(folder);
                        }}
                        sx={{ minWidth: 'auto' }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<FolderIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToFolderConfirm(folder.id);
                        }}
                        sx={{ minWidth: 'auto' }}
                      >
                        Add Here
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setAddToFolderDialog({ open: false, journalId: null, journalTitle: '', loading: false })}
              disabled={addToFolderDialog.loading}
            >
              Cancel
            </Button>
            {folders.length === 0 && (
              <Button
                variant="contained"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => {
                  setAddToFolderDialog({ open: false, journalId: null, journalTitle: '', loading: false });
                  setFolderCreateDialog({ open: true, loading: false });
                }}
              >
                Create Folder
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Folder Journal Viewer */}
        <FolderJournalViewer
          open={folderJournalViewer.open}
          onClose={handleCloseFolderJournalViewer}
          folder={folderJournalViewer.folder}
          onViewJournal={handleViewJournalFromFolder}
          onShowSnackbar={handleShowSnackbar}
        />

        {/* Snackbar */}
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
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Dashboard; 