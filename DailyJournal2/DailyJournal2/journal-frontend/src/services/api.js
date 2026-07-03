import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Enable cookies for all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cookie-based authentication - no manual token handling needed!
// Cookies are automatically included in requests with withCredentials: true

// Global session monitor callback (set by components that use session monitoring)
let sessionMonitorCallback = null;

export const setSessionMonitorCallback = (callback) => {
  sessionMonitorCallback = callback;
};

// ✅ Auto-refresh token on 401/403 errors using cookies + session monitoring
api.interceptors.response.use(
  (response) => {
    // Monitor session headers on successful responses
    if (sessionMonitorCallback && response) {
      sessionMonitorCallback(response);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only retry on 401 (Unauthorized / token expired) — NOT 403 (Forbidden = permission denied)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using cookie endpoints
        await api.post('/auth/cookie/refresh');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.log('Token refresh failed, user needs to login again');
        
        // Clear user data from localStorage (keep for app state only)
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = (email, password) =>
  api.post('/auth/cookie/login', { email, password });

export const register = (name, email, password) =>
  api.post('/auth/cookie/register', { name, email, password });

export const getCurrentUser = () =>
  api.get('/users/me');

export const updateProfile = (data) =>
  api.put('/users/update', data);

export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/users/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllUsers = () =>
  api.get('/users/all');

export const promoteUser = (userId) =>
  api.post(`/admin/promote/${userId}`);

export const blockUser = (userId) =>
  api.delete(`/users/${userId}`);

export const toggleUserStatus = (userId) =>
  api.put(`/users/toggle-status/${userId}`);

export const deleteUser = (userId) =>
  api.delete(`/admin/users/${userId}`);

export const adminSearchJournals = (query) =>
  api.get('/admin/journals/search-users', { params: { query } });

export const adminGetAllJournals = () =>
  api.get('/admin/journals/all');

export const adminDeleteJournal = (journalId) =>
  api.delete(`/admin/journals/${journalId}`);

export const getJournals = (userId) =>
  api.get(`/journals/user/${userId}`);

export const getJournal = (id) =>
  api.get(`/journals/${id}`);

export const createJournal = (userId, data) =>
  api.post(`/journals/create/${userId}`, data);

export const updateJournal = (id, data) =>
  api.put(`/journals/${id}`, data);

export const deleteJournal = (id) =>
  api.delete(`/journals/${id}`);

export const searchJournals = (userId, params) =>
  api.get(`/journals/search`, { params: { userId, ...params } });

export const filterJournals = (userId, params) =>
  api.get(`/journals/filter`, { params: { ...params, userId } });

export const uploadJournalFiles = async (journalId, files) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file, file.name);
  });
  // ✅ Use cookies for authentication instead of manual token
  const res = await fetch(`${API_BASE}/journals/${journalId}/upload`, {
    method: 'POST',
    credentials: 'include', // Use cookies for authentication
    body: formData,
  });
  const text = await res.text();
  if (!res.ok) {
    // Try to parse JSON error, else use text
    try {
      const json = JSON.parse(text);
      throw new Error(json?.message || text || 'Upload failed');
    } catch {
      throw new Error(text || 'Upload failed');
    }
  }
  // Try to parse JSON list of URLs
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { data: text };
  }
};

export const deleteJournalFile = (journalId, filename) =>
  api.delete(`/journals/${journalId}/media?fileUrl=${encodeURIComponent(filename)}`);

export const searchUsers = (query) =>
  api.get(`/users/search?query=${encodeURIComponent(query)}`);

export const getUserProfile = (userId) =>
  api.get(`/users/${userId}/profile`);

// ===== PUBLIC JOURNAL ENDPOINTS =====
// These endpoints return only public (non-private) journals for user search and viewing

export const getPublicJournals = (userId) =>
  api.get(`/journals/public/user/${userId}`);

export const searchPublicJournals = (userId, params) =>
  api.get(`/journals/public/search`, { params: { userId, ...params } });

export const getPublicJournalsByDateRange = (userId, start, end) =>
  api.get(`/journals/public/calendar?userId=${userId}&start=${start}&end=${end}`);

// ===== PUBLISHED JOURNAL ENDPOINTS =====
// These endpoints handle published journals that any user can view

export const getAllPublishedJournals = () =>
  api.get('/journals/published');

export const searchPublishedJournals = (params) =>
  api.get('/journals/published/search', { params });

export const publishJournal = (journalId) =>
  api.post(`/journals/${journalId}/publish`);

export const unpublishJournal = (journalId) =>
  api.post(`/journals/${journalId}/unpublish`);

// Views & Reactions for published journals
export const recordPublishedView = (journalId) =>
  api.post(`/journals/published/${journalId}/view`);

export const togglePublishedReaction = (journalId, type) =>
  api.post(`/journals/published/${journalId}/react`, null, { params: { type } });

