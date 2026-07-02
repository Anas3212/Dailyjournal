# 🔄 Frontend Token Migration Plan

## 📊 **Summary of localStorage Token Usage**

Found **22 files** with **47 instances** of localStorage token usage that need migration.

---

## 🚨 **CRITICAL FILES (Must Fix First)**

### **1. `context/AuthContext.js` - REPLACE ENTIRELY**

**Current Issues:**
```javascript
// Lines 9, 24, 33, 42 - Complete token management
const [token, setToken] = useState(localStorage.getItem('token'));
localStorage.setItem('token', res.data.token);
localStorage.removeItem('token');
```

**✅ Solution: Replace with new useAuth hook**
```javascript
// DELETE this entire file and use hooks/useAuth.js instead
// Update all components using AuthContext to use useAuth hook
```

### **2. `services/api.js` - UPDATE FILE UPLOAD**

**Current Issue (Line 122):**
```javascript
const token = localStorage.getItem('token');
const res = await fetch(`${API_BASE}/journals/${journalId}/upload`, {
  headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
```

**✅ Solution:**
```javascript
// Update to use withCredentials for cookies
const res = await fetch(`${API_BASE}/journals/${journalId}/upload`, {
  method: 'POST',
  credentials: 'include', // Use cookies instead
  body: formData,
});
```

---

## 🔄 **COMPONENT MIGRATION (Update These Files)**

### **Report System Components**

#### **`components/ViewReportsDialog.js`**
**Line 37:** `const token = localStorage.getItem('token');`
```javascript
// ❌ REMOVE:
const token = localStorage.getItem('token');
const response = await axios.get(`http://localhost:8080/api/reports/my-journal/${journalId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ REPLACE WITH:
import api from '../services/api';
const response = await api.get(`/reports/my-journal/${journalId}`);
```

#### **`components/ReportDialog.js`**
**Lines 72, 102, 139:** Multiple token usages
```javascript
// ❌ REMOVE ALL:
const token = localStorage.getItem('token');
// Manual axios calls with Authorization headers

// ✅ REPLACE WITH:
import api from '../services/api';
// Use api.get(), api.post(), api.delete() methods
```

### **Media & File Components**

#### **`components/MediaViewer.js`**
**Lines 39, 76:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`components/JournalViewer.js`**
**Lines 52, 115:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`components/JournalsTable.js`**
**Line 508:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`components/PublishedJournalViewer.js`**
**Lines 90, 118, 158, 231:** Multiple token usages
```javascript
// ❌ REMOVE ALL:
'Authorization': `Bearer ${token}`

// ✅ REPLACE WITH:
credentials: 'include'
```

### **Permission & Editor Components**

#### **`components/JournalPermissionError.js`**
**Line 46:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
import api from '../services/api';
const response = await api.get(`/journal-editors/journal/${journalId}`);
```

#### **`components/JournalEditorAssignment.js`**
**Lines 83, 107, 139:** Multiple token usages
```javascript
// ❌ REMOVE ALL:
const token = localStorage.getItem('token');
// Manual fetch calls

// ✅ REPLACE WITH:
import api from '../services/api';
// Use api methods
```

### **Notice Board System**

#### **`components/NoticeBoard.js`**
**Lines 51, 133, 216, 230, 300, 370, 387:** Extensive token usage
```javascript
// ❌ REMOVE ALL:
const token = localStorage.getItem('token');
headers: { Authorization: `Bearer ${token}` }

// ✅ REPLACE WITH:
import api from '../services/api';
// Convert all axios calls to use api service
```

### **Page Components**

#### **`pages/Dashboard.js`**
**Lines 493, 626:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${token}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`pages/Profile.js`**
**Line 567:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`pages/PublishedJournals.js`**
**Lines 113, 380:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${token}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`pages/UserJournals.js`**
**Line 229:** Token in fetch headers
```javascript
// ❌ REMOVE:
headers: { 'Authorization': `Bearer ${token}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`pages/AdminReports.js`**
**Lines 87, 105, 122:** Multiple token usages
```javascript
// ❌ REMOVE ALL:
headers: { 'Authorization': `Bearer ${token}` }

// ✅ REPLACE WITH:
import api from '../services/api';
// Use api methods instead of direct axios calls
```

#### **`pages/TeamJournals.js`**
**Lines 181, 275, 496:** Multiple token usages
```javascript
// ❌ REMOVE ALL:
headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

#### **`pages/TeamDetail.js`**
**Line 276:** Token in fetch headers
```javascript
// ❌ REMOVE:
const token = localStorage.getItem('token');
headers: { Authorization: `Bearer ${token}` }

// ✅ REPLACE WITH:
credentials: 'include'
```

---

## 📋 **MIGRATION CHECKLIST**

### **Phase 1: Core Infrastructure**
- [ ] ✅ **Updated `services/api.js`** (Already done)
- [ ] ✅ **Created `hooks/useAuth.js`** (Already done)
- [ ] 🔄 **Replace `context/AuthContext.js`** with useAuth hook
- [ ] 🔄 **Update file upload in `services/api.js`**

### **Phase 2: Component Updates**
- [ ] 🔄 **Update Report Components** (2 files)
- [ ] 🔄 **Update Media Components** (4 files)  
- [ ] 🔄 **Update Permission Components** (2 files)
- [ ] 🔄 **Update Notice Board** (1 file)

### **Phase 3: Page Updates**
- [ ] 🔄 **Update Main Pages** (4 files)
- [ ] 🔄 **Update Team Pages** (2 files)

### **Phase 4: Testing**
- [ ] 🧪 **Test Authentication Flow**
- [ ] 🧪 **Test File Uploads**
- [ ] 🧪 **Test Media Access**
- [ ] 🧪 **Test Report System**
- [ ] 🧪 **Test Notice Board**

---

## 🔧 **MIGRATION PATTERNS**

### **Pattern 1: Replace Direct API Calls**
```javascript
// ❌ OLD PATTERN:
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:8080/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ NEW PATTERN:
import api from '../services/api';
const response = await api.get('/endpoint');
```

### **Pattern 2: Replace Axios Calls**
```javascript
// ❌ OLD PATTERN:
const token = localStorage.getItem('token');
const response = await axios.get('/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ NEW PATTERN:
import api from '../services/api';
const response = await api.get('/endpoint');
```

### **Pattern 3: Replace Fetch with Credentials**
```javascript
// ❌ OLD PATTERN:
fetch(url, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})

// ✅ NEW PATTERN:
fetch(url, {
  credentials: 'include'
})
```

### **Pattern 4: Replace AuthContext Usage**
```javascript
// ❌ OLD PATTERN:
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
const { token, user, login, logout } = useContext(AuthContext);

// ✅ NEW PATTERN:
import { useAuth } from '../hooks/useAuth';
const { user, login, logout, isAuthenticated } = useAuth();
```

---

## ⚠️ **IMPORTANT NOTES**

1. **AuthContext.js is the most critical** - Replace this first
2. **Test each component** after migration to ensure cookies work
3. **Remove all manual Authorization headers** - cookies handle this automatically
4. **Use the centralized api service** instead of direct fetch/axios calls
5. **Verify cookies are set** in browser DevTools after login

---

## 🎯 **EXPECTED OUTCOME**

After migration:
- ✅ **No localStorage token access** anywhere in the codebase
- ✅ **All API calls use cookies** automatically
- ✅ **Enhanced security** with HttpOnly cookies
- ✅ **Automatic token refresh** on expiration
- ✅ **Simplified authentication** management

**Total files to update: 22 files**
**Total localStorage.getItem('token') instances to remove: 47**
