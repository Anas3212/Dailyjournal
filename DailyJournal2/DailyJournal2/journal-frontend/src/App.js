import React, { Suspense, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CircularProgress, Box, Alert, Button } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AppBar from './components/AppBar';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const UserJournals = React.lazy(() => import('./pages/UserJournals'));
const PublishedJournals = React.lazy(() => import('./pages/PublishedJournals'));
const Teams = React.lazy(() => import('./pages/Teams'));
const TeamDetail = React.lazy(() => import('./pages/TeamDetail'));
const TeamJournals = React.lazy(() => import('./pages/TeamJournals'));
const TeamInvites = React.lazy(() => import('./pages/TeamInvites'));
const TeamConnections = React.lazy(() => import('./pages/TeamConnections'));
const NoticeBoard = React.lazy(() => import('./components/NoticeBoard'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const UserSearchPage = React.lazy(() => import('./pages/UserSearchPage'));
const FriendRequests = React.lazy(() => import('./components/FriendRequests'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Workshop = React.lazy(() => import('./pages/Workshop'));

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          flexDirection="column"
          gap={3}
          p={3}
        >
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            <Box sx={{ mb: 2 }}>
              <strong>Something went wrong!</strong>
            </Box>
            <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Box>
            <Button 
              variant="contained" 
              onClick={this.handleRetry}
              size="small"
            >
              Reload Page
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={40} />
    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      Loading...
    </Box>
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              
              {/* Private Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <AppBar />
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <AppBar />
                  <Profile />
                </PrivateRoute>
              } />
              
              <Route path="/journals" element={
                <PrivateRoute>
                  <AppBar />
                  <UserJournals />
                </PrivateRoute>
              } />
              
              <Route path="/published" element={<Navigate to="/published-journals" replace />} />
              <Route path="/published-journals" element={
                <>
                  <AppBar />
                  <PublishedJournals />
                </>
              } />
              
              <Route path="/workshop" element={
                <PrivateRoute>
                  <AppBar />
                  <Workshop />
                </PrivateRoute>
              } />
              
              <Route path="/teams" element={
                <PrivateRoute>
                  <AppBar />
                  <Teams />
                </PrivateRoute>
              } />
              
              <Route path="/teams/:teamId" element={
                <PrivateRoute>
                  <AppBar />
                  <TeamDetail />
                </PrivateRoute>
              } />
              
              <Route path="/teams/:teamId/journals" element={
                <PrivateRoute>
                  <AppBar />
                  <TeamJournals />
                </PrivateRoute>
              } />
              
              <Route path="/teams/:teamId/connections" element={
                <PrivateRoute>
                  <AppBar />
                  <TeamConnections />
                </PrivateRoute>
              } />
              
              <Route path="/teams/:teamId/notices" element={
                <PrivateRoute>
                  <AppBar />
                  <NoticeBoard />
                </PrivateRoute>
              } />
              
              <Route path="/team-invites" element={
                <PrivateRoute>
                  <AppBar />
                  <TeamInvites />
                </PrivateRoute>
              } />
              
              <Route path="/users/:userId" element={
                <PrivateRoute>
                  <AppBar />
                  <UserProfile />
                </PrivateRoute>
              } />
              
              <Route path="/user-journals/:userId" element={
                <PrivateRoute>
                  <AppBar />
                  <UserJournals />
                </PrivateRoute>
              } />
              
              <Route path="/search-users" element={
                <PrivateRoute>
                  <AppBar />
                  <UserSearchPage />
                </PrivateRoute>
              } />
              
              <Route path="/friend-requests" element={
                <PrivateRoute>
                  <AppBar />
                  <FriendRequests />
                </PrivateRoute>
              } />
              
              <Route path="/admin" element={
                <PrivateRoute>
                  <AppBar />
                  <AdminDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/admin/dashboard" element={
                <PrivateRoute>
                  <AppBar />
                  <AdminDashboard />
                </PrivateRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;