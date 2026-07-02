import React, { useState, useEffect } from 'react';
import { 
  cookieLogin, 
  cookieRegister, 
  cookieLogout, 
  getAuthStatus, 
  validateSession,
  cookieRefresh 
} from '../../services/cookieApi';

/**
 * Cookie Authentication Test Component
 * Use this component to test the cookie-based authentication system
 */
const CookieAuthTest = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await getAuthStatus();
      setAuthStatus(response.data);
      setMessage(`Auth Status: ${response.data.authenticated ? 'Authenticated' : 'Not Authenticated'}`);
    } catch (error) {
      setMessage(`Error checking auth status: ${error.message}`);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await cookieRegister(formData.name, formData.email, formData.password);
      setMessage(`Registration successful: ${JSON.stringify(response.data, null, 2)}`);
      await checkAuthStatus();
    } catch (error) {
      setMessage(`Registration failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await cookieLogin(formData.email, formData.password);
      setMessage(`Login successful: ${JSON.stringify(response.data, null, 2)}`);
      await checkAuthStatus();
    } catch (error) {
      setMessage(`Login failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await cookieLogout();
      setMessage(`Logout successful: ${JSON.stringify(response.data, null, 2)}`);
      await checkAuthStatus();
    } catch (error) {
      setMessage(`Logout failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await cookieRefresh();
      setMessage(`Token refresh successful: ${JSON.stringify(response.data, null, 2)}`);
      await checkAuthStatus();
    } catch (error) {
      setMessage(`Token refresh failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateSession = async () => {
    setLoading(true);
    try {
      const response = await validateSession();
      setMessage(`Session validation: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setMessage(`Session validation failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🍪 Cookie Authentication Test</h2>
      
      {/* Current Auth Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: authStatus?.authenticated ? '#d4edda' : '#f8d7da',
        border: `1px solid ${authStatus?.authenticated ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '5px'
      }}>
        <h3>Current Status</h3>
        <p><strong>Authenticated:</strong> {authStatus?.authenticated ? 'Yes' : 'No'}</p>
        {authStatus?.user && (
          <div>
            <p><strong>User:</strong> {authStatus.user.name} ({authStatus.user.email})</p>
            <p><strong>Admin:</strong> {authStatus.user.isAdmin ? 'Yes' : 'No'}</p>
          </div>
        )}
        {authStatus?.tokenExpiry && (
          <p><strong>Token Expires:</strong> {new Date(authStatus.tokenExpiry).toLocaleString()}</p>
        )}
      </div>

      {/* Test Form */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Credentials</h3>
        <div style={{ display: 'grid', gap: '10px', maxWidth: '300px' }}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRegister} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Register
          </button>
          
          <button 
            onClick={handleLogin} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Login
          </button>
          
          <button 
            onClick={handleLogout} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Logout
          </button>
          
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Refresh Token
          </button>
          
          <button 
            onClick={handleValidateSession} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#6f42c1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Validate Session
          </button>
          
          <button 
            onClick={checkAuthStatus} 
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Check Status
          </button>
        </div>
      </div>

      {/* Response Message */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Response</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px', 
          border: '1px solid #e9ecef',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {loading ? 'Loading...' : message}
        </pre>
      </div>

      {/* Instructions */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d7ff', 
        borderRadius: '5px' 
      }}>
        <h3>🧪 Test Instructions</h3>
        <ol>
          <li><strong>Register:</strong> Create a new user account with cookies</li>
          <li><strong>Login:</strong> Authenticate and receive access/refresh tokens in cookies</li>
          <li><strong>Check Status:</strong> Verify authentication status using cookies</li>
          <li><strong>Refresh Token:</strong> Test automatic token refresh functionality</li>
          <li><strong>Validate Session:</strong> Check if session is valid and can be refreshed</li>
          <li><strong>Logout:</strong> Clear authentication cookies</li>
        </ol>
        
        <h4>🔍 What to Check</h4>
        <ul>
          <li>Open browser DevTools → Application → Cookies</li>
          <li>Look for <code>access_token</code> and <code>refresh_token</code> cookies</li>
          <li>Verify cookies are <strong>HttpOnly</strong> and have proper attributes</li>
          <li>Test token refresh before access token expires (15 minutes)</li>
          <li>Verify logout clears both cookies</li>
        </ul>
      </div>
    </div>
  );
};

export default CookieAuthTest;
