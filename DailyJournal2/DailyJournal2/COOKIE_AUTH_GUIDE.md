# 🍪 Cookie-Based JWT Authentication Implementation

## Overview

This implementation provides a **production-ready, secure cookie-based JWT authentication system** that addresses the security vulnerabilities of localStorage-based token storage. The system uses HttpOnly cookies to store JWT tokens, preventing XSS attacks and providing automatic token refresh capabilities.

## 🔒 Security Features

### ✅ Production-Ready Security
- **HttpOnly Cookies**: Tokens stored in HttpOnly cookies, inaccessible to JavaScript
- **XSS Protection**: Tokens cannot be stolen via XSS attacks
- **CSRF Protection**: SameSite cookie attribute prevents CSRF attacks
- **Automatic Refresh**: Seamless token refresh without user intervention
- **No Token Leaks**: No tokens exposed in localStorage or sessionStorage

### 🔄 Token Strategy
- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (30 days) for token renewal
- **Automatic Rotation**: New access tokens issued automatically
- **Secure Logout**: Both tokens cleared on logout

## 📁 Implementation Structure

### Backend Components

```
src/main/java/com/dailyjournal/
├── security/
│   ├── CookieJWTService.java      # Enhanced JWT service for cookies
│   └── CookieJWTFilter.java       # Authentication filter supporting both methods
├── service/
│   └── CookieAuthService.java     # Cookie-based authentication logic
├── controller/
│   └── CookieAuthController.java  # Cookie auth endpoints
└── config/
    └── CookieSecurityConfig.java  # Enhanced security configuration
```

### Frontend Components

```
src/
├── services/
│   └── cookieApi.js              # Cookie-based API client
├── hooks/
│   └── useCookieAuth.js          # React authentication hooks
└── components/
    └── auth/                     # Authentication components (to be created)
```

## 🚀 Backend Implementation

### 1. CookieJWTService
Enhanced JWT service that handles both access and refresh tokens with secure cookie management.

**Key Features:**
- Generates short-lived access tokens (15 minutes)
- Generates long-lived refresh tokens (30 days)
- Sets secure HttpOnly cookies with proper attributes
- Extracts tokens from cookies safely
- Handles token validation and expiration

### 2. CookieAuthService
Business logic for cookie-based authentication operations.

**Key Features:**
- User registration with cookie setup
- Login with automatic token generation
- Token refresh using refresh cookies
- Secure logout with cookie clearing
- Authentication status checking

### 3. CookieJWTFilter
Enhanced authentication filter supporting both cookie and header-based authentication.

**Key Features:**
- Backward compatibility with existing header auth
- Cookie-based authentication as primary method
- Automatic fallback to header auth if needed
- Proper security context setup

### 4. API Endpoints

#### Authentication Endpoints
```
POST /api/auth/cookie/register  # Register with cookies
POST /api/auth/cookie/login     # Login with cookies
POST /api/auth/cookie/refresh   # Refresh access token
POST /api/auth/cookie/logout    # Logout and clear cookies
GET  /api/auth/cookie/status    # Check auth status
GET  /api/auth/cookie/validate  # Validate session
```

## 🌐 Frontend Implementation

### 1. Cookie API Service
Axios-based API client configured for cookie authentication.

**Features:**
- Automatic cookie handling with `withCredentials: true`
- Automatic token refresh on 401 responses
- Interceptors for seamless authentication
- All existing API methods adapted for cookies

### 2. Authentication Hooks
React hooks for managing authentication state.

**Available Hooks:**
- `useCookieAuth()`: Main authentication hook
- `useAuth()`: Simplified auth hook for components
- `withCookieAuth()`: HOC for protecting routes

### 3. Usage Examples

#### Basic Login Component
```jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useCookieAuth';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    
    if (result.success) {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required 
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required 
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

#### App Setup with Provider
```jsx
import React from 'react';
import { CookieAuthProvider } from './hooks/useCookieAuth';
import App from './App';