export const getPublishedStats = (journalId) =>
  api.get(`/journals/published/${journalId}/stats`);

export const getBatchPublishedStats = (journalIds) =>
  api.post('/journals/published/batch-stats', { ids: journalIds });

// ===== ADMIN PUBLISHED JOURNAL ENDPOINTS =====
// These endpoints show all journals that were ever published (including hidden ones) for admin moderation

export const getAllEverPublishedJournalsForAdmin = () =>
  api.get('/journals/admin/published');

export const searchAllEverPublishedJournalsForAdmin = (params) =>
  api.get('/journals/admin/published/search', { params });

export const restoreJournal = (journalId) =>
  api.post(`/journals/admin/${journalId}/restore`);

export const hideJournalByAdmin = (journalId) =>
  api.post(`/journals/admin/${journalId}/hide`);

// Friend Request API functions
export const sendFriendRequest = (receiverId) =>
  api.post(`/friends/request/${receiverId}`);

export const acceptFriendRequest = (requestId) =>
  api.post(`/friends/accept/${requestId}`);

export const rejectFriendRequest = (requestId) =>
  api.post(`/friends/reject/${requestId}`);

export const getPendingFriendRequests = () =>
  api.get('/friends/requests/pending');

export const getSentFriendRequests = () =>
  api.get('/friends/requests/sent');

export const getPendingRequestCount = () =>
  api.get('/friends/requests/count');

export const getFriendRequestStatus = (userId) =>
  api.get(`/friends/status/${userId}`);

// Friend API functions (legacy and current)
export const addFriend = (friendId) =>
  api.post(`/friends/add/${friendId}`);

export const removeFriend = (friendId) =>
  api.delete(`/friends/remove/${friendId}`);

export const getMyFriends = () =>
  api.get('/friends/my-friends');

export const getUserFriends = (userId) =>
  api.get(`/friends/user/${userId}`);

export const getUserTeamsStats = async (userId) => {
  const response = await api.get(`/users/${userId}/teams-stats`);
  return response.data;
};

export const isFriend = (userId) =>
  api.get(`/friends/is-friend/${userId}`);

export const getFriendCount = () =>
  api.get('/friends/count');

// ===== USER VERIFICATION ENDPOINTS =====
export const getMyVerifications = () =>
  api.get('/me/verifications');

export const getUserVerifications = (userId) =>
  api.get(`/users/${userId}/verifications`);

