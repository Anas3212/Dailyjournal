import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Chip,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Add as AddIcon, 
  Group as GroupIcon, 
  Article as ArticleIcon, 
  Link as LinkIcon,
  ExitToApp as LeaveIcon,
  PersonAdd as InviteIcon,
  Settings as SettingsIcon,
  Restore as RestoreIcon,
  Send as SendIcon,
  Mail as MailIcon,
  Visibility,
  SwapHoriz,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { 
  listTeams, 
  createTeam,
  updateTeam,
  deleteTeam, 
  leaveTeam, 
  listMembers, 
  listTeamJournals, 
  reclaimOwnership,
  requestTeamConnection,
  getEligibleTeamsForConnection,
  getMyTeams,
  searchFriendsMasterTeams
} from '../services/teamApi';
import { AuthContext } from '../context/AuthContext';
import TeamReadOnlyDialog from '../components/TeamReadOnlyDialog';

export default function Teams() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('');
  const [loading, setLoading] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCommunity, setEditCommunity] = useState('');
  // Friends Master Teams search state (single search bar for team name or friend name/email)
  const [friendSearch, setFriendSearch] = useState('');
  const [friendResults, setFriendResults] = useState([]);
  const [friendLoading, setFriendLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamViewOpen, setTeamViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [connectingTeam, setConnectingTeam] = useState(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [targetTeam, setTargetTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [eligibleTeams, setEligibleTeams] = useState([]);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMyTeams();
      const base = (data || []).map(t => {
        // Always use userRole from backend for accurate role after ownership transfers
        const role = t.userRole || 'MEMBER';
        // Owner is determined by comparing ownerId with current user
        const isOwner = t.ownerId === user?.id;
        return { ...t, isOwner, role };
      });
      setTeams(base);
      // Enrich counts asynchronously
      enrichCounts(base);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and again when user is resolved (so role/isOwner derive correctly)
  useEffect(() => { load(); }, [user?.id]);

  // Debounced search for friends' master teams (single query used for both team and friend filters)
  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        setFriendLoading(true);
        const q = friendSearch.trim();
        let combined = [];
        if (!q) {
          const { data } = await searchFriendsMasterTeams('', '');
          combined = data || [];
        } else {
          // OR behavior: (team name matches) UNION (friend name/email matches)
          const [byTeam, byFriend] = await Promise.all([
            searchFriendsMasterTeams(q, ''),
            searchFriendsMasterTeams('', q)
          ]);
          const map = new Map();
          (byTeam.data || []).forEach(t => map.set(t.id, t));
          (byFriend.data || []).forEach(t => map.set(t.id, t));
          combined = Array.from(map.values());
        }
        const normalized = (combined || []).map(t => ({
          ...t,
          isOwner: t.ownerId === user?.id,
          role: t.userRole || 'MEMBER'
        }));
        setFriendResults(normalized);
      } catch (e) {
        // ignore errors
      } finally {
        setFriendLoading(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [friendSearch, user?.id]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createTeam(name.trim(), community.trim() || null);
      setName('');
      setCommunity('');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (team) => {
    setEditTeam(team);
    setEditName(team.name);
    setEditCommunity(team.community || '');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTeam(null);
    setEditName('');
    setEditCommunity('');
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editTeam) return;
    setLoading(true);
    try {
      await updateTeam(editTeam.id, {
        name: editName.trim(),
        community: editCommunity.trim() || null
      });
      closeEdit();
      await load();
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (teamId) => {
    if (!window.confirm('Delete this team? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteTeam(teamId);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const initials = (s = '') => s.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  const openDelete = (team) => { setToDelete(team); setConfirmOpen(true); };
  const closeDelete = () => { setConfirmOpen(false); setToDelete(null); };
  const confirmDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteTeam(toDelete.id);
      await load();
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const onReclaimOwnership = async (teamId) => {
    if (!window.confirm('Reclaim ownership of this team?')) return;
    setLoading(true);
    try {
      await reclaimOwnership(teamId);
      await load();
    } finally { setLoading(false); }
  };

  const handleConnectToTeam = async (team) => {
    try {
      // Load eligible teams for connection
      const eligibleRes = await getEligibleTeamsForConnection();
      const userEligibleTeams = eligibleRes.data || [];
      
      if (userEligibleTeams.length === 0) {
        setSnackbar({ 
          open: true, 
          message: 'You must be a MASTER or ADMIN of a team to request connections', 
          severity: 'error' 
        });
        return;
      }

      // Set up the connection dialog
      setTargetTeam(team);
      setEligibleTeams(userEligibleTeams);
      setSelectedTeamId(userEligibleTeams.length === 1 ? userEligibleTeams[0].id : '');
      setConnectionMessage(`Connection request to ${team.name}`);
      setConnectDialogOpen(true);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to load eligible teams', 
        severity: 'error' 
      });
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedTeamId || !targetTeam) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a team', 
        severity: 'error' 
      });
      return;
    }

    try {
      setConnectingTeam(targetTeam.id);
      await requestTeamConnection(selectedTeamId, targetTeam.id, connectionMessage);
      setSnackbar({ 
        open: true, 
        message: 'Connection request sent successfully!', 
        severity: 'success' 
      });
      setConnectDialogOpen(false);
      // Reset dialog state
      setTargetTeam(null);
      setSelectedTeamId('');
      setConnectionMessage('');
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to send connection request', 
        severity: 'error' 
      });
    } finally {
      setConnectingTeam(null);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Enrich teams with memberCount and journalCount from APIs
  const enrichCounts = async (teamList) => {
    try {
      const results = await Promise.all(teamList.map(async (t) => {
        try {
          const [membersRes, journalsRes] = await Promise.all([
            listMembers(t.id),
            listTeamJournals(t.id)
          ]);
          const membersData = membersRes?.data;
          const journalsData = journalsRes?.data;
          const memberCount = Array.isArray(membersData)
            ? membersData.length
            : (typeof membersData?.totalElements === 'number'
                ? membersData.totalElements
                : (Array.isArray(membersData?.content) ? membersData.content.length : undefined));
          const journalCount = Array.isArray(journalsData)
            ? journalsData.length
            : (typeof journalsData?.totalElements === 'number'
                ? journalsData.totalElements
                : (Array.isArray(journalsData?.content) ? journalsData.content.length : undefined));
          return { id: t.id, memberCount, journalCount };
        } catch {
          return { id: t.id };
        }
      }));
      setTeams(prev => prev.map(t => {
        const found = results.find(r => r.id === t.id) || {};
        return { ...t, ...found };
      }));
    } catch {
      // ignore enrichment errors
    }
  };

  const localTheme = useMemo(() => createTheme({
    palette: {
      primary: { main: '#667eea' },
      secondary: { main: '#764ba2' },
      background: { 
        default: '#f8fafc',
        paper: '#ffffff' 
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b'
      }
    },
    shape: { borderRadius: 16 },
    typography: { 
      button: { textTransform: 'none', fontWeight: 600 },
      h4: { fontWeight: 700, color: '#1e293b' },
      h6: { fontWeight: 600 }
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderColor: '#cbd5e1'
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { 
            borderRadius: 12,
            fontWeight: 600,
            textTransform: 'none'
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            }
          },
          outlined: {
            borderWidth: 2,
            '&:hover': { borderWidth: 2 }
          }
        },
      },
      MuiTextField: {
        styleOverrides: { 
          root: { 
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: '#ffffff',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea'
              }
            }
          } 
        },
      },
      MuiDialog: { 
        styleOverrides: { 
          paper: { 
            borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          } 
        } 
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600
          }
        }
      }
    },
  }), []);

  return (
    <ThemeProvider theme={localTheme}>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Paper 
            elevation={4} 
            sx={{ 
              p: 4, 
              mb: 4, 
              borderRadius: 3,
              background: 'white'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Box>
                <Typography variant="h4" sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  mb: 1
                }}>
                  My Teams
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Collaborate and manage your team projects
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<MailIcon />}
                  onClick={() => navigate('/team-invites')}
                  sx={{ borderRadius: 3 }}
                >
                  My Invites
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<LinkIcon />}
                  onClick={() => {
                    // Navigate to connections page for the first team where user is MASTER/ADMIN
                    const userTeam = teams.find(t => t.userRole === 'MASTER' || t.userRole === 'ADMIN');
                    if (userTeam) {
                      navigate(`/teams/${userTeam.id}/connections`);
                    } else {
                      alert('You must be a MASTER or ADMIN of a team to manage connections');
                    }
                  }}
                  sx={{ borderRadius: 3 }}
                >
                  Connections
                </Button>
              </Stack>
            </Stack>

            {/* Create Team Form */}
            <Paper 
              component="form" 
              onSubmit={onCreate} 
              elevation={0}
              sx={{ 
                p: 3, 
                background: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}
            >
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                  <TextField
                    label="Team Name"
                    placeholder="Enter your team name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                    sx={{ maxWidth: { sm: 400 }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                  <TextField
                    label="Community (Optional)"
                    placeholder="e.g., University, Company, Area..."
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    fullWidth
                    sx={{ maxWidth: { sm: 400 }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading}
                    startIcon={<AddIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      minWidth: 160,
                      borderRadius: 2,
                      fontWeight: 600,
                      boxShadow: '0 4px 14px 0 rgba(102,126,234,0.39)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    Create Team
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Paper>

          {/* Loading State */}
          {loading && (
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Fade in timeout={300 + i * 100}>
                    <Card sx={{ height: 320 }}>
                      <CardHeader 
                        avatar={<Skeleton variant="circular" width={56} height={56} />} 
                        title={<Skeleton width="70%" height={24} />} 
                        subheader={<Skeleton width="50%" height={16} />}
                        action={<Skeleton variant="circular" width={40} height={40} />}
                      />
                      <CardContent>
                        <Skeleton height={20} sx={{ mb: 2 }} />
                        <Stack direction="row" spacing={1} mb={2}>
                          <Skeleton variant="rounded" width={100} height={32} />
                          <Skeleton variant="rounded" width={120} height={32} />
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Skeleton variant="rounded" width={120} height={36} />
                        <Skeleton variant="rounded" width={140} height={36} />
                      </CardActions>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Teams Grid */}
          {!loading && (
            <Grid container spacing={3}>
              {(teams || []).map((t, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
                  <Fade in timeout={300 + index * 100}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'visible'
                    }}>
                      <CardHeader
                        avatar={
                          <Avatar 
                            sx={{ 
                              width: 56, 
                              height: 56,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              boxShadow: '0 4px 10px rgba(102, 126, 234, 0.4)'
                            }}
                          >
                            {initials(t.name)}
                          </Avatar>
                        }
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {t.name}
                            </Typography>
                            {(() => {
                              const roleConfig = {
                                MASTER: { color: 'error', icon: <SwapHoriz fontSize="small" />, bg: '#fee2e2' },
                                ADMIN: { color: 'warning', icon: <EditIcon fontSize="small" />, bg: '#fef3c7' },
                                MEMBER: { color: 'info', icon: <Visibility fontSize="small" />, bg: '#dbeafe' }
                              };
                              const config = roleConfig[t.role] || roleConfig.MEMBER;
                              return (
                                <Chip
                                  size="small"
                                  icon={config.icon}
                                  label={t.role || 'MEMBER'}
                                  sx={{
                                    backgroundColor: config.bg,
                                    color: `${config.color}.dark`,
                                    fontWeight: 700,
                                    border: 'none',
                                    height: 24,
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              );
                            })()}
                          </Box>
                        }
                        subheader={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Owner: {t.ownerName || 'Unknown'}
                            </Typography>
                            {t.community && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                                Community: {t.community}
                              </Typography>
                            )}
                          </Box>
                        }
                        action={
                          t.role === 'MASTER' && (
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Edit team">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => openEdit(t)}
                                  sx={{ 
                                    backgroundColor: '#f1f5f9',
                                    '&:hover': { backgroundColor: '#e2e8f0' }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete team">
                                <IconButton 
                                  color="error" 
                                  onClick={() => openDelete(t)}
                                  sx={{ 
                                    backgroundColor: '#fee2e2',
                                    '&:hover': { backgroundColor: '#fecaca' }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )
                        }
                      />
                      
                      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                          Collaborate and manage journals with your team members in a shared workspace.
                        </Typography>
                        
                        <Stack direction="row" spacing={1} mb={2}>
                          <Chip
                            size="small"
                            icon={<GroupIcon />}
                            label={`${typeof t.memberCount === 'number' ? t.memberCount : (Array.isArray(t.members) ? t.members.length : 0)} Members`}
                            variant="outlined"
                            sx={{ 
                              backgroundColor: '#f0f9ff',
                              borderColor: '#0ea5e9',
                              color: '#0369a1'
                            }}
                          />
                          <Chip
                            size="small"
                            icon={<ArticleIcon />}
                            label={`${typeof t.journalCount === 'number' ? t.journalCount : (Array.isArray(t.journals) ? t.journals.length : 0)} Journals`}
                            variant="outlined"
                            sx={{ 
                              backgroundColor: '#f0fdf4',
                              borderColor: '#22c55e',
                              color: '#15803d'
                            }}
                          />
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ 
                        p: 2, 
                        pt: 2,
                        mt: 'auto',
                        borderTop: '1px solid #f1f5f9'
                      }}>
                        <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                          {/* Team Management - Only MASTER can manage members */}
                          {t.role === 'MASTER' && (
                            <Button 
                              size="medium" 
                              startIcon={<ManageAccountsIcon />} 
                              onClick={() => navigate(`/teams/${t.id}`)}
                              variant="outlined"
                              sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
                            >
                              Manage Team
                            </Button>
                          )}
                          
                          {/* View Team - All roles can view team details */}
                          {t.role !== 'MASTER' && (
                            <Button 
                              size="medium" 
                              variant="outlined" 
                              startIcon={<GroupIcon />} 
                              onClick={() => navigate(`/teams/${t.id}`)}
                              sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
                            >
                              View Team
                            </Button>
                          )}
                          
                          {/* Journal Management - ADMIN and MASTER */}
                          {(t.role === 'ADMIN' || t.role === 'MASTER') ? (
                            <Button 
                              size="medium" 
                              variant="contained" 
                              startIcon={<ArticleIcon />} 
                              onClick={() => navigate(`/teams/${t.id}/journals`)}
                              sx={{ 
                                flex: 1, 
                                borderRadius: 2, 
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 14px 0 rgba(102,126,234,0.39)',
                                '&:hover': {
                                  boxShadow: '0 6px 20px rgba(102,126,234,0.23)'
                                }
                              }}
                            >
                              Journals
                            </Button>
                          ) : (
                            <Button 
                              size="medium" 
                              variant="outlined" 
                              startIcon={<Visibility />} 
                              onClick={() => navigate(`/teams/${t.id}/journals`)}
                              sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
                            >
                              View Journals
                            </Button>
                          )}
                        </Stack>
                      </CardActions>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Empty State */}
          {!loading && teams?.length === 0 && (
            <Fade in timeout={500}>
              <Paper 
                elevation={0}
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  px: 4,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  No teams yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                  Create your first team to start collaborating with others on journals and projects.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => document.querySelector('input[label="Team Name"]')?.focus()}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Create Your First Team
                </Button>
              </Paper>
            </Fade>
          )}

          {/* Enhanced Delete Dialog */}
          <Dialog 
            open={confirmOpen} 
            onClose={closeDelete}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ 
              pb: 1,
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#dc2626'
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DeleteIcon />
                <Typography variant="h6" component="span" fontWeight={600}>
                  Delete Team
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>"{toDelete?.name}"</strong>? 
                <br /><br />
                This action will permanently remove:
                <br />• All team members and their access
                <br />• All team journals and content
                <br />• All team settings and configurations
                <br /><br />
                <strong>This action cannot be undone.</strong>
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={closeDelete}
                variant="outlined"
                sx={{ px: 3 }}
              >
                Cancel
              </Button>
              <Button 
                color="error" 
                variant="contained" 
                onClick={confirmDelete} 
                startIcon={<DeleteIcon />}
                sx={{ px: 3 }}
              >
                Delete Team
              </Button>
            </DialogActions>
          </Dialog>

          {/* Friends' Master Teams Search - Bottom Section */}
          <Box sx={{ mt: 6 }}>
            <Paper
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <Stack direction="column" spacing={2} alignItems="stretch" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 700, flexShrink: 0 }}>
                  Teams where my friends are Masters
                </Typography>
                <TextField 
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Search by team name or friend name/email"
                  fullWidth
                  size="small"
                />
              </Stack>

              {friendLoading && (
                <Typography variant="body2" color="text.secondary">Searching...</Typography>
              )}

              {!friendLoading && (
                <Grid container spacing={3}>
                  {(friendResults || []).map((t, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`friend-${t.id}`}>
                      <Fade in timeout={200 + index * 80}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardHeader 
                            avatar={<Avatar sx={{ bgcolor: '#667eea' }}>{initials(t.name)}</Avatar>}
                            title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t.name}</Typography>}
                            subheader={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Owner: {t.ownerName || 'Unknown'}
                                </Typography>
                                {t.community && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Community: {t.community}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <CardContent sx={{ pt: 0 }}>
                            <Stack direction="row" spacing={1}>
                              <Chip size="small" icon={<GroupIcon />} label={`${t.memberCount ?? 0} Members`} variant="outlined" />
                              <Chip size="small" icon={<ArticleIcon />} label={`${t.journalCount ?? 0} Journals`} variant="outlined" />
                            </Stack>
                          </CardContent>
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={async () => {
                                  // Check if current user is a member of this team
                                  try {
                                    const membersResponse = await listMembers(t.id);
                                    const isMember = membersResponse.data.some(member => member.userId === user?.id);
                                    
                                    if (isMember) {
                                      // User is a member - navigate to full team page
                                      navigate(`/teams/${t.id}`);
                                    } else {
                                      // User is not a member - show read-only dialog
                                      setSelectedTeam(t);
                                      setTeamViewOpen(true);
                                    }
                                  } catch (error) {
                                    // If error checking membership, assume non-member and show dialog
                                    setSelectedTeam(t);
                                    setTeamViewOpen(true);
                                  }
                                }} 
                                startIcon={<Visibility />} 
                                sx={{ flex: 1 }}
                              >
                                View Team
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<LinkIcon />}
                                onClick={() => handleConnectToTeam(t)}
                                disabled={connectingTeam === t.id}
                                sx={{ flex: 1 }}
                              >
                                {connectingTeam === t.id ? 'Connecting...' : 'Connect'}
                              </Button>
                            </Stack>
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                  {!friendResults?.length && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No teams found where your friends are Masters.</Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Team Read-Only Dialog */}
      <TeamReadOnlyDialog 
        open={teamViewOpen}
        onClose={() => {
          setTeamViewOpen(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
      />

      {/* Connection Request Dialog */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Team Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Connect to: <strong>{targetTeam?.name}</strong>
          </Typography>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="team-select-label">Select Your Team</InputLabel>
            <Select
              labelId="team-select-label"
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              label="Select Your Team"
            >
              {eligibleTeams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} ({team.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Message"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={connectionMessage}
            onChange={(e) => setConnectionMessage(e.target.value)}
            placeholder="Why would you like to connect with this team?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendConnectionRequest}
            variant="contained"
            disabled={!selectedTeamId || connectingTeam === targetTeam?.id}
            startIcon={<SendIcon />}
          >
            {connectingTeam === targetTeam?.id ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdate} sx={{ pt: 1 }}>
            <TextField
              label="Team Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              fullWidth
              margin="normal"
              autoFocus
            />
            <TextField
              label="Community (Optional)"
              placeholder="e.g., University, Company, Area..."
              value={editCommunity}
              onChange={(e) => setEditCommunity(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Specify the community this team belongs to"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button
            onClick={onUpdate}
            variant="contained"
            disabled={loading || !editName.trim()}
          >
            {loading ? 'Updating...' : 'Update Team'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </ThemeProvider>
  );
}
