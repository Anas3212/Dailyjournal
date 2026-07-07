import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}`}/api`;

/**
 * Cookie-based API service for secure authentication
 * Uses HttpOnly cookies instead of localStorage for enhanced security
 */
const cookieApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Essential for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor to handle token refresh automatically
cookieApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the request is already a refresh request to prevent infinite loops
    const isRefreshRequest = originalRequest?.url?.includes('/auth/cookie/refresh');

    // Only retry on 401 (Unauthorized / token expired) — NOT 403 (Forbidden = permission denied)
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return cookieApi(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function (resolve, reject) {
        cookieApi.post('/auth/cookie/refresh')
          .then(({ data }) => {
            processQueue(null, data);
            resolve(cookieApi(originalRequest));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            // Refresh failed, redirect to login or handle as needed
            console.log('Token refresh failed, user needs to login again');

            // Clear any authentication state
            localStorage.removeItem('user');

            window.dispatchEvent(new Event('auth-failed'));
            // You can dispatch a logout action here if using Redux/Context
            // or redirect to login page
            window.location.href = '/login';

            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // If the refresh request itself fails with 401, redirect to login
    if (error.response?.status === 401 && isRefreshRequest) {
      console.log('Refresh token expired, user needs to login again');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-failed'));
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION ENDPOINTS =====

/**
 * Register new user with cookie-based authentication
 */
export const cookieRegister = (name, email, password) =>
  cookieApi.post('/auth/cookie/register', { name, email, password });

/**
 * Login user with cookie-based authentication
 */
export const cookieLogin = (email, password) =>
  cookieApi.post('/auth/cookie/login', { email, password });

/**
 * Refresh access token using refresh token from cookie
 */
export const cookieRefresh = () =>
  cookieApi.post('/auth/cookie/refresh');

/**
 * Logout user and clear authentication cookies
 */
export const cookieLogout = () =>
  cookieApi.post('/auth/cookie/logout');

/**
 * Get authentication status
 */
export const getAuthStatus = () =>
  cookieApi.get('/auth/cookie/status');

/**
 * Validate current session
 */
export const validateSession = () =>
  cookieApi.get('/auth/cookie/validate');

// ===== USER ENDPOINTS =====

export const getCurrentUser = () =>
  cookieApi.get('/users/me');

export const updateProfile = (data) =>
  cookieApi.put('/users/update', data);

export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return cookieApi.post('/users/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllUsers = () =>
  cookieApi.get('/users/all');

export const searchUsers = (query) =>
  cookieApi.get(`/users/search?query=${encodeURIComponent(query)}`);

export const getCommunityMembers = () =>
  cookieApi.get('/users/community-members');

export const searchCommunities = (query) =>
  cookieApi.get(`/users/search-communities?query=${encodeURIComponent(query)}`);

// ===== JOURNAL ENDPOINTS =====

export const getJournals = () =>
  cookieApi.get('/journals');

export const createJournal = (journalData) =>
  cookieApi.post('/journals', journalData);

export const updateJournal = (id, journalData) =>
  cookieApi.put(`/journals/${id}`, journalData);

export const deleteJournal = (id) =>
  cookieApi.delete(`/journals/${id}`);

export const publishJournal = (id) =>
  cookieApi.post(`/journals/${id}/publish`);

export const unpublishJournal = (id) =>
  cookieApi.post(`/journals/${id}/unpublish`);

export const getPublishedJournals = () =>
  cookieApi.get('/journals/published');

export const uploadJournalMedia = (journalId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  return cookieApi.post(`/journals/${journalId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteJournalMedia = (journalId, filename) =>
  cookieApi.delete(`/journals/${journalId}/media?fileUrl=${encodeURIComponent(filename)}`);

// ===== TEAM ENDPOINTS =====

export const getMyTeams = () =>
  cookieApi.get('/teams/my-teams');

export const createTeam = (teamData) =>
  cookieApi.post('/teams', teamData);

export const updateTeam = (id, teamData) =>
  cookieApi.put(`/teams/${id}`, teamData);

export const deleteTeam = (id) =>
  cookieApi.delete(`/teams/${id}`);

export const inviteToTeam = (teamId, email, message) =>
  cookieApi.post(`/teams/${teamId}/invite`, { email, message });

export const getTeamInvitations = () =>
  cookieApi.get('/teams/invitations');

export const respondToInvitation = (invitationId, accept) =>
  cookieApi.post(`/teams/invitations/${invitationId}/respond`, { accept });

// ===== WORKSHOP ENDPOINTS =====

export const getWorkshopFiles = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return cookieApi.get(`/workshop/files${queryString ? `?${queryString}` : ''}`);
};

export const createWorkshopFile = (fileData) =>
  cookieApi.post('/workshop/files', fileData);

export const updateWorkshopFile = (id, fileData) =>
  cookieApi.put(`/workshop/files/${id}`, fileData);

export const deleteWorkshopFile = (id) =>
  cookieApi.delete(`/workshop/files/${id}`);

// ===== UTILITY FUNCTIONS =====

/**
 * Initialize authentication on app startup
 * Checks if user is authenticated and sets up the session
 */
export const initializeAuth = async () => {
  try {
    const response = await validateSession();

    if (response.data.authenticated) {
      // Store user data in localStorage for app state
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } else if (response.data.canRefresh) {
      // Try to refresh the token
      const refreshResponse = await cookieRefresh();
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
 * Get current user from localStorage (for app state)
 * Note: This is safe because sensitive data is in HttpOnly cookies
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
 * Clear user data from localStorage
 */
export const clearUserFromStorage = () => {
  localStorage.removeItem('user');
};

export default cookieApi;
