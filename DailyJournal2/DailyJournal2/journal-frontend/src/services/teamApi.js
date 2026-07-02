import api from './api';

// Teams
export const createTeam = (name, community = null) => api.post('/teams', { name, community });
export const updateTeam = (teamId, teamData) => api.put(`/teams/${teamId}`, teamData);
export const getMyTeams = () => api.get('/teams/mine');
export const getTeam = (teamId) => api.get(`/teams/${teamId}`);
export const getTeamDetails = (teamId) => api.get(`/teams/${teamId}/details`);
export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`);
export const transferOwnership = (teamId, newOwnerId, reason = null, notifyMembers = true) => 
  api.post(`/teams/${teamId}/transfer-ownership`, { 
    newOwnerId, 
    reason, 
    notifyMembers 
  });

// Members
export const listMembers = (teamId) => api.get(`/teams/${teamId}/members`);
export const leaveTeam = (teamId) => api.delete(`/teams/${teamId}/members/me`);
export const removeMember = (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`);
export const changeMemberRole = (teamId, userId, role) => api.post(`/teams/${teamId}/members/${userId}/role`, null, { params: { role } });

// Invites
export const inviteUser = (teamId, userId) => api.post(`/teams/${teamId}/invite/${userId}`);
export const getMyPendingInvites = () => api.get('/teams/invites/pending');
export const acceptInvite = (inviteId) => api.post(`/teams/invites/${inviteId}/accept`);
export const rejectInvite = (inviteId) => api.post(`/teams/invites/${inviteId}/reject`);
export const getSentInvitations = (teamId, email = null, status = null) => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (status) params.append('status', status);
  const queryString = params.toString();
  return api.get(`/teams/${teamId}/invites/sent${queryString ? `?${queryString}` : ''}`);
};
export const cancelInvitation = (inviteId) => api.delete(`/teams/invites/${inviteId}/cancel`);

// Team Journals
export const listTeamJournals = (teamId) => api.get(`/teams/${teamId}/journals`);

// Role Management
export const promoteMember = (teamId, userId) => api.post(`/teams/${teamId}/members/${userId}/promote`);
export const demoteMember = (teamId, userId) => api.post(`/teams/${teamId}/members/${userId}/demote`);

// Temporary Ownership
export const reclaimOwnership = (teamId) => api.post(`/teams/${teamId}/reclaim-ownership`);
export const canReclaimOwnership = (teamId, userId) => api.get(`/teams/${teamId}/can-reclaim/${userId}`);

// Journal Locking
export const acquireJournalLock = (journalId, sessionId) => api.post(`/journals/${journalId}/lock`, null, { params: { sessionId } });
export const releaseJournalLock = (journalId) => api.delete(`/journals/${journalId}/lock`);
export const extendJournalLock = (journalId, minutes = 30) => api.put(`/journals/${journalId}/lock/extend`, null, { params: { minutes } });
export const checkJournalLockStatus = (journalId) => api.get(`/journals/${journalId}/lock/status`);
export const getActiveJournalLocks = (journalId) => api.get(`/journals/${journalId}/locks`);
export const getMyActiveLocks = () => api.get('/journals/locks/mine');

// Friends' Master Teams Search
export const searchFriendsMasterTeams = (q = '', friendQ = '') => api.get('/teams/friends/masters', { params: { q, friendQ } });

// Team Connections
export const requestTeamConnection = (teamId, targetTeamId, message = '') => 
  api.post(`/teams/${teamId}/connections`, { targetTeamId, message });

export const respondToConnection = (teamId, connectionId, accept) => 
  api.put(`/teams/${teamId}/connections/${connectionId}`, { accept });

export const removeConnection = (teamId, connectionId) => 
  api.delete(`/teams/${teamId}/connections/${connectionId}`);

export const getTeamConnections = (teamId, page = 0, size = 10) => 
  api.get(`/teams/${teamId}/connections`, { params: { page, size } });

export const getTeamConnectionsByStatus = (teamId, status, page = 0, size = 10) => 
  api.get(`/teams/${teamId}/connections/status/${status}`, { params: { page, size } });

export const getPendingConnectionRequests = (teamId) => 
  api.get(`/teams/${teamId}/connections/pending`);

export const getConnectedTeams = (teamId) => 
  api.get(`/teams/${teamId}/connections/connected`);

const getConnectionStats = (teamId) => {
  return api.get(`/teams/${teamId}/connections/stats`);
};

export const getEligibleTeamsForConnection = () => {
  return api.get('/teams/1/connections/eligible-teams'); // Using dummy teamId since endpoint doesn't use it
};

export const checkTeamConnection = (teamId, otherTeamId) => 
  api.get(`/teams/${teamId}/connections/check/${otherTeamId}`);

export const disconnectTeam = (teamId, connectedTeamId) => 
  api.delete(`/teams/${teamId}/connections/team/${connectedTeamId}`);