const Root = () => (
  <CookieAuthProvider>
    <App />
  </CookieAuthProvider>
);

export default Root;
```

#### Protected Route Component
```jsx
import React from 'react';
import { useCookieAuth } from '../hooks/useCookieAuth';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useCookieAuth();

  if (!isAuthenticated()) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
```

## ⚙️ Configuration

### Backend Configuration
Add to `application.properties`:
```properties
# Cookie-based JWT Configuration (Production Ready)
jwt.access-token-expiration=900000
# Access token: 15 minutes (900,000 ms)
jwt.refresh-token-expiration=2592000000
# Refresh token: 30 days (2,592,000,000 ms)
```

### Frontend Configuration
Update axios configuration in `cookieApi.js`:
```javascript
const cookieApi = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // Essential for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 🔄 Migration Guide

### From localStorage to Cookie Authentication

#### 1. Backend Migration
The new system is **fully backward compatible**. Existing endpoints continue to work while new cookie endpoints are available at `/api/auth/cookie/*`.

#### 2. Frontend Migration
```javascript
// Old way (localStorage)
import { login, register } from './services/api';

// New way (cookies)
import { cookieLogin, cookieRegister } from './services/cookieApi';
```

#### 3. Gradual Migration Strategy
1. Deploy backend with both systems active
2. Update frontend components one by one
3. Test thoroughly in development
4. Deploy to production
5. Monitor for any issues
6. Eventually deprecate localStorage endpoints (optional)

## 🧪 Testing

### Backend Testing
```bash
# Test registration
curl -X POST http://localhost:8080/api/auth/cookie/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Test login
curl -X POST http://localhost:8080/api/auth/cookie/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Test authenticated endpoint
curl -X GET http://localhost:8080/api/users/me \
  -b cookies.txt

# Test token refresh
curl -X POST http://localhost:8080/api/auth/cookie/refresh \
  -b cookies.txt

# Test logout
curl -X POST http://localhost:8080/api/auth/cookie/logout \
  -b cookies.txt
```

### Frontend Testing
```javascript
// Test authentication flow
import { cookieLogin, getAuthStatus } from './services/cookieApi';

const testAuth = async () => {
  // Login
  const loginResult = await cookieLogin('test@example.com', 'password123');
  console.log('Login:', loginResult.data);
  
  // Check status
  const status = await getAuthStatus();
  console.log('Status:', status.data);
};
```

## 🛡️ Security Considerations

### Production Deployment
1. **Enable HTTPS**: Set `COOKIE_SECURE = true` in production
2. **Update CORS**: Configure proper allowed origins
3. **Environment Variables**: Use secure JWT secrets
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Monitoring**: Monitor for authentication failures

### Security Headers
```javascript
// Recommended security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## 📊 Benefits Summary

| Feature | localStorage | Cookie Auth |
|---------|-------------|-------------|
| XSS Protection | ❌ Vulnerable | ✅ Protected |
| CSRF Protection | ✅ Not applicable | ✅ SameSite cookies |
| Auto Refresh | ❌ Manual | ✅ Automatic |
| Multi-tab Support | ✅ Shared | ✅ Shared |
| Mobile Support | ✅ Good | ✅ Excellent |
| Production Ready | ⚠️ Risky | ✅ Enterprise-grade |

## 🚀 Next Steps

1. **Deploy Backend**: The backend is ready for production
2. **Update Frontend**: Gradually migrate frontend components
3. **Test Thoroughly**: Test all authentication flows
4. **Monitor Performance**: Monitor token refresh patterns
5. **Security Audit**: Conduct security review before production

## 📞 Support

For questions or issues with the cookie-based authentication implementation:
1. Check the browser's Network tab for cookie headers
2. Verify CORS configuration for `withCredentials`
3. Ensure backend endpoints are accessible
4. Check browser console for authentication errors

---

**🎉 Congratulations!** You now have a production-ready, secure cookie-based JWT authentication system that protects against XSS attacks and provides seamless user experience.
