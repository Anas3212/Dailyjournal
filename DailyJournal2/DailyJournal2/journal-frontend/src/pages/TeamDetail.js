import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent, 
  Avatar, Chip, Button, IconButton, Tooltip, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as JournalIcon,
  PersonAdd as InviteIcon,
  Delete as DeleteIcon,
  ExitToApp as LeaveIcon,
  Person as ProfileIcon,
  AdminPanelSettings as CrownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  PersonAdd,
  Refresh,
  SwapHoriz,
  Edit,
  Visibility,
  Close as CloseIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  People as PeopleIcon,
  Campaign as NoticeBoardIcon,
  PushPin as PinIcon,
  LinkOff as DisconnectIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import * as teamApi from '../services/teamApi';
import FriendSearch from '../components/FriendSearch';
import ConfirmDialog from '../components/ConfirmDialog';

function TeamDetail() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isNonMember, setIsNonMember] = useState(false);
  const [notices, setNotices] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [connectedTeams, setConnectedTeams] = useState([]);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, role, joinedAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Filter and sort members
  const filteredAndSortedMembers = React.useMemo(() => {
    let filtered = members.filter(member => {
      const name = (member.userName || '').toLowerCase();
      const email = (member.userEmail || '').toLowerCase();
      const role = (member.role || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return name.includes(search) || email.includes(search) || role.includes(search);
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.userName || '').toLowerCase();
          bValue = (b.userName || '').toLowerCase();
          break;
        case 'role':
          // Custom role order: MASTER > ADMIN > MEMBER
          const roleOrder = { 'MASTER': 3, 'ADMIN': 2, 'MEMBER': 1 };
          aValue = roleOrder[a.role] || 0;
          bValue = roleOrder[b.role] || 0;
          break;
        case 'joinedAt':
          aValue = new Date(a.joinedAt);
          bValue = new Date(b.joinedAt);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [members, searchTerm, sortBy, sortOrder]);
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showReclaimMessage, setShowReclaimMessage] = useState(false);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [showSentInvitations, setShowSentInvitations] = useState(false);

  useEffect(() => {
    if (teamId && user) {
      loadTeamData();
      loadNotices();
      loadConnectedTeams();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user]);

  // If user removed a friend, optionally prompt to remove them from the team too.
  // Triggered via URL query param: ?removedFriendId=<userId>
  useEffect(() => {
    if (!members || members.length === 0) return; // wait until members are loaded
    const params = new URLSearchParams(location.search || '');
    const removedFriendId = params.get('removedFriendId');
    if (!removedFriendId) return;

    const member = members.find(m => String(m.userId) === String(removedFriendId));
    if (!member) {
      // Clean the query param if not applicable
      navigate({ pathname: location.pathname }, { replace: true });
      return;
    }

    const memberName = member.userName || member.userEmail || 'this user';
    setConfirmDialog({
      open: true,
      title: 'Remove Member',
      message: `You removed ${memberName} from your friends list. Do you also want to remove them from this team?`,
      confirmText: 'Remove from Team',
      cancelText: 'Keep as Member',
      onConfirm: async () => {
        try {
          await teamApi.removeMember(teamId, member.userId);
          setSnackbar({ open: true, message: `${memberName} removed from team`, severity: 'success' });
          // Clear the query param and refresh team data
          navigate({ pathname: location.pathname }, { replace: true });
          loadTeamData();
        } catch (err) {
          setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to remove member', severity: 'error' });
        }
        setConfirmDialog({ open: false });
      },
      onCancel: () => {
        // Just clear the query param and close dialog
        navigate({ pathname: location.pathname }, { replace: true });
        setConfirmDialog({ open: false });
      }
    });
    // We only want to trigger once per presence of the param; cleaning the URL avoids loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, location.search]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let teamData = null;
      let membersData = [];
      let isNonMember = false;
      
      try {
        // Try to load team details with membership restrictions first
        const teamResponse = await teamApi.getTeam(teamId);
        teamData = teamResponse.data;
        
        // Load team members if user has access
        const membersResponse = await teamApi.listMembers(teamId);
        membersData = membersResponse.data || [];
      } catch (error) {
        // If user is not a member, load team details without restrictions
        if (error.response?.data?.message?.includes('not a member')) {
          try {
            const teamDetailsResponse = await teamApi.getTeamDetails(teamId);
            teamData = teamDetailsResponse.data;
            isNonMember = true;
            
            // Non-members can still see member list (backend allows this)
            try {
              const membersResponse = await teamApi.listMembers(teamId);
              membersData = membersResponse.data || [];
            } catch (memberError) {
              console.warn('Could not load members for non-member:', memberError);
              membersData = [];
            }
          } catch (detailsError) {
            throw detailsError; // Re-throw if even details fetch fails
          }
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      setTeam(teamData);
      setMembers(membersData);
      setIsNonMember(isNonMember);
      
      // Set user role and ownership status
      let role = null;
      let isUserOwner = false;
      let currentUserMember = null;
      
      if (!isNonMember) {
        // Only set role and ownership for actual members
        currentUserMember = membersData.find(member => member.userId === user.id);
        role = currentUserMember ? currentUserMember.role : null;
        isUserOwner = teamData.ownerId === user.id;
      }
      
      setUserRole(role);
      setIsOwner(isUserOwner);
      
      // Check for reclaim message visibility
      const shouldShowReclaim = currentUserMember?.showReclaimAlert || false;
      setShowReclaimMessage(shouldShowReclaim);
      
      // Load sent invitations for master users or owner (owner has master-equivalent permissions)
      // Only if user is a member
      if (!isNonMember && (role === 'MASTER' || teamData.ownerId === user.id)) {
        loadSentInvitations();
      }
      
    } catch (error) {
      console.error('Error loading team data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const loadSentInvitations = async () => {
    try {
      const response = await teamApi.getSentInvitations(teamId);
      const invitations = response.data || [];
      
      // Remove duplicates based on invitee email and keep the most recent
      const uniqueInvitations = invitations.reduce((acc, current) => {
        const existing = acc.find(inv => inv.inviteeEmail === current.inviteeEmail);
        if (!existing) {
          acc.push(current);
        } else if (new Date(current.createdAt) > new Date(existing.createdAt)) {
          // Replace with more recent invitation
          const index = acc.findIndex(inv => inv.inviteeEmail === current.inviteeEmail);
          acc[index] = current;
        }
        return acc;
      }, []);
      
      setSentInvitations(uniqueInvitations);
    } catch (err) {
      console.error('Error loading sent invitations:', err);
    }
  };

  const loadNotices = async () => {
    try {
      // ✅ Use cookies for authentication
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/teams/${teamId}/notices`, {
        credentials: 'include'
      });
      if (response.ok) {
        const noticesData = await response.json();
        setNotices(noticesData);
      }
    } catch (err) {
      console.error('Error loading notices:', err);
    }
  };

  const loadConnectedTeams = async () => {
    try {
      const response = await teamApi.getTeamConnections(teamId);
      const connectionsData = response.data.content || [];
      
      // Filter only accepted connections and get the connected teams
      const acceptedConnections = connectionsData.filter(conn => conn.status === 'ACCEPTED');
      const connectedTeamsData = acceptedConnections.map(conn => {
        // Return the team that is NOT the current team
        return conn.requesterTeam.id === parseInt(teamId) ? conn.targetTeam : conn.requesterTeam;
      });
      
      // Enrich connected teams with member and journal counts
      const enrichedConnectedTeams = await Promise.all(
        connectedTeamsData.map(async (connectedTeam) => {
          try {
            const [membersRes, journalsRes] = await Promise.all([
              teamApi.listMembers(connectedTeam.id),
              teamApi.listTeamJournals(connectedTeam.id)
            ]);
            
            const membersData = membersRes?.data;
            const journalsData = journalsRes?.data;
            
            const memberCount = Array.isArray(membersData)
              ? membersData.length
              : (typeof membersData?.totalElements === 'number'
                  ? membersData.totalElements
                  : (Array.isArray(membersData?.content) ? membersData.content.length : 0));
                  
            const journalCount = Array.isArray(journalsData)
              ? journalsData.length
              : (typeof journalsData?.totalElements === 'number'
                  ? journalsData.totalElements
                  : (Array.isArray(journalsData?.content) ? journalsData.content.length : 0));
            
            return {
              ...connectedTeam,
              memberCount,
              journalCount,
              ownerName: connectedTeam.ownerName || connectedTeam.owner?.name || 'Unknown'
            };
          } catch (error) {
            console.error(`Failed to enrich data for connected team ${connectedTeam.id}:`, error);
            return {
              ...connectedTeam,
              memberCount: 0,
              journalCount: 0,
              ownerName: connectedTeam.ownerName || connectedTeam.owner?.name || 'Unknown'
            };
          }
        })
      );
      
      setConnectedTeams(enrichedConnectedTeams);
    } catch (error) {
      console.error('Error loading connected teams:', error);
    }
  };

  const handleCancelInvitation = async (inviteId, userName) => {
    try {
      await teamApi.cancelInvitation(inviteId);
      setSnackbar({ open: true, message: `Invitation to ${userName} cancelled`, severity: 'info' });
      loadSentInvitations();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to cancel invitation', severity: 'error' });
    }
  };

  const handleInviteUser = async (selectedUser) => {
    try {
      // Check for duplicates before sending
      const existingInvitation = sentInvitations.find(
        inv => inv.inviteeEmail === selectedUser.email && inv.status === 'PENDING'
      );
      
      if (existingInvitation) {
        setSnackbar({ 
          open: true, 
          message: `${selectedUser.name || selectedUser.email} already has a pending invitation`, 
          severity: 'warning' 
        });
        // Continue to let backend validate; do not block sending
      }

      // Check if user is already a member
      const existingMember = members.find(member => member.userEmail === selectedUser.email);
      if (existingMember) {
        setSnackbar({ 
          open: true, 
          message: `${selectedUser.name || selectedUser.email} is already a team member`, 
          severity: 'info' 
        });
        // Continue to let backend validate; do not block sending
      }

      const resp = await teamApi.inviteUser(teamId, selectedUser.id);
      const msg = typeof resp?.data === 'string' ? resp.data : `Invitation sent to ${selectedUser.name || selectedUser.email}`;
      const severity = /already joined|already sent|already has/i.test(msg) ? 'info' : 'success';
      setSnackbar({ open: true, message: msg, severity });
      setInviteDialogOpen(false);
      
      // Refresh sent invitations list
      if (userRole === 'MASTER' || isOwner) {
        loadSentInvitations();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to send invitation', severity: 'error' });
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    try {
      await teamApi.removeMember(teamId, memberId);
      setSnackbar({ open: true, message: `${memberName} removed from team`, severity: 'success' });
      loadTeamData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to remove member', severity: 'error' });
    }
  };

  const handleRoleChange = async (memberId, newRole, memberName) => {
    try {
      await teamApi.changeMemberRole(teamId, memberId, newRole);
      setSnackbar({ open: true, message: `${memberName}'s role updated to ${newRole}`, severity: 'success' });
      loadTeamData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update role', severity: 'error' });
    }
  };

  const handlePromoteMember = (memberId, memberName) => {
    setConfirmDialog({
      open: true,
      title: 'Promote Member',
      message: `Are you sure you want to promote ${memberName} to Admin? This will give them additional permissions to create and edit team journals.`,
      confirmText: 'Promote',
      onConfirm: async () => {
        try {
          await teamApi.promoteMember(teamId, memberId);
          setSnackbar({ open: true, message: `${memberName} promoted to Admin`, severity: 'success' });
          loadTeamData();
        } catch (err) {
          setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to promote member', severity: 'error' });
        }
        setConfirmDialog({ open: false });
      }
    });
  };

  const handleDemoteMember = (memberId, memberName) => {
    setConfirmDialog({
      open: true,
      title: 'Demote Member',
      message: `Are you sure you want to demote ${memberName} to Member? This will remove their ability to create and edit team journals.`,
      confirmText: 'Demote',
      onConfirm: async () => {
        try {
          await teamApi.demoteMember(teamId, memberId);
          setSnackbar({ open: true, message: `${memberName} demoted to Member`, severity: 'success' });
          loadTeamData();
        } catch (err) {
          setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to demote member', severity: 'error' });
        }
        setConfirmDialog({ open: false });
      }
    });
  };

  const handleTransferOwnership = async (newOwnerId, newOwnerName) => {
    try {
      await teamApi.transferOwnership(teamId, newOwnerId);
      setSnackbar({ open: true, message: `Ownership transferred to ${newOwnerName}`, severity: 'success' });
      setTransferDialogOpen(false);
      loadTeamData();
    } catch (err) {
      // Enhanced error message handling for reclaim period restriction
      const backendMessage = err.response?.data?.message || 
                            err.response?.data || 
                            err.message || 
                            'Failed to transfer ownership';
      
      let errorTitle = 'Transfer Failed';
      let errorDescription = backendMessage;
      let errorIcon = '❌';
      let duration = 6000;
      
      // Check if it's the reclaim period restriction error
      if (typeof backendMessage === 'string' && 
          (backendMessage.includes('Cannot transfer ownership during reclaim period') || 
           backendMessage.includes('reclaim period'))) {
        
        errorIcon = '⏳';
        errorTitle = 'Transfer Blocked - Reclaim Period Active';
        errorDescription = 'This team was recently transferred and is in a 7-day reclaim period. The original owner can reclaim ownership during this time.';
        duration = 10000; // Longer for important message
        
        // Extract expiry date if available
        if (backendMessage.includes('Original owner can reclaim until')) {
          const expiryInfo = backendMessage.split('Original owner can reclaim until ')[1];
          if (expiryInfo) {
            errorDescription += `\n\nReclaim period expires: ${expiryInfo}`;
          }
        } else {
          errorDescription += '\n\nPlease wait for the reclaim period to expire before transferring again.';
        }
      }
      
      // Create rich error message with proper formatting
      const formattedMessage = `${errorIcon} ${errorTitle}\n\n${errorDescription}`;
      
      setSnackbar({ 
        open: true, 
        message: formattedMessage, 
        severity: 'error',
        autoHideDuration: duration,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await teamApi.leaveTeam(teamId);
      setSnackbar({ open: true, message: 'Left team successfully', severity: 'success' });
      navigate('/teams');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to leave team', severity: 'error' });
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await teamApi.deleteTeam(teamId);
      setSnackbar({ open: true, message: 'Team deleted successfully', severity: 'success' });
      navigate('/teams');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete team', severity: 'error' });
    }
  };

  const handleReclaimOwnership = async () => {
    try {
      await teamApi.reclaimOwnership(teamId);
      setSnackbar({ open: true, message: 'Ownership reclaimed successfully', severity: 'success' });
      setShowReclaimMessage(false);
      loadTeamData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to reclaim ownership', severity: 'error' });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'MASTER': return 'error';
      case 'ADMIN': return 'warning';
      case 'MEMBER': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'MASTER': return <SwapHoriz />;
      case 'ADMIN': return <Edit />;
      case 'MEMBER': return <Visibility />;
      default: return null;
    }
  };

  // Notice utility functions (from NoticeBoard.js)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#f56565';
      case 'HIGH': return '#ed8936';
      case 'NORMAL': return '#667eea';
      case 'LOW': return '#48bb78';
      default: return '#718096';
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

  const getNoticeRoleColor = (role) => {
    switch (role) {
      case 'MASTER': return '#f56565';
      case 'ADMIN': return '#ed8936';
      case 'MEMBER': return '#4299e1';
      default: return '#718096';
    }
  };

  const getNoticeRoleIcon = (role) => {
    switch (role) {
      case 'MASTER': return '👑';
      case 'ADMIN': return '⚡';
      case 'MEMBER': return '👤';
      default: return '❓';
    }
  };

  const getRecentNotices = () => {
    // Sort all notices by priority first, then by most recent within each priority
    const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
    return [...notices]
      .sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        return new Date(b.createdAt) - new Date(a.createdAt); // Most recent first within same priority
      })
      .slice(0, 3); // Take top 3 notices overall
  };

  const handleViewNotice = (notice) => {
    setViewingNotice(notice);
    setViewDialogOpen(true);
  };

  const handleViewTeamMembers = async (teamId, teamName) => {
    setLoadingMembers(true);
    setSelectedTeamName(teamName);
    setMembersDialogOpen(true);
    
    try {
      const response = await teamApi.listMembers(teamId);
      setSelectedTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      setError('Failed to load team members');
      setSelectedTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDisconnectTeam = async (connectedTeamId, connectedTeamName) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to disconnect from "${connectedTeamName}"? This will remove the team connection and stop collaboration between the teams.`
      );
      
      if (!confirmed) return;

      await teamApi.disconnectTeam(teamId, connectedTeamId);
      
      // Refresh connected teams list
      const response = await teamApi.getConnectedTeams(teamId);
      setConnectedTeams(response.data || []);
      
      setSnackbar({
        open: true,
        message: `Successfully disconnected from "${connectedTeamName}"`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error disconnecting team:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to disconnect team',
        severity: 'error'
      });
    }
  };

  const canManageMembers = userRole === 'MASTER' || isOwner;
  const canManageRoles = userRole === 'MASTER';

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Non-Member Information Alert */}
      {isNonMember && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'info.main',
            boxShadow: '0 8px 24px rgba(33, 150, 243, 0.15)',
            background: 'linear-gradient(135deg, rgba(227, 242, 253, 0.95) 0%, rgba(187, 222, 251, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Team Information View
          </Typography>
          <Typography variant="body2">
            You are viewing this team's basic information. You are not a member of this team, so some features and member details are not available.
            {team?.community && ` This team is part of the ${team.community} community.`}
          </Typography>
        </Alert>
      )}
      
      {/* Enhanced Reclaim Ownership Alert */}
      {showReclaimMessage && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'warning.main',
            boxShadow: '0 8px 24px rgba(237, 108, 2, 0.15)',
            background: 'linear-gradient(135deg, rgba(255, 243, 224, 0.95) 0%, rgba(254, 249, 195, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleReclaimOwnership}
                variant="contained"
                sx={{
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  px: 2,
                  boxShadow: '0 4px 12px rgba(237, 108, 2, 0.3)',
                  '&:hover': {
                    bgcolor: 'warning.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 16px rgba(237, 108, 2, 0.4)'
                  }
                }}
              >
                Reclaim Ownership
              </Button>
              <IconButton 
                color="inherit" 
                size="small" 
                onClick={() => setShowReclaimMessage(false)}
                sx={{
                  bgcolor: 'rgba(237, 108, 2, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(237, 108, 2, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          }
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🏆 Ownership Transfer Notice
            </Typography>
            <Typography variant="body2">
              You can reclaim ownership of this team within <strong>7 days</strong> of transfer. 
              This is your opportunity to regain control if needed.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Team Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <GroupIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                {team?.name || `Team ${teamId}`}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {isNonMember 
                  ? `${members.length} members • View Only Access` 
                  : `${members.length} members • Your role: ${userRole || 'Not a member'}`
                }
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadTeamData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Team Journals - available to all users (members see all, non-members see public) */}
          <Button
            variant="contained"
            startIcon={<JournalIcon />}
            onClick={() => navigate(`/teams/${teamId}/journals`)}
          >
            {isNonMember ? 'Public Journals' : 'Team Journals'}
          </Button>
          
          {/* Member-only features */}
          {!isNonMember && (
            <>
              <Button
                variant="contained"
                startIcon={<NoticeBoardIcon />}
                onClick={() => navigate(`/teams/${teamId}/notices`)}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF5252 30%, #26C6DA 90%)',
                  }
                }}
              >
                Notice Board
              </Button>
              
              {canManageMembers && (
                <Button
                  variant="outlined"
                  startIcon={<InviteIcon />}
                  onClick={() => setInviteDialogOpen(true)}
                >
                  Invite Members
                </Button>
              )}
              
              {isOwner && (
                <Button
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  onClick={() => setTransferDialogOpen(true)}
                >
                  Transfer Ownership
                </Button>
              )}
            </>
          )}
          
          {/* Non-member indicator */}
          {isNonMember && (
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              disabled
              sx={{
                borderColor: 'text.secondary',
                color: 'text.secondary'
              }}
            >
              View Only Access
            </Button>
          )}
          
          {!isOwner && !isNonMember && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LeaveIcon />}
              onClick={() => setConfirmDialog({
                open: true,
                title: 'Leave Team',
                message: 'Are you sure you want to leave this team?',
                onConfirm: handleLeaveTeam
              })}
            >
              Leave Team
            </Button>
          )}
          
          {isOwner && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDialog({
                open: true,
                title: 'Delete Team',
                message: 'Are you sure you want to delete this team? This action cannot be undone.',
                onConfirm: handleDeleteTeam
              })}
            >
              Delete Team
            </Button>
          )}
        </Box>
      </Paper>

      {/* Recent Priority Notices Section */}
      {notices.length > 0 && (
        <Paper elevation={3} sx={{ 
          p: 4, 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>          
          <Box display="flex" alignItems="center" mb={3}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <NoticeBoardIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                📋 Recent Notices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest 3 notices by priority
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate(`/teams/${teamId}/notices`)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              View All Notices
            </Button>
          </Box>

          <Grid container spacing={3}>
            {getRecentNotices().map((notice) => (
              <Grid item xs={12} sm={6} md={4} key={notice.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: notice.pinned 
                      ? 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)',
                    border: notice.pinned 
                      ? '2px solid transparent'
                      : '1px solid rgba(0,0,0,0.06)',
                    backgroundImage: notice.pinned 
                      ? 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%), linear-gradient(135deg, #667eea, #764ba2)'
                      : 'none',
                    backgroundOrigin: notice.pinned ? 'border-box' : 'padding-box',
                    backgroundClip: notice.pinned ? 'content-box, border-box' : 'padding-box',
                    boxShadow: notice.pinned 
                      ? '0 8px 32px rgba(102, 126, 234, 0.2)' 
                      : '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: notice.pinned 
                        ? '0 12px 40px rgba(102, 126, 234, 0.3)' 
                        : '0 8px 30px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  {/* Priority Color Bar */}
                  <Box
                    sx={{
                      height: 4,
                      background: getPriorityGradient(notice.priority),
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 2
                    }}
                  />

                  {/* Pin Badge */}
                  {notice.pinned && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        px: 1,
                        py: 0.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.3,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                        zIndex: 3,
                        fontSize: '0.65rem',
                        fontWeight: 600
                      }}
                    >
                      📌 PINNED
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 3, pt: notice.pinned ? 4 : 2.5 }}>
                    {/* Header Section */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                      <Chip
                        label={getPriorityLabel(notice.priority)}
                        sx={{
                          background: getPriorityGradient(notice.priority),
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 600,
                          bgcolor: 'rgba(102, 126, 234, 0.08)',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.65rem'
                        }}
                      >
                        {new Date(notice.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    {/* Title Section */}
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#2d3748',
                        mb: 1.5,
                        fontSize: '1rem',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {notice.title}
                    </Typography>
                    
                    {/* Content Preview */}
                    <Box
                      sx={{
                        bgcolor: 'rgba(102, 126, 234, 0.02)',
                        borderRadius: 2,
                        p: 1.5,
                        mb: 2,
                        border: '1px solid rgba(102, 126, 234, 0.08)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: getPriorityGradient(notice.priority),
                          borderRadius: '0 1px 1px 0'
                        }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#4a5568',
                          lineHeight: 1.5,
                          fontSize: '0.85rem'
                        }}
                      >
                        {notice.content.length > 20 ? `${notice.content.substring(0, 20)}...` : notice.content}
                      </Typography>
                    </Box>
                    
                    {/* Author Section */}
                    <Box 
                      display="flex" 
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ 
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid rgba(102, 126, 234, 0.1)'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}
                        >
                          {notice.createdByName?.charAt(0)?.toUpperCase() || '?'}
                        </Box>
                        <Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#4a5568',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            >
                              {notice.createdByName}
                            </Typography>
                            {notice.createdByRole && (
                              <Chip
                                label={`${getNoticeRoleIcon(notice.createdByRole)} ${notice.createdByRole}`}
                                size="small"
                                sx={{
                                  backgroundColor: getNoticeRoleColor(notice.createdByRole),
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  height: 16,
                                  borderRadius: 1,
                                  '& .MuiChip-label': {
                                    px: 0.5,
                                    py: 0
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* View Button */}
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewNotice(notice);
                        }}
                        sx={{
                          background: getPriorityGradient(notice.priority),
                          color: 'white',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Team Members Cards */}
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            <GroupIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {members.length} active {members.length === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
        </Box>

        {/* Search and Sort Controls */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search members by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flexGrow: 1, 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="role">Role</MenuItem>
              <MenuItem value="joinedAt">Join Date</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 100 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <MenuItem value="asc">A-Z</MenuItem>
              <MenuItem value="desc">Z-A</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Clear Search">
            <IconButton 
              onClick={() => setSearchTerm('')}
              disabled={!searchTerm}
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  transform: 'scale(1.1)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Results Summary */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredAndSortedMembers.length} of {members.length} members
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {filteredAndSortedMembers.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.userId || member.id}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ 
                      mr: 2, 
                      width: 56, 
                      height: 56,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                    }}>
                      {member.userName ? member.userName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" noWrap>
                        {member.userName || 'Unknown User'}
                        {member.userId === user?.id && (
                          <Chip label="You" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {member.userEmail || 'No email'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Chip
                      icon={getRoleIcon(member.role)}
                      label={member.role}
                      color={getRoleColor(member.role)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        '& .MuiChip-icon': {
                          fontSize: '1rem'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Joined: {new Date(member.joinedAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ 
                    my: 2,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%)'
                  }} />

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {/* View Profile Button */}
                    <Tooltip title="View Profile">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/users/${member.userId}`)}
                        sx={{
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <ProfileIcon />
                      </IconButton>
                    </Tooltip>

                    {/* View Journals Button */}
                    <Tooltip title="View Journals">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/user-journals/${member.userId}`)}
                        sx={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <JournalIcon />
                      </IconButton>
                    </Tooltip>

                    {/* Management Actions for MASTER */}
                    {canManageMembers && member.userId !== user?.id && (
                      <>
                        {/* Promote/Demote Buttons */}
                        {member.role === 'MEMBER' && (
                          <Tooltip title="Promote to Admin">
                            <IconButton 
                              size="small" 
                              onClick={() => handlePromoteMember(member.userId, member.userName)}
                              sx={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                '&:hover': {
                                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <KeyboardArrowUpIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {member.role === 'ADMIN' && (
                          <Tooltip title="Demote to Member">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDemoteMember(member.userId, member.userName)}
                              sx={{
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                '&:hover': {
                                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <KeyboardArrowDownIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Take Ownership Button for MASTER */}
                        {isOwner && member.role !== 'MASTER' && (
                          <Tooltip title="Transfer Ownership">
                            <IconButton 
                              size="small" 
                              onClick={() => setConfirmDialog({
                                open: true,
                                title: 'Transfer Ownership',
                                message: `Are you sure you want to transfer ownership to ${member.userName || 'Unknown User'}? You will become a regular member.`,
                                onConfirm: () => handleTransferOwnership(member.userId, member.userName || 'Unknown User')
                              })}
                              sx={{
                                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                color: '#a855f7',
                                '&:hover': {
                                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <CrownIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Remove Member Button */}
                        <Tooltip title="Remove Member">
                          <IconButton 
                            size="small" 
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: 'Remove Member',
                              message: `Are you sure you want to remove ${member.userName || 'Unknown User'} from the team?`,
                              onConfirm: () => handleRemoveMember(member.userId, member.userName || 'Unknown User')
                            })}
                            sx={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {filteredAndSortedMembers.length === 0 && members.length > 0 && (
          <Box textAlign="center" py={4}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No members match your search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or filters.
            </Typography>
          </Box>
        )}
        
        {members.length === 0 && (
          <Box textAlign="center" py={4}>
            <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No team members found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invite members to get started with your team.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Team Invite Section */}
      {canManageMembers && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Invite Members
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => setInviteDialogOpen(true)}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600
              }}
            >
              Invite User
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search and invite users to join your team. Only friends can be invited to maintain team security.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 2, 
            bgcolor: 'primary.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              mr: 2
            }}>
              <GroupIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Team Collaboration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invite your friends to collaborate on journals and share knowledge together.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Spacer between Invite Users and Sent Invitations */}
      <Box sx={{ mb: 3 }} />

      {/* Sent Invitations Display for Master Users */}
      {userRole === 'MASTER' && sentInvitations.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)'
          }}
        >
          <Box sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 40,
                height: 40
              }}>
                <InviteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Sent Invitations
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {sentInvitations.filter(inv => inv.status === 'PENDING').length} pending • {' '}
                  {sentInvitations.length} total invitation{sentInvitations.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowSentInvitations(!showSentInvitations)}
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                px: 2,
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {showSentInvitations ? 'Hide' : 'Show'}
            </Button>
          </Box>
          
          {showSentInvitations && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {sentInvitations
                  .sort((a, b) => {
                    // Sort by status priority: PENDING first, then by date
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  })
                  .map((invitation) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`${invitation.id}-${invitation.inviteeEmail}`}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 
                          invitation.status === 'PENDING' ? 'warning.light' :
                          invitation.status === 'ACCEPTED' ? 'success.light' :
                          invitation.status === 'REJECTED' ? 'error.light' :
                          'grey.200',
                        background: 
                          invitation.status === 'PENDING' ? 'linear-gradient(135deg, rgba(255, 243, 224, 0.3) 0%, rgba(254, 249, 195, 0.3) 100%)' :
                          invitation.status === 'ACCEPTED' ? 'linear-gradient(135deg, rgba(220, 252, 231, 0.3) 0%, rgba(187, 247, 208, 0.3) 100%)' :
                          invitation.status === 'REJECTED' ? 'linear-gradient(135deg, rgba(254, 226, 226, 0.3) 0%, rgba(252, 165, 165, 0.3) 100%)' :
                          'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          transform: 'translateY(-4px)',
                          borderColor: 
                            invitation.status === 'PENDING' ? 'warning.main' :
                            invitation.status === 'ACCEPTED' ? 'success.main' :
                            invitation.status === 'REJECTED' ? 'error.main' :
                            'primary.main'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Avatar and Status Indicator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, position: 'relative' }}>
                          <Avatar 
                            src={invitation.inviteePhotoUrl} 
                            sx={{ 
                              width: 64, 
                              height: 64,
                              border: '3px solid',
                              borderColor: 
                                invitation.status === 'PENDING' ? 'warning.main' :
                                invitation.status === 'ACCEPTED' ? 'success.main' :
                                invitation.status === 'REJECTED' ? 'error.main' :
                                'grey.400',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            {invitation.inviteeName?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          {invitation.status === 'PENDING' && (
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              right: '50%',
                              transform: 'translateX(20px)',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: 'warning.main',
                              border: '2px solid white',
                              animation: 'pulse 2s infinite'
                            }} />
                          )}
                        </Box>

                        {/* User Info */}
                        <Box sx={{ textAlign: 'center', mb: 2, flex: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 'bold', 
                            mb: 0.5,
                            fontSize: '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {invitation.inviteeName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            mb: 1.5,
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {invitation.inviteeEmail}
                          </Typography>

                          {/* Status Chip */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                            <Chip
                              label={invitation.status}
                              size="small"
                              color={
                                invitation.status === 'PENDING' ? 'warning' :
                                invitation.status === 'ACCEPTED' ? 'success' :
                                invitation.status === 'REJECTED' ? 'error' :
                                invitation.status === 'CANCELLED' ? 'default' : 'default'
                              }
                              variant={invitation.status === 'PENDING' ? 'filled' : 'outlined'}
                              sx={{
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>

                          {/* Date Info */}
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            fontWeight: 'medium',
                            display: 'block',
                            textAlign: 'center'
                          }}>
                            Sent {new Date(invitation.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            {invitation.respondedAt && (
                              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                Responded {new Date(invitation.respondedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Box>
                            )}
                          </Typography>
                        </Box>
                        
                        {/* Action Button */}
                        {invitation.status === 'PENDING' && (
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            fullWidth
                            onClick={() => handleCancelInvitation(invitation.id, invitation.inviteeName)}
                            sx={{
                              borderRadius: 2,
                              py: 1,
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      )}

      {/* Enhanced Invite User Dialog */}
      <Dialog 
        open={inviteDialogOpen} 
        onClose={() => setInviteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            border: '1px solid',
            borderColor: 'grey.200'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PersonAdd />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Invite Friends to Team
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Search and invite your friends
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <FriendSearch 
            onUserSelect={handleInviteUser} 
            excludeUserIds={members.map(member => member.userId).filter(Boolean)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setInviteDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Transfer Ownership Dialog */}
      <Dialog 
        open={transferDialogOpen} 
        onClose={() => setTransferDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            border: '1px solid',
            borderColor: 'grey.200'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SwapHoriz />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Transfer Team Ownership
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Choose a new team owner
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> You will lose ownership privileges and become a regular member. 
              You'll have 7 days to reclaim ownership if needed.
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
            Select a team member to transfer ownership to:
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            {members.filter(member => member.userId !== user?.id).map((member) => (
              <Card
                key={member.userId || member.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid',
                  borderColor: 'grey.200',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => setConfirmDialog({
                  open: true,
                  title: 'Transfer Ownership',
                  message: `Are you sure you want to transfer ownership to ${member.userName || 'Unknown User'}? You will become a regular member and have 7 days to reclaim ownership if needed.`,
                  onConfirm: () => handleTransferOwnership(member.userId, member.userName || 'Unknown User')
                })}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ 
                      width: 48, 
                      height: 48,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {member.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {member.userName || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.userEmail || 'No email'}
                      </Typography>
                      <Chip
                        label={member.role}
                        color={getRoleColor(member.role)}
                        size="small"
                        sx={{ mt: 0.5, fontWeight: 'medium' }}
                      />
                    </Box>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CrownIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setTransferDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        }}
        onCancel={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
      />

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
                          label={`${getNoticeRoleIcon(viewingNotice.createdByRole)} ${viewingNotice.createdByRole}`}
                          size="small"
                          sx={{
                            backgroundColor: getNoticeRoleColor(viewingNotice.createdByRole),
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
                      {new Date(viewingNotice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Notice Content */}
            <DialogContent sx={{ p: 4 }}>
              {/* Notice Image */}
              {viewingNotice.hasImage && (
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
                      src={`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/teams/${teamId}/notices/${viewingNotice.id}/image`}
                      alt="Notice attachment"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Paper>
                </Box>
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
                      {new Date(viewingNotice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Connected Teams Section */}
      {connectedTeams.length > 0 && (
        <Paper elevation={3} sx={{ 
          p: 4, 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>          
          <Box display="flex" alignItems="center" mb={3}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <GroupIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                🤝 Connected Teams
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teams you're connected with for collaboration
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {connectedTeams.map((connectedTeam) => (
              <Grid item xs={12} sm={6} md={4} key={connectedTeam.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#667eea', 
                          width: 40, 
                          height: 40,
                          mr: 2,
                          fontSize: '1.1rem',
                          fontWeight: 700
                        }}
                      >
                        {connectedTeam.name?.charAt(0)?.toUpperCase() || 'T'}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 0.5 }}>
                          {connectedTeam.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Owner: {connectedTeam.ownerName}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} mb={3}>
                      <Chip
                        size="small"
                        icon={<GroupIcon />}
                        label={`${connectedTeam.memberCount || 0} Members`}
                        variant="outlined"
                        sx={{
                          borderColor: '#667eea',
                          color: '#667eea',
                          '& .MuiChip-icon': { color: '#667eea' }
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<JournalIcon />}
                        label={`${connectedTeam.journalCount || 0} Journals`}
                        variant="outlined"
                        sx={{
                          borderColor: '#764ba2',
                          color: '#764ba2',
                          '& .MuiChip-icon': { color: '#764ba2' }
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" gap={1} mb={userRole === 'MASTER' ? 2 : 0}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GroupIcon />}
                        onClick={() => handleViewTeamMembers(connectedTeam.id, connectedTeam.name)}
                        sx={{ 
                          flex: 1,
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': {
                            borderColor: '#5a6fd8',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                          }
                        }}
                      >
                        Members
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<JournalIcon />}
                        onClick={() => navigate(`/teams/${connectedTeam.id}/journals`)}
                        sx={{ 
                          flex: 1,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)'
                          }
                        }}
                      >
                        Journals
                      </Button>
                    </Box>
                    
                    {/* Disconnect Button - Only visible to team master */}
                    {userRole === 'MASTER' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DisconnectIcon />}
                        onClick={() => handleDisconnectTeam(connectedTeam.id, connectedTeam.name)}
                        sx={{ 
                          width: '100%',
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          '&:hover': {
                            borderColor: '#dc2626',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626'
                          }
                        }}
                      >
                        Disconnect Team
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Team Members Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center">
            <PeopleIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {selectedTeamName} - Team Members
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setMembersDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {loadingMembers ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedTeamMembers.length} {selectedTeamMembers.length === 1 ? 'member' : 'members'}
              </Typography>
              
              <Grid container spacing={2}>
                {selectedTeamMembers.map((member) => (
                  <Grid item xs={12} sm={6} key={member.userId || member.id}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          boxShadow: 3,
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={member.userProfilePicture}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        >
                          {member.userName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {member.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.userEmail}
                          </Typography>
                          
                          <Box mt={1}>
                            <Chip
                              size="small"
                              label={member.role}
                              icon={member.role === 'MASTER' ? <CrownIcon /> : <ProfileIcon />}
                              color={member.role === 'MASTER' ? 'primary' : 'default'}
                              sx={{
                                fontWeight: 600,
                                ...(member.role === 'MASTER' && {
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  '& .MuiChip-icon': { color: 'white' }
                                })
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {selectedTeamMembers.length === 0 && (
                <Box textAlign="center" py={4}>
                  <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No members found
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setMembersDialogOpen(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={snackbar.anchorOrigin || { vertical: 'bottom', horizontal: 'left' }}
        sx={{
          '& .MuiAlert-root': {
            maxWidth: '500px',
            whiteSpace: 'pre-line', // Allows \n line breaks
            fontSize: '14px',
            '& .MuiAlert-message': {
              padding: '8px 0',
              lineHeight: 1.5
            }
          }
        }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{
            boxShadow: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '20px',
              alignSelf: 'flex-start',
              marginTop: '2px'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TeamDetail;