export const createVerification = (formData) =>
  api.post('/me/verifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateVerification = (id, formData) =>
  api.put(`/me/verifications/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteVerification = (id) =>
  api.delete(`/me/verifications/${id}`);

export const getVerificationFile = async (id) => {
  const response = await api.get(`/verifications/${id}/file`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getCommunityMembers = () =>
  api.get('/users/community-members');

export const getCommunityMembersByName = (communityName) =>
  api.get(`/users/community-members/${encodeURIComponent(communityName)}`);

export const searchCommunities = (query) =>
  api.get('/users/search-communities', { params: { query } });

// Team Community APIs
export const getTeamCommunities = () =>
  api.get('/teams/communities');

export const searchTeamCommunities = (query) =>
  api.get('/teams/communities/search', { params: { query } });

export const getTeamsByCommunity = (communityName) =>
  api.get(`/teams/communities/${encodeURIComponent(communityName)}/teams`);

export const getCommunityTeams = () =>
  api.get('/teams/community-teams');

// Get team details without membership restrictions
export const getTeamDetails = (teamId) =>
  api.get(`/teams/${teamId}/details`);

// Workshop API functions
export const getWorkshopFiles = (params = {}) =>
  api.get('/workshop/files', { params });

export const getWorkshopFile = (fileId) =>
  api.get(`/workshop/files/${fileId}`);

export const createWorkshopFile = (fileData) =>
  api.post('/workshop/files', fileData);

export const updateWorkshopFile = (fileId, fileData) =>
  api.put(`/workshop/files/${fileId}`, fileData);

export const deleteWorkshopFile = (fileId) =>
  api.delete(`/workshop/files/${fileId}`);

export const duplicateWorkshopFile = (fileId) =>
  api.post(`/workshop/files/${fileId}/duplicate`);

export const exportWorkshopFile = (fileId, format = 'txt') =>
  api.get(`/workshop/files/${fileId}/export`, { params: { format } });

export const getWorkshopStats = () =>
  api.get('/workshop/stats');

export const getWorkshopCategories = () =>
  api.get('/workshop/categories');

export const getRecentWorkshopFiles = (limit = 5) =>
  api.get('/workshop/recent', { params: { limit } });

export const getFileTypes = () =>
  api.get('/workshop/file-types');

export const getSharedWorkshopFile = (shareToken) =>
  api.get(`/workshop/shared/${shareToken}`);

// ===== COOKIE-BASED AUTHENTICATION FUNCTIONS =====

/**
 * Logout user and clear authentication cookies
 */
export const logout = () =>
  api.post('/auth/cookie/logout');

/**
 * Refresh access token using refresh token from cookie
 */
export const refreshToken = () =>
  api.post('/auth/cookie/refresh');

/**
 * Get authentication status
 */
export const getAuthStatus = () =>
  api.get('/auth/cookie/status');

/**
 * Validate current session
 */
export const validateSession = () =>
  api.get('/auth/cookie/validate');

// ===== SESSION MANAGEMENT FUNCTIONS =====

/**
 * Get current user's active sessions
 */
export const getUserSessions = () =>
  api.get('/sessions');

/**
 * Get current user's session history
 */
export const getUserSessionHistory = (days = 30) =>
  api.get('/sessions/history', { params: { days } });

/**
 * Get current session information
 */
export const getCurrentSession = () =>
  api.get('/sessions/current');

/**
 * Revoke specific session by ID
 */
export const revokeSession = (sessionId) =>
  api.delete(`/sessions/${sessionId}`);

/**
 * Revoke all sessions except current one
 */
export const revokeAllSessions = () =>
  api.delete('/sessions/all');

/**
 * Extend current session expiration
 */
export const extendSession = (hours = 8) =>
  api.post('/sessions/extend', null, { params: { hours } });

/**
 * Get session statistics (admin only)
 */
export const getSessionStats = () =>
  api.get('/sessions/stats');

/**
 * Get all active sessions (admin only)
 */
export const getAllActiveSessions = (page = 0, size = 50) =>
  api.get('/sessions/admin/all', { params: { page, size } });

// ===== UTILITY FUNCTIONS FOR COOKIE AUTH =====

/**
 * Initialize authentication on app startup
 * Checks if user is authenticated and sets up the session
 */
export const initializeAuth = async () => {
  try {
    const response = await validateSession();
    
    if (response.data.authenticated) {
      // Store user data in localStorage for app state (not tokens!)
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } else if (response.data.canRefresh) {
      // Try to refresh the token
      const refreshResponse = await refreshToken();
      localStorage.setItem('user', JSON.stringify(refreshResponse.data.user));
      return refreshResponse.data.user;
    }
    
    return null;
  } catch (error) {
    console.log('Authentication initialization failed:', error);
    localStorage.removeItem('user');
    return null;
  }
};

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = async () => {
  try {
    const response = await getAuthStatus();
    return response.data.authenticated;
  } catch (error) {
    return false;
  }
};

/**
 * Get current user from localStorage (for app state only - no tokens!)
 * Note: This is safe because sensitive tokens are in HttpOnly cookies
 */
export const getCurrentUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Clear user data from localStorage (app state only)
 */
export const clearUserFromStorage = () => {
  localStorage.removeItem('user');
};

// ===== SESSION MANAGEMENT API CALLS =====

/**
 * Extend current session by specified hours
 */
export const extendCurrentSession = (hours = 8) =>
  api.post(`/sessions/extend?hours=${hours}`);

/**
 * Get sessions expiring soon (for proactive notifications)
 */
export const getSessionsExpiringSoon = (minutesAhead = 30) =>
  api.get(`/sessions/expiring-soon?minutes=${minutesAhead}`);

// ===== JOURNAL FOLDER API CALLS =====

/**
 * Create a new folder
 */
export const createFolder = (folderData) =>
  api.post('/folders', folderData);

/**
 * Get all folders for current user
 */
export const getFolders = (page = null, size = null) => {
  const params = new URLSearchParams();
  if (page !== null) params.append('page', page);
  if (size !== null) params.append('size', size);
  
  const queryString = params.toString();
  return api.get(`/folders${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get folder by ID
 */
export const getFolderById = (folderId) =>
  api.get(`/folders/${folderId}`);

/**
 * Update folder
 */
export const updateFolder = (folderId, folderData) =>
  api.put(`/folders/${folderId}`, folderData);

/**
 * Delete folder
 */
export const deleteFolder = (folderId) =>
  api.delete(`/folders/${folderId}`);

/**
 * Search folders by name
 */
export const searchFolders = (searchTerm) =>
  api.get(`/folders/search?q=${encodeURIComponent(searchTerm)}`);

/**
 * Get folder statistics
 */
export const getFolderStats = () =>
  api.get('/folders/stats');

/**
 * Move journal to folder
 */
export const moveJournalToFolder = (folderId, journalId) =>
  api.post(`/folders/${folderId}/journals/${journalId}`);

/**
 * Remove journal from folder (move to no folder)
 */
export const removeJournalFromFolder = (journalId) =>
  api.delete(`/folders/journals/${journalId}`);

/**
 * Get journals in folder
 */
export const getJournalsInFolder = (folderId) =>
  api.get(`/folders/${folderId}/journals`);

export default api